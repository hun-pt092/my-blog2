import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

async function initDb() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Connect to the database
    const client = await pool.connect();
    console.log('Connected to CockroachDB cluster');

    // Create database schema
    await client.query(`
      CREATE DATABASE IF NOT EXISTS blog;
    `);

    await client.query(`
      USE blog;
    `);
    
    // Create posts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        content TEXT NOT NULL,
        excerpt TEXT,
        coverImage TEXT,
        coverWidth INT,
        coverHeight INT,
        date TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP,
        categories TEXT[],
        created_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    // Create comments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        author TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP
      );
    `);

    // Create index on post_id for faster comment retrieval
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
    `);

    console.log('Database initialized successfully');
    client.release();
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    await pool.end();
  }
}

initDb().catch(console.error);
