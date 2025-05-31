import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seedSimpleComments() {
  const client = await pool.connect();
  
  try {
    console.log('Adding sample comments...');
    
    // Get post ID for "he-phan-tan"
    const postResult = await client.query(
      'SELECT id FROM posts WHERE slug = $1',
      ['he-phan-tan']
    );
    
    if (postResult.rows.length === 0) {
      console.log('Post not found');
      return;
    }
    
    const postId = postResult.rows[0].id;
    console.log(`Post ID: ${postId}`);
    
    // Clear existing comments first
    await client.query('DELETE FROM comments WHERE post_id = $1', [postId]);
    
    // Add sample comments
    const comments = [
      {
        author: 'Nguyễn Văn An',
        content: 'Bài viết rất hay và chi tiết! Cảm ơn tác giả.',
        likes: 15,
        dislikes: 1
      },
      {
        author: 'Trần Thị Bình', 
        content: 'Có thể giải thích thêm về CAP theorem không ạ?',
        likes: 8,
        dislikes: 0
      },
      {
        author: 'Lê Minh Cường',
        content: 'Excellent explanation! The diagrams really help.',
        likes: 22,
        dislikes: 0
      },
      {
        author: 'Phạm Thu Dung',
        content: 'Phần về consistency models có thể detail hơn được không?',
        likes: 12,
        dislikes: 2
      }
    ];
    
    for (const comment of comments) {
      await client.query(
        'INSERT INTO comments (post_id, author, content, likes, dislikes) VALUES ($1, $2, $3, $4, $5)',
        [postId, comment.author, comment.content, comment.likes, comment.dislikes]
      );
      console.log(`✓ Added comment by ${comment.author}`);
    }
    
    console.log('✅ Sample comments added successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

seedSimpleComments();
