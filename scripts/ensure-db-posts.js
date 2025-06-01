// Script to ensure all markdown files have corresponding database entries with correct slugs
import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function ensureDbPosts() {
  const pool = new Pool({
    connectionString: getDatabaseUrl(),
  });

  try {
    const client = await pool.connect();
    console.log('Connected to CockroachDB cluster for post verification');

    // Use blog database
    await client.query(`USE blog;`);

    // Check if blog database exists
    const dbCheck = await client.query(`
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'posts'
    `);
    
    if (dbCheck.rows.length === 0) {
      console.log('Posts table not found. Please run db-init.js first.');
      return;
    }

    // Get list of markdown files
    const postsDir = path.join(__dirname, '..', 'src', 'lib', 'posts');
    const files = fs.readdirSync(postsDir).filter(file => file.endsWith('.md'));

    console.log(`Found ${files.length} markdown files to check`);
    console.log('Ensuring all files are in the database...');

    const addedFiles = [];
    const existingFiles = [];    for (const file of files) {
      const filePath = path.join(postsDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      // Get filename without extension as default slug
      const fileSlug = file.slice(0, -3);
      
      // Try to extract title from frontmatter
      let title = fileSlug;
      const titleMatch = fileContent.match(/title:\s*"?([^"\n]+)"?/m);
      if (titleMatch) {
        title = titleMatch[1];
      }
      
      // Try to extract custom slug from frontmatter
      const slugMatch = fileContent.match(/slug:\s*"?([^"\n]+)"?/m);
      const metaSlug = slugMatch ? slugMatch[1] : null;
      
      // Check if post with file slug exists in database
      const fileSlugCheck = await client.query(
        'SELECT id FROM posts WHERE slug = $1',
        [fileSlug]
      );
      
      // Also check if post with metadata slug exists
      let metaSlugCheck = { rows: [] };
      if (metaSlug) {
        metaSlugCheck = await client.query(
          'SELECT id FROM posts WHERE slug = $1',
          [metaSlug]
        );
      }      // Default content if we can't extract it from the file
      const defaultContent = `Content for ${title || fileSlug}`;
      
      // Get content from the file
      let contentText = '';
      try {
        // Read content after frontmatter
        const contentMatch = fileContent.split(/---\r?\n/);
        if (contentMatch && contentMatch.length > 2) {
          contentText = contentMatch.slice(2).join('---\n');
        }
      } catch (e) {
        console.log(`Could not extract content from ${file}, using default`);
      }
        // Use content from file or default if empty
      const finalContent = contentText.trim() || defaultContent;

      // If neither exists, add the file slug to database
      if (fileSlugCheck.rows.length === 0) {
        const id = uuidv4();
        await client.query(
          'INSERT INTO posts (id, title, slug, date, content) VALUES ($1, $2, $3, $4, $5)',
          [id, title, fileSlug, new Date().toISOString(), finalContent]
        );
        console.log(`✓ Added post with slug "${fileSlug}" (ID: ${id})`);
        addedFiles.push(fileSlug);
      } else {
        console.log(`✓ Post with slug "${fileSlug}" already exists (ID: ${fileSlugCheck.rows[0].id})`);
        existingFiles.push(fileSlug);
      }
      
      // If metadata slug doesn't exist and is different from file slug, add it too
      if (metaSlug && metaSlug !== fileSlug && metaSlugCheck.rows.length === 0) {
        const id = uuidv4();
        await client.query(
          'INSERT INTO posts (id, title, slug, date, content) VALUES ($1, $2, $3, $4, $5)',
          [id, title, metaSlug, new Date().toISOString(), finalContent]
        );
        console.log(`✓ Added post with meta slug "${metaSlug}" (ID: ${id})`);
        addedFiles.push(metaSlug);
      } else if (metaSlug && metaSlug !== fileSlug) {
        console.log(`✓ Post with meta slug "${metaSlug}" already exists (ID: ${metaSlugCheck.rows[0].id})`);
        existingFiles.push(metaSlug);
      }
    }

    console.log('\n=== Summary ===');
    console.log(`Total files checked: ${files.length}`);
    console.log(`Already in database: ${existingFiles.length}`);
    console.log(`Newly added: ${addedFiles.length}`);

    if (addedFiles.length > 0) {
      console.log('\nNew posts added:');
      addedFiles.forEach(slug => console.log(`- ${slug}`));
    }

    console.log('\nAll posts have been verified in the database.');

  } catch (error) {
    console.error('Error ensuring database posts:', error);
  } finally {
    await pool.end();
  }
}

// Run the function
ensureDbPosts();
