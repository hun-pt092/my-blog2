import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

async function seedDb() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const client = await pool.connect();
    console.log('Connected to CockroachDB cluster for seeding');

    // Read markdown files from lib/posts directory
    const postsDir = path.join(__dirname, '..', 'src', 'lib', 'posts');
    const mdFiles = fs.readdirSync(postsDir).filter(file => file.endsWith('.md'));

    // Use blog database
    await client.query(`USE blog;`);

    // Process each file
    for (const file of mdFiles) {
      const content = fs.readFileSync(path.join(postsDir, file), 'utf-8');
      
      // Extract metadata from frontmatter
      const metadataMatch = content.match(/---\n([\s\S]*?)\n---/);
      if (!metadataMatch) continue;

      const metadataStr = metadataMatch[1];
      
      // Parse metadata
      const title = metadataStr.match(/title: "(.*?)"/)?.[1];
      const date = metadataStr.match(/date: "(.*?)"/)?.[1];
      const excerpt = metadataStr.match(/excerpt: "(.*?)"/)?.[1];
      const coverImage = metadataStr.match(/coverImage: "(.*?)"/)?.[1];
      const coverWidth = Number(metadataStr.match(/coverWidth: (\d+)/)?.[1] || 0);
      const coverHeight = Number(metadataStr.match(/coverHeight: (\d+)/)?.[1] || 0);
      const categoriesMatch = metadataStr.match(/categories:\n([\s\S]*?)(?=\n\w|$)/);
      
      const categories = categoriesMatch
        ? categoriesMatch[1].split('\n')
            .map(line => line.trim())
            .filter(line => line.startsWith('- '))
            .map(line => line.slice(2))
        : [];
        
      // Extract the slug from the filename
      const slug = file.slice(0, -3); // Remove .md extension
      
      // Get the content without frontmatter
      const contentWithoutFrontmatter = content.replace(/---\n[\s\S]*?\n---/, '').trim();

      // Check if post with this slug already exists
      const existingPost = await client.query(
        'SELECT id FROM posts WHERE slug = $1', 
        [slug]
      );

      if (existingPost.rows.length === 0) {
        // Insert the post
        const result = await client.query(
          `INSERT INTO posts 
           (title, slug, content, excerpt, coverImage, coverWidth, coverHeight, date, categories) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
           RETURNING id`,
          [title, slug, contentWithoutFrontmatter, excerpt, coverImage, coverWidth, coverHeight, 
           date ? new Date(date) : new Date(), categories]
        );
        console.log(`Inserted post: ${title} with ID: ${result.rows[0].id}`);
      } else {
        console.log(`Post with slug "${slug}" already exists, skipping`);
      }
    }

    console.log('Database seeded successfully');
    client.release();
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    await pool.end();
  }
}

seedDb().catch(console.error);
