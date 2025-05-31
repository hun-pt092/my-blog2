import dotenv from 'dotenv';
import db from '../src/lib/db.js';

dotenv.config();

async function seedCommentsWithVotes() {
  try {
    console.log('Seeding comments with sample data...');

    // Get the post ID for "he-phan-tan" 
    const postResult = await db.query(
      'SELECT id FROM posts WHERE slug = $1',
      ['he-phan-tan']
    );

    if (postResult.rows.length === 0) {
      console.log('Post "he-phan-tan" not found, creating it...');
      
      const createPostResult = await db.query(
        `INSERT INTO posts (title, slug, content, excerpt, date) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING id`,
        [
          'Hệ Phân Tán',
          'he-phan-tan',
          'Nội dung về hệ phân tán...',
          'Tìm hiểu về hệ phân tán',
          new Date()
        ]
      );
      
      postId = createPostResult.rows[0].id;
    } else {
      postId = postResult.rows[0].id;
    }

    console.log(`Found/Created post with ID: ${postId}`);

    // Sample comments data
    const sampleComments = [
      {
        author: 'Nguyễn Văn An',
        content: 'Bài viết rất hay và chi tiết! Mình đã hiểu rõ hơn về hệ phân tán. Cảm ơn tác giả đã chia sẻ.',
        likes: 15,
        dislikes: 1
      },
      {
        author: 'Trần Thị Bình',
        content: 'Có thể giải thích thêm về CAP theorem không ạ? Mình vẫn chưa hiểu rõ lắm.',
        likes: 8,
        dislikes: 0
      },
      {
        author: 'Lê Minh Cường',
        content: 'Excellent explanation! The diagrams really help visualize the concepts. Looking forward to more posts like this.',
        likes: 22,
        dislikes: 0
      },
      {
        author: 'Phạm Thu Dung',
        content: 'Phần về consistency models có thể detail hơn được không? Mình muốn tìm hiểu sâu hơn về Eventually Consistent.',
        likes: 12,
        dislikes: 2
      },
      {
        author: 'Hoàng Đức Em',
        content: 'Hay quá! Mình đang học về microservices và bài này giúp ích rất nhiều. 👍',
        likes: 18,
        dislikes: 0
      },
      {
        author: 'Vũ Thị Linh',
        content: 'Có thể recommend thêm một số sách về distributed systems không ạ?',
        likes: 6,
        dislikes: 0
      },
      {
        author: 'Đỗ Văn Giang',
        content: 'Phần về load balancing strategies cần update thêm về modern approaches như service mesh.',
        likes: 9,
        dislikes: 1
      },
      {
        author: 'Bùi Thành Huy',
        content: 'Great content! But I think the examples could be more practical. Maybe add some code snippets?',
        likes: 14,
        dislikes: 3
      }
    ];

    // Insert comments
    const insertedComments = [];
    for (const comment of sampleComments) {
      const result = await db.query(
        `INSERT INTO comments (post_id, author, content, likes, dislikes, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING id, author, content, likes, dislikes, created_at`,
        [
          postId, 
          comment.author, 
          comment.content, 
          comment.likes, 
          comment.dislikes,
          new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random date within last week
        ]
      );
      
      insertedComments.push(result.rows[0]);
      console.log(`✓ Created comment by ${comment.author} with ${comment.likes} likes`);
    }

    // Add some sample votes
    console.log('\nAdding sample votes...');
    const sampleVoters = [
      'user_voter1', 'user_voter2', 'user_voter3', 'user_voter4', 'user_voter5',
      'user_viewer1', 'user_viewer2', 'user_viewer3', 'user_reader1', 'user_reader2'
    ];

    for (const comment of insertedComments) {
      // Add random likes
      const numLikes = Math.min(comment.likes, 10); // Limit sample votes
      for (let i = 0; i < numLikes; i++) {
        try {
          await db.query(
            'INSERT INTO comment_votes (comment_id, user_identifier, vote_type) VALUES ($1, $2, $3)',
            [comment.id, sampleVoters[i % sampleVoters.length] + '_like_' + i, 'like']
          );
        } catch (err) {
          // Ignore duplicate votes
        }
      }

      // Add random dislikes
      const numDislikes = Math.min(comment.dislikes, 3);
      for (let i = 0; i < numDislikes; i++) {
        try {
          await db.query(
            'INSERT INTO comment_votes (comment_id, user_identifier, vote_type) VALUES ($1, $2, $3)',
            [comment.id, sampleVoters[i % sampleVoters.length] + '_dislike_' + i, 'dislike']
          );
        } catch (err) {
          // Ignore duplicate votes
        }
      }
    }

    console.log('\n🎉 Successfully seeded comments with votes!');
    console.log(`Created ${insertedComments.length} comments for post "${postId}"`);
    
    // Show summary
    const totalComments = await db.query('SELECT COUNT(*) as count FROM comments WHERE post_id = $1', [postId]);
    const totalLikes = await db.query('SELECT SUM(likes) as total FROM comments WHERE post_id = $1', [postId]);
    const totalVotes = await db.query('SELECT COUNT(*) as count FROM comment_votes');
    
    console.log(`\nSummary:`);
    console.log(`- Total comments: ${totalComments.rows[0].count}`);
    console.log(`- Total likes: ${totalLikes.rows[0].total || 0}`);
    console.log(`- Total votes recorded: ${totalVotes.rows[0].count}`);

  } catch (error) {
    console.error('Error seeding comments:', error);
  } finally {
    await db.end();
  }
}

let postId;
seedCommentsWithVotes();
