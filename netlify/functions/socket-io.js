// Socket.IO serverless function cho Netlify
const { createServer } = require('http');
const { Server } = require('socket.io');
const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');

// Thiết lập server HTTP
const server = createServer();

// Thiết lập Socket.IO với CORS cho Netlify
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  path: '/.netlify/functions/socket-io'
});

// Kết nối Redis nếu có biến môi trường
let pubClient, subClient;

// Cố gắng kết nối với Redis nếu có URL cung cấp
if (process.env.REDIS_URL) {
  try {
    pubClient = createClient({ url: process.env.REDIS_URL });
    subClient = pubClient.duplicate();

    // Thiết lập adapter Redis khi kết nối thành công
    Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
      io.adapter(createAdapter(pubClient, subClient));
      console.log('Redis adapter được cấu hình thành công');
    }).catch(err => {
      console.error('Không thể kết nối tới Redis:', err);
    });
  } catch (error) {
    console.error('Lỗi khởi tạo Redis client:', error);
  }
}

// Quản lý danh sách người dùng đang online theo phòng
const onlineUsers = new Map();

// Xử lý kết nối Socket.IO
io.on('connection', (socket) => {
  console.log('Người dùng mới kết nối:', socket.id);
  
  // Gửi thông tin node cho client
  socket.emit('node_info', {
    nodeId: process.env.NODE_ID || 'netlify',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production'
  });

  // Xử lý ping
  socket.on('ping', (_, callback) => {
    if (typeof callback === 'function') {
      callback();
    }
  });

  // Xử lý tham gia phòng (bài viết)
  socket.on('join_post', (postId) => {
    if (!postId) return;
    
    console.log(`Người dùng ${socket.id} tham gia bài viết ${postId}`);
    socket.join(postId);
    
    // Cập nhật danh sách người dùng đang online
    if (!onlineUsers.has(postId)) {
      onlineUsers.set(postId, new Set());
    }
    onlineUsers.get(postId).add(socket.id);
    
    // Thông báo số người dùng đang online
    io.to(postId).emit('online_users', {
      count: onlineUsers.get(postId).size,
      postId
    });
  });
  
  // Xử lý rời phòng (bài viết)
  socket.on('leave_post', (postId) => {
    if (!postId) return;
    
    console.log(`Người dùng ${socket.id} rời bài viết ${postId}`);
    socket.leave(postId);
    
    // Cập nhật danh sách người dùng đang online
    if (onlineUsers.has(postId)) {
      onlineUsers.get(postId).delete(socket.id);
      
      // Thông báo số người dùng đang online
      io.to(postId).emit('online_users', {
        count: onlineUsers.get(postId).size,
        postId
      });
    }
  });
  
  // Xử lý tin nhắn mới (bình luận)
  socket.on('new_comment', (data) => {
    if (!data || !data.postId) return;
    
    console.log(`Bình luận mới tại bài viết ${data.postId}`);
    
    // Gửi bình luận tới tất cả người dùng trong phòng
    io.to(data.postId).emit('comment_added', data);
  });
  
  // Xử lý ngắt kết nối
  socket.on('disconnect', () => {
    console.log('Người dùng ngắt kết nối:', socket.id);
    
    // Cập nhật trạng thái online trong tất cả các phòng
    onlineUsers.forEach((users, postId) => {
      if (users.has(socket.id)) {
        users.delete(socket.id);
        
        io.to(postId).emit('online_users', {
          count: users.size,
          postId
        });
      }
    });
  });
});

// Handler cho Netlify Function
exports.handler = (event, context) => {
  // Server chỉ chấp nhận websocket requests
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed'
    };
  }

  // Không chấp nhận các request không phải websocket
  if (event.headers['upgrade'] !== 'websocket') {
    return {
      statusCode: 400,
      body: 'Bad Request'
    };
  }

  return {
    statusCode: 200,
    body: 'Websocket server is running'
  };
};
