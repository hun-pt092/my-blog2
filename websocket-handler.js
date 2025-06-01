// Websocket handler cho WebSocket
import dotenv from 'dotenv';
import db from './src/lib/db.js';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import { Counter, Histogram, register } from 'prom-client';

dotenv.config();

const NODE_ID = process.env.NODE_ID || '1';

// Khởi tạo Redis client
const pubClient = createClient({ url: process.env.REDIS_URL || 'redis://redis:6379' });
const subClient = pubClient.duplicate();

// Khởi tạo metrics cho Prometheus
const wsConnectionsCounter = new Counter({
  name: 'websocket_connections_total',
  help: 'Total count of WebSocket connections',
  labelNames: ['node_id']
});

const wsDisconnectsCounter = new Counter({
  name: 'websocket_disconnects_total',
  help: 'Total count of WebSocket disconnections',
  labelNames: ['node_id']
});

const commentsCounter = new Counter({
  name: 'comments_total',
  help: 'Total count of comments submitted',
  labelNames: ['node_id', 'status']
});

const commentLatency = new Histogram({
  name: 'comment_latency_seconds',
  help: 'Latency of comment processing in seconds',
  labelNames: ['node_id']
});

// Function để thiết lập WebSocket server
const setupWebsocket = async (io) => {
  try {
    // Kết nối Redis và thiết lập adapter cho Socket.IO
    await Promise.all([pubClient.connect(), subClient.connect()]);
    console.log(`[Node ${NODE_ID}] Kết nối Redis thành công`);
    
    // Thiết lập Redis adapter cho Socket.IO
    io.adapter(createAdapter(pubClient, subClient));
    console.log(`[Node ${NODE_ID}] Redis adapter đã được thiết lập cho Socket.IO`);
  } catch (error) {
    console.error(`[Node ${NODE_ID}] Lỗi kết nối Redis:`, error);
    console.log(`[Node ${NODE_ID}] Socket.IO sẽ hoạt động mà không có Redis adapter`);
  }

  // Lưu trữ các user đang kết nối
  const connectedUsers = new Map();

  io.on('connection', (socket) => {
    // Đếm metrics kết nối
    wsConnectionsCounter.inc({ node_id: NODE_ID });
    console.log(`[Node ${NODE_ID}] Client connected: ${socket.id}`);

    // Xử lý khi client đăng ký theo dõi một bài viết
    socket.on('join_post', (postSlug) => {
      socket.join(`post:${postSlug}`);
      console.log(`[Node ${NODE_ID}] Client ${socket.id} joined post: ${postSlug}`);
    });

    // Xử lý khi client rời phòng
    socket.on('leave_post', (postSlug) => {
      socket.leave(`post:${postSlug}`);
      console.log(`[Node ${NODE_ID}] Client ${socket.id} left post: ${postSlug}`);
    });    // Xử lý khi nhận bình luận mới
    socket.on('new_comment', async (data) => {
      // Đo thời gian xử lý bình luận
      const commentTimer = commentLatency.startTimer({ node_id: NODE_ID });
      
      try {
        // Lưu bình luận vào database
        const { post_id, author, content, postSlug } = data;
            // Validate dữ liệu
        if (!postSlug || !author || !content) {
          socket.emit('comment_error', { error: 'Invalid comment data' });
          commentsCounter.inc({ node_id: NODE_ID, status: 'invalid' });
          commentTimer();
          return;
        }

        // Insert vào database
        try {
          const result = await db.query(
            `INSERT INTO comments (post_id, author, content) 
             VALUES ($1, $2, $3) 
             RETURNING id, post_id, author, content, created_at`,
            [post_id, author, content]
          );

          const newComment = result.rows[0];
          
          // Phát lại bình luận đến tất cả các client đang theo dõi bài viết
          io.to(`post:${postSlug}`).emit('comment_added', {
            id: newComment.id,
            post_id: newComment.post_id,
            author: newComment.author,
            content: newComment.content,
            created_at: newComment.created_at
          });          console.log(`[Node ${NODE_ID}] New comment added to post ${postSlug}`);
          
          // Ghi nhận metrics cho bình luận thành công
          commentsCounter.inc({ node_id: NODE_ID, status: 'success' });
          commentTimer();
        } catch (dbError) {
          console.error(`[Node ${NODE_ID}] Database error:`, dbError);
          
          // Trường hợp không kết nối được database, vẫn phát sự kiện bình luận
          // (nhưng không lưu vào database)
          const mockComment = {
            id: Date.now().toString(),
            post_id: post_id,
            author: author,
            content: content,
            created_at: new Date().toISOString()
          };
          
          io.to(`post:${postSlug}`).emit('comment_added', mockComment);
          console.log(`[Node ${NODE_ID}] Mock comment emitted for post ${postSlug} due to DB error`);
          
          // Ghi nhận metrics cho bình luận thành công nhưng có lỗi database
          commentsCounter.inc({ node_id: NODE_ID, status: 'db_error' });
          commentTimer();
        }
      } catch (error) {
        console.error(`[Node ${NODE_ID}] Error adding comment:`, error);
        socket.emit('comment_error', { error: 'Failed to add comment' });
      }    });

    // Xử lý vote events
    socket.on('comment_voted', (data) => {
      const { postSlug, commentId, voteType, operation, likes, dislikes } = data;
      
      console.log(`[Node ${NODE_ID}] Vote event for comment ${commentId}: ${voteType} (${operation})`);
      
      // Broadcast vote update to all clients watching this post
      socket.to(`post:${postSlug}`).emit('comment_vote_updated', {
        commentId,
        voteType,
        operation,
        likes,
        dislikes
      });
    });

    // Xử lý khi client ngắt kết nối
    socket.on('disconnect', () => {
      console.log(`[Node ${NODE_ID}] Client disconnected: ${socket.id}`);
      connectedUsers.delete(socket.id);
    });
  });
};

export default setupWebsocket;
