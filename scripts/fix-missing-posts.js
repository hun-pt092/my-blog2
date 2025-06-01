// Script to fix missing posts by adding both filename-based and metadata-based slugs
import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

async function fixMissingPosts() {
  const pool = new Pool({
    connectionString: getDatabaseUrl(),
  });

  try {
    const client = await pool.connect();
    console.log('Connected to CockroachDB cluster for post repair');

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

    // Read markdown files from lib/posts directory
    const postsDir = path.join(__dirname, '..', 'src', 'lib', 'posts');
    
    if (!fs.existsSync(postsDir)) {
      console.error(`Posts directory not found: ${postsDir}`);
      return;
    }

    const mdFiles = fs.readdirSync(postsDir).filter(file => file.endsWith('.md'));
    
    if (mdFiles.length === 0) {
      console.log('No markdown files found.');
      return;
    }

    console.log(`Found ${mdFiles.length} markdown files to check`);
    console.log('Ensuring all files are accessible by both filename and metadata slug...');

    // Track results
    const added = [];
    const alreadyExisted = [];
    const fixed = [];
    
    // Process each file
    for (const file of mdFiles) {
      const filename = file.slice(0, -3); // Remove .md extension
      const filenameSlug = filename; // Use filename as one possible slug
      
      // Read the file content
      const content = fs.readFileSync(path.join(postsDir, file), 'utf-8');
      
      // Extract metadata from frontmatter
      const metadataMatch = content.match(/---\n([\s\S]*?)\n---/);
      if (!metadataMatch) {
        console.log(`No metadata found in ${file}, using filename as slug`);
        
        // Check if post with filename slug already exists
        const existingPost = await client.query(
          'SELECT id FROM posts WHERE slug = $1', 
          [filenameSlug]
        );
        
        if (existingPost.rows.length === 0) {
          // Add post with filename as slug
          const result = await client.query(
            `INSERT INTO posts 
             (title, slug, content, date)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
            [filename, filenameSlug, content, new Date()]
          );
          
          added.push({ slug: filenameSlug, id: result.rows[0].id });
          console.log(`✅ Added post with filename slug "${filenameSlug}" (ID: ${result.rows[0].id})`);
        } else {
          alreadyExisted.push({ slug: filenameSlug, id: existingPost.rows[0].id });
          console.log(`✓ Post with slug "${filenameSlug}" already exists (ID: ${existingPost.rows[0].id})`);
        }
        continue;
      }
      
      const metadataStr = metadataMatch[1];
      
      // Extract metadata values with improved regex that handles quoted and unquoted values
      const titleMatch = metadataStr.match(/title: ["']?(.*?)["']?$/m);
      const dateMatch = metadataStr.match(/date: ["']?(.*?)["']?$/m);
      const excerptMatch = metadataStr.match(/excerpt: ["']?(.*?)["']?$/m);
      const coverImageMatch = metadataStr.match(/coverImage: ["']?(.*?)["']?$/m);
      const slugMatch = metadataStr.match(/slug: ["']?(.*?)["']?$/m);
      
      const title = titleMatch ? titleMatch[1].replace(/['"]/g, '') : filename;
      const date = dateMatch ? dateMatch[1].replace(/['"]/g, '') : new Date().toISOString();
      const excerpt = excerptMatch ? excerptMatch[1].replace(/['"]/g, '') : '';
      const coverImage = coverImageMatch ? coverImageMatch[1].replace(/['"]/g, '') : '';
      
      // Get metadata slug if available
      const metadataSlug = slugMatch ? slugMatch[1].replace(/['"]/g, '') : null;
      
      // Get content without frontmatter
      const contentWithoutFrontmatter = content.replace(/---\n[\s\S]*?\n---/, '').trim();

      // Handle categories
      const categoriesMatch = metadataStr.match(/categories:\s*\[(.*?)\]/);
      let categories = [];
      
      if (categoriesMatch) {
        categories = categoriesMatch[1].split(',')
          .map(cat => cat.trim().replace(/['"]/g, ''))
          .filter(Boolean);
      }
      
      // CASE 1: Check if post with filename slug exists
      const filenamePostExists = await client.query(
        'SELECT id FROM posts WHERE slug = $1',
        [filenameSlug]
      );
      
      // CASE 2: If metadata slug exists, check if post with that slug exists
      let metadataPostExists = { rows: [] };
      if (metadataSlug) {
        metadataPostExists = await client.query(
          'SELECT id FROM posts WHERE slug = $1',
          [metadataSlug]
        );
      }
      
      // If neither exists, add both
      if (filenamePostExists.rows.length === 0 && 
          (!metadataSlug || metadataPostExists.rows.length === 0)) {
        
        console.log(`Adding post with both slugs: "${filenameSlug}" and "${metadataSlug || 'N/A'}"`);
        
        // Add with filename slug
        const result1 = await client.query(
          `INSERT INTO posts 
           (title, slug, content, excerpt, coverImage, date, categories) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) 
           RETURNING id`,
          [title, filenameSlug, contentWithoutFrontmatter, excerpt, coverImage, 
           date ? new Date(date) : new Date(), categories]
        );
        
        added.push({ slug: filenameSlug, id: result1.rows[0].id });
        console.log(`✅ Added post with filename slug "${filenameSlug}" (ID: ${result1.rows[0].id})`);
        
        // If metadata slug exists and is different, add that too
        if (metadataSlug && metadataSlug !== filenameSlug) {
          const result2 = await client.query(
            `INSERT INTO posts 
             (title, slug, content, excerpt, coverImage, date, categories) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             RETURNING id`,
            [title, metadataSlug, contentWithoutFrontmatter, excerpt, coverImage, 
             date ? new Date(date) : new Date(), categories]
          );
          
          added.push({ slug: metadataSlug, id: result2.rows[0].id });
          console.log(`✅ Added post with metadata slug "${metadataSlug}" (ID: ${result2.rows[0].id})`);
        }
      }
      // If only one exists, add the other
      else if (filenamePostExists.rows.length === 0) {
        console.log(`Adding missing filename slug "${filenameSlug}"`);
        
        const result = await client.query(
          `INSERT INTO posts 
           (title, slug, content, excerpt, coverImage, date, categories) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) 
           RETURNING id`,
          [title, filenameSlug, contentWithoutFrontmatter, excerpt, coverImage, 
           date ? new Date(date) : new Date(), categories]
        );
        
        fixed.push({ slug: filenameSlug, id: result.rows[0].id });
        console.log(`✅ Fixed by adding filename slug "${filenameSlug}" (ID: ${result.rows[0].id})`);
      }
      else if (metadataSlug && metadataSlug !== filenameSlug && metadataPostExists.rows.length === 0) {
        console.log(`Adding missing metadata slug "${metadataSlug}"`);
        
        const result = await client.query(
          `INSERT INTO posts 
           (title, slug, content, excerpt, coverImage, date, categories) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) 
           RETURNING id`,
          [title, metadataSlug, contentWithoutFrontmatter, excerpt, coverImage, 
           date ? new Date(date) : new Date(), categories]
        );
        
        fixed.push({ slug: metadataSlug, id: result.rows[0].id });
        console.log(`✅ Fixed by adding metadata slug "${metadataSlug}" (ID: ${result.rows[0].id})`);
      }
      // Both exist
      else {
        if (filenamePostExists.rows.length > 0) {
          alreadyExisted.push({ slug: filenameSlug, id: filenamePostExists.rows[0].id });
          console.log(`✓ Post with filename slug "${filenameSlug}" already exists (ID: ${filenamePostExists.rows[0].id})`);
        }
        
        if (metadataSlug && metadataPostExists.rows.length > 0) {
          alreadyExisted.push({ slug: metadataSlug, id: metadataPostExists.rows[0].id });
          console.log(`✓ Post with metadata slug "${metadataSlug}" already exists (ID: ${metadataPostExists.rows[0].id})`);
        }
      }
    }

    console.log('\n=== Summary ===');
    console.log(`Total files checked: ${mdFiles.length}`);
    console.log(`Already in database: ${alreadyExisted.length}`);
    console.log(`Newly added: ${added.length}`);
    console.log(`Fixed missing slugs: ${fixed.length}`);

    if (added.length > 0) {
      console.log('\nNewly added posts:');
      added.forEach(post => console.log(`- ${post.slug} (ID: ${post.id})`));
    }

    if (fixed.length > 0) {
      console.log('\nFixed posts:');
      fixed.forEach(post => console.log(`- ${post.slug} (ID: ${post.id})`));
    }

    console.log('\nAll posts are now accessible by both filename and metadata slug.');
    client.release();
  } catch (err) {
    console.error('Error fixing posts in database:', err);
  } finally {
    await pool.end();
  }
}

// Run the function
fixMissingPosts().catch(console.error);
