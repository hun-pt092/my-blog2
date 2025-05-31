// src/routes/metrics/+server.js
import client from 'prom-client';
import db from '$lib/db';

const { register, collectDefaultMetrics, Gauge } = client;

// Khởi tạo các metrics mặc định
collectDefaultMetrics();

// Khởi tạo các gauge metrics
const dbPostsGauge = new Gauge({
  name: 'db_posts_total',
  help: 'Total number of blog posts'
});

const dbCommentsGauge = new Gauge({
  name: 'db_comments_total',
  help: 'Total number of comments'
});

// Đăng ký metrics
register.registerMetric(dbPostsGauge);
register.registerMetric(dbCommentsGauge);

/** @type {import('./$types').RequestHandler} */
export async function GET() {
  try {    // Cập nhật metrics cho cơ sở dữ liệu
    try {
      const dbResult = await db.query('SELECT count(*) FROM posts');
      const postCount = parseInt(dbResult.rows[0].count);
      dbPostsGauge.set(postCount);
      
      // Đếm số bình luận
      const commentsResult = await db.query('SELECT count(*) FROM comments');
      const commentCount = parseInt(commentsResult.rows[0].count);
      dbCommentsGauge.set(commentCount);
    } catch (error) {
      console.error('Error collecting DB metrics:', error);
    }
    
    // Trả về metrics theo định dạng mặc định
    const metrics = await register.metrics();
    
    return new Response(metrics, {
      headers: {
        'Content-Type': register.contentType
      }
    });
  } catch (error) {
    console.error('Error generating metrics:', error);
    return new Response('Error generating metrics', { status: 500 });
  }
}
