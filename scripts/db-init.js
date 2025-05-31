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
    `);    // Create index on post_id for faster comment retrieval
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
    `);

    // Create index on posts slug for faster post retrieval
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
    `);

    // Create index on posts date for sorting
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_posts_date ON posts(date DESC);
    `);

    // Create sessions table for WebSocket session management (optional)
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id TEXT UNIQUE NOT NULL,
        user_name TEXT,
        node_id TEXT,
        connected_at TIMESTAMP NOT NULL DEFAULT now(),
        last_activity TIMESTAMP NOT NULL DEFAULT now(),
        is_active BOOLEAN DEFAULT true
      );
    `);

    // Create index on session_id for faster session lookup
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON user_sessions(session_id);
    `);

    // Create real-time events table for distributed event logging
    await client.query(`
      CREATE TABLE IF NOT EXISTS real_time_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_type TEXT NOT NULL,
        post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
        user_session TEXT,
        node_id TEXT,
        event_data JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    // Create index on events for analytics
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_events_post_type ON real_time_events(post_id, event_type);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_events_created_at ON real_time_events(created_at DESC);
    `);

    // Insert some sample data if posts table is empty
    const postCount = await client.query(`SELECT COUNT(*) FROM posts;`);
    
    if (postCount.rows[0].count === '0') {
      console.log('Inserting sample blog posts...');
      
      // Sample post 1
      await client.query(`
        INSERT INTO posts (title, slug, content, excerpt, categories)
        VALUES (
          'Chào mừng đến với Blog phân tán',
          'chao-mung-blog-phan-tan',
          '# Chào mừng đến với Blog phân tán

Đây là bài viết đầu tiên trên hệ thống blog phân tán sử dụng CockroachDB và SvelteKit.

## Tính năng chính:
- **Phân tán**: Dữ liệu được lưu trữ trên nhiều node CockroachDB
- **Real-time**: Bình luận được cập nhật thời gian thực qua WebSocket
- **Fault-tolerant**: Hệ thống có khả năng chịu lỗi cao
- **Scalable**: Có thể mở rộng dễ dàng

Hãy thử bình luận vào bài viết này để test tính năng real-time!',
          'Bài viết giới thiệu về hệ thống blog phân tán với CockroachDB và SvelteKit',
          ARRAY['Hệ thống phân tán', 'CockroachDB', 'SvelteKit']
        );
      `);

      // Sample post 2
      await client.query(`
        INSERT INTO posts (title, slug, content, excerpt, categories)
        VALUES (
          'Kiến trúc hệ thống phân tán',
          'kien-truc-he-thong-phan-tan',
          '# Kiến trúc hệ thống phân tán

## Các thành phần chính:

### 1. CockroachDB Cluster
- 3 node CockroachDB để đảm bảo tính khả dụng cao
- Replication factor = 3
- Tự động failover

### 2. SvelteKit Backend
- 2 instance backend để load balancing
- WebSocket cho real-time comments
- Redis adapter để đồng bộ WebSocket giữa các node

### 3. Load Balancer
- Nginx làm reverse proxy
- Health check tự động
- Session sticky cho WebSocket

### 4. Monitoring
- Prometheus thu thập metrics
- Grafana dashboard (optional)

Kiến trúc này đảm bảo tính sẵn sàng cao và khả năng mở rộng.',
          'Tìm hiểu về kiến trúc của hệ thống blog phân tán',
          ARRAY['Kiến trúc', 'Distributed Systems', 'Microservices']
        );
      `);
      
      console.log('Sample posts inserted successfully');
    }

    console.log('Database initialized successfully');
    client.release();
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    await pool.end();
  }
}

initDb().catch(console.error);
