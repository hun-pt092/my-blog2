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

async function seedDb() {
  const pool = new Pool({
    connectionString: getDatabaseUrl(),
  });

  try {
    const client = await pool.connect();
    console.log('Connected to CockroachDB cluster for seeding');

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
      console.log(`Posts directory not found: ${postsDir}`);
      console.log('Creating sample posts instead...');
      
      // Create sample posts if no markdown files exist
      await createSamplePosts(client);
      client.release();
      return;
    }

    const mdFiles = fs.readdirSync(postsDir).filter(file => file.endsWith('.md'));
    
    if (mdFiles.length === 0) {
      console.log('No markdown files found. Creating sample posts...');
      await createSamplePosts(client);
      client.release();
      return;
    }

    console.log(`Found ${mdFiles.length} markdown files to process`);

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

// Function to create sample posts if no markdown files exist
async function createSamplePosts(client) {
  const samplePosts = [
    {
      title: 'Test Real-time Comments',
      slug: 'test-real-time-comments',
      content: `# Test Real-time Comments

Đây là bài viết để test tính năng bình luận thời gian thực.

## Hướng dẫn test:
1. Mở nhiều tab browser cùng lúc
2. Vào cùng bài viết này
3. Thêm bình luận từ một tab
4. Quan sát bình luận xuất hiện ngay lập tức trên các tab khác

## Kiến trúc WebSocket:
- Socket.IO server chạy trên port 3001
- Redis adapter để đồng bộ giữa các node backend
- Load balancer với sticky session cho WebSocket

Hãy thử bình luận ngay bây giờ!`,
      excerpt: 'Bài viết để test tính năng bình luận thời gian thực trên hệ thống phân tán',
      categories: ['Test', 'Real-time', 'WebSocket']
    },
    {
      title: 'Distributed Database với CockroachDB',
      slug: 'distributed-database-cockroachdb',
      content: `# Distributed Database với CockroachDB

CockroachDB là database phân tán mạnh mẽ, được thiết kế để chịu được lỗi và mở rộng dễ dàng.

## Ưu điểm của CockroachDB:

### 1. Consistency
- ACID transactions
- Serializable isolation
- Strong consistency across nodes

### 2. Availability
- Automatic failover
- No single point of failure
- Self-healing capabilities

### 3. Partition Tolerance
- Horizontal scaling
- Automatic data distribution
- Geographic distribution support

## Cấu hình trong project:
- 3 node cluster
- Replication factor = 3
- Automatic load balancing

Database này đảm bảo dữ liệu blog của chúng ta luôn sẵn sàng và nhất quán!`,
      excerpt: 'Tìm hiểu về CockroachDB và cách sử dụng trong hệ thống blog phân tán',
      categories: ['Database', 'CockroachDB', 'Distributed Systems']
    },
    {
      title: 'Load Balancing với Nginx',
      slug: 'load-balancing-nginx',
      content: `# Load Balancing với Nginx

Nginx đóng vai trò quan trọng trong kiến trúc hệ thống phân tán.

## Chức năng chính:

### 1. Reverse Proxy
- Route requests đến backend servers
- SSL termination
- Request buffering

### 2. Load Balancing
- Round-robin distribution
- Health checks
- Failover automatic

### 3. WebSocket Support
- Upgrade connection handling
- Session sticky cho WebSocket
- Connection pooling

## Cấu hình trong project:
\`\`\`nginx
upstream backend_servers {
    server blog-backend1:3000;
    server blog-backend2:3000;
    ip_hash;
}

upstream websocket_servers {
    server blog-backend1:3001;
    server blog-backend2:3001;
    ip_hash;
}
\`\`\`

Cấu hình này đảm bảo traffic được phân phối đều và WebSocket connection ổn định.`,
      excerpt: 'Tìm hiểu về cách sử dụng Nginx để load balancing trong hệ thống phân tán',
      categories: ['Load Balancing', 'Nginx', 'Infrastructure']
    }
  ];

  for (const post of samplePosts) {
    try {
      // Check if post exists
      const existingPost = await client.query(
        'SELECT id FROM posts WHERE slug = $1', 
        [post.slug]
      );

      if (existingPost.rows.length === 0) {
        const result = await client.query(
          `INSERT INTO posts 
           (title, slug, content, excerpt, categories) 
           VALUES ($1, $2, $3, $4, $5) 
           RETURNING id`,
          [post.title, post.slug, post.content, post.excerpt, post.categories]
        );
        console.log(`✓ Created sample post: ${post.title} (ID: ${result.rows[0].id})`);
      } else {
        console.log(`○ Sample post "${post.title}" already exists, skipping`);
      }
    } catch (err) {
      console.error(`✗ Error creating sample post "${post.title}":`, err.message);
    }
  }
}

seedDb().catch(console.error);
