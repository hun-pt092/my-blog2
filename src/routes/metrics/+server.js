// src/routes/metrics/+server.js
import { register, collectDefaultMetrics } from 'prom-client';
import db from '$lib/db';

// Khởi tạo các metrics mặc định
collectDefaultMetrics();

/** @type {import('./$types').RequestHandler} */
export async function GET() {
  try {
    // Thêm metrics cho cơ sở dữ liệu
    try {
      const dbResult = await db.query('SELECT count(*) FROM posts');
      const postCount = parseInt(dbResult.rows[0].count);
      
      const dbGauge = register.getSingleMetric('db_posts_total');
      if (!dbGauge) {
        const gauge = new register.Gauge({
          name: 'db_posts_total',
          help: 'Total number of blog posts'
        });
        gauge.set(postCount);
      } else {
        dbGauge.set(postCount);
      }
      
      // Đếm số bình luận
      const commentsResult = await db.query('SELECT count(*) FROM comments');
      const commentCount = parseInt(commentsResult.rows[0].count);
      
      const commentGauge = register.getSingleMetric('db_comments_total');
      if (!commentGauge) {
        const gauge = new register.Gauge({
          name: 'db_comments_total',
          help: 'Total number of comments'
        });
        gauge.set(commentCount);
      } else {
        commentGauge.set(commentCount);
      }
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
