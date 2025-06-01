import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const postsDir = path.join(__dirname, '../src/lib/posts');
const { Pool } = pg;

// Auto-detect environment and set appropriate database URL
function getDatabaseUrl() {
  // Check if we're running inside Docker
  const isDocker = process.env.IS_DOCKER === 'true' || process.env.NODE_ENV === 'docker';
  
  if (isDocker) {
    // Running inside Docker - use docker hostname
    return process.env.DATABASE_URL || 'postgresql://root@cockroach1:26257/blog?sslmode=disable';
  } else {
    // Running outside Docker - use localhost
    return process.env.DATABASE_URL_LOCAL || 'postgresql://root@localhost:26257/blog?sslmode=disable';
  }
}

async function fixPosts() {
  const client = new Pool({
    connectionString: getDatabaseUrl(),
  });

  try {
    console.log('Connected to CockroachDB cluster to fix posts');
    
    // Get all markdown files
    const files = fs.readdirSync(postsDir)
      .filter(file => file.endsWith('.md'));
    
    console.log(`Found ${files.length} markdown files to fix`);
    
    for (const file of files) {
      const fileSlug = file.slice(0, -3); // Remove .md extension
      const filePath = path.join(postsDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      
      // Parse title from frontmatter
      let title = fileSlug;
      const titleMatch = fileContent.match(/title:[ ]*["']?(.*?)['"]?$/m);
      if (titleMatch && titleMatch[1]) {
        title = titleMatch[1].trim();
      }
      
      // Parse metadata slug if available
      let metaSlug = null;
      const slugMatch = fileContent.match(/slug:[ ]*["']?(.*?)['"]?$/m);
      if (slugMatch && slugMatch[1]) {
        metaSlug = slugMatch[1].trim();
      }
      
      // Get content for the database
      let contentText = '';
      try {
        // Extract content after frontmatter
        const parts = fileContent.split(/---\r?\n/);
        if (parts.length > 2) {
          contentText = parts.slice(2).join('---\n').trim();
        }
      } catch (e) {
        console.log(`Could not extract content from ${file}`);
      }
      
      // Use filename as content if extraction failed
      const finalContent = contentText || `Content for ${fileSlug}`;
      
      try {
        // Check if post with this slug exists
        const result = await client.query(
          'SELECT id FROM posts WHERE slug = $1',
          [fileSlug]
        );
        
        if (result.rows.length === 0) {
          // Add post with file slug
          const id = uuidv4();
          await client.query(
            'INSERT INTO posts (id, title, slug, date, content) VALUES ($1, $2, $3, $4, $5)',
            [id, title, fileSlug, new Date().toISOString(), finalContent]
          );
          console.log(`Added post with slug "${fileSlug}" (ID: ${id})`);
        } else {
          console.log(`Post with slug "${fileSlug}" already exists (ID: ${result.rows[0].id})`);
        }
        
        // If metadata slug exists and is different, add it too
        if (metaSlug && metaSlug !== fileSlug) {
          const metaResult = await client.query(
            'SELECT id FROM posts WHERE slug = $1',
            [metaSlug]
          );
          
          if (metaResult.rows.length === 0) {
            // Add post with meta slug
            const id = uuidv4();
            await client.query(
              'INSERT INTO posts (id, title, slug, date, content) VALUES ($1, $2, $3, $4, $5)',
              [id, title, metaSlug, new Date().toISOString(), finalContent]
            );
            console.log(`Added post with meta slug "${metaSlug}" (ID: ${id})`);
          } else {
            console.log(`Post with meta slug "${metaSlug}" already exists (ID: ${metaResult.rows[0].id})`);
          }
        }
      } catch (error) {
        console.error(`Error processing file ${file}:`, error);
      }
    }
    
    console.log('All posts have been fixed!');
  } catch (error) {
    console.error('Error fixing posts:', error);
  } finally {
    await client.end();
  }
}

fixPosts();
