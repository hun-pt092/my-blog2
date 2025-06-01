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

async function ensureAllPosts() {
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
    console.log('Ensuring all files are in the database...');

    // Track results
    const added = [];
    const alreadyExisted = [];

    // Process each file
    for (const file of mdFiles) {      // Read file content
      const content = fs.readFileSync(path.join(postsDir, file), 'utf-8');
      
      // Extract metadata from frontmatter
      const metadataMatch = content.match(/---\n([\s\S]*?)\n---/);
      if (!metadataMatch) {
        console.log(`No metadata found in ${file}, skipping`);
        continue;
      }
      
      const metadataStr = metadataMatch[1];
      
      // Try to find slug in metadata or use filename
      let slug;
      const slugMatch = metadataStr.match(/slug: ["']?(.*?)["']?$/m);
      if (slugMatch && slugMatch[1]) {
        slug = slugMatch[1].replace(/['"]/g, ''); // Remove any quotes
        console.log(`Using metadata slug: ${slug} for file ${file}`);
      } else {
        // Fallback to filename if no slug in metadata
        slug = file.slice(0, -3);
        console.log(`Using filename as slug: ${slug}`);
      }
      
      // Check if post with this slug already exists
      const existingPost = await client.query(
        'SELECT id FROM posts WHERE slug = $1', 
        [slug]
      );

      if (existingPost.rows.length === 0) {
        // Post doesn't exist in DB, let's add it
        
        // Parse metadata - improved regex to handle quotes and no quotes
        const titleMatch = metadataStr.match(/title: ["']?(.*?)["']?$/m);
        const dateMatch = metadataStr.match(/date: ["']?(.*?)["']?$/m);
        const excerptMatch = metadataStr.match(/excerpt: ["']?(.*?)["']?$/m);
        const coverImageMatch = metadataStr.match(/coverImage: ["']?(.*?)["']?$/m);
        
        const title = titleMatch ? titleMatch[1].replace(/['"]/g, '') : slug;
        const date = dateMatch ? dateMatch[1].replace(/['"]/g, '') : new Date().toISOString();
        const excerpt = excerptMatch ? excerptMatch[1].replace(/['"]/g, '') : '';
        const coverImage = coverImageMatch ? coverImageMatch[1].replace(/['"]/g, '') : '';
        const coverWidth = Number(metadataStr.match(/coverWidth: (\d+)/)?.[1] || 0);
        const coverHeight = Number(metadataStr.match(/coverHeight: (\d+)/)?.[1] || 0);
        
        // Handle categories
        const categoriesMatch = metadataStr.match(/categories:\s*\[(.*?)\]/);
        let categories = [];
        
        if (categoriesMatch) {
          categories = categoriesMatch[1].split(',')
            .map(cat => cat.trim().replace(/"/g, ''))
            .filter(Boolean);
        }
        
        // Get the content without frontmatter
        const contentWithoutFrontmatter = content.replace(/---\n[\s\S]*?\n---/, '').trim();

        // Insert the post with the EXACT filename as slug (important!)
        const result = await client.query(
          `INSERT INTO posts 
           (title, slug, content, excerpt, coverImage, coverWidth, coverHeight, date, categories) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
           RETURNING id`,
          [title, slug, contentWithoutFrontmatter, excerpt, coverImage, coverWidth, coverHeight, 
           date ? new Date(date) : new Date(), categories]
        );
        
        added.push({ slug, id: result.rows[0].id });
        console.log(`✅ Added post: ${title} with slug "${slug}" (ID: ${result.rows[0].id})`);
      } else {
        alreadyExisted.push({ slug, id: existingPost.rows[0].id });
        console.log(`✓ Post with slug "${slug}" already exists (ID: ${existingPost.rows[0].id})`);
      }
    }

    console.log('\n=== Summary ===');
    console.log(`Total files checked: ${mdFiles.length}`);
    console.log(`Already in database: ${alreadyExisted.length}`);
    console.log(`Newly added: ${added.length}`);

    if (added.length > 0) {
      console.log('\nNewly added posts:');
      added.forEach(post => console.log(`- ${post.slug} (ID: ${post.id})`));
    }

    console.log('\nAll posts have been verified in the database.');
    client.release();
  } catch (err) {
    console.error('Error ensuring posts in database:', err);
  } finally {
    await pool.end();
  }
}

// Run the function
ensureAllPosts().catch(console.error);
