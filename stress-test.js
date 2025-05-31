// stress-test.js
// Công cụ kiểm tra áp lực cho hệ thống blog
import autocannon from 'autocannon';
import { io } from 'socket.io-client';
import dotenv from 'dotenv';

dotenv.config();

// Cấu hình kiểm tra
const HTTP_URL = process.env.HTTP_TEST_URL || 'http://localhost:80';
const WS_URL = process.env.WS_TEST_URL || 'http://localhost:80';
const NUM_CONNECTIONS = parseInt(process.env.TEST_CONNECTIONS) || 100;
const DURATION = parseInt(process.env.TEST_DURATION) || 30; // giây
const POST_SLUG = 'test-post'; // slug của bài viết để test

// Thông tin kết quả
let results = {
  httpRequests: 0,
  socketConnections: 0,
  socketMessages: 0,
  errors: 0
};

// Danh sách socket kết nối
const sockets = [];

console.log(`
===== KIỂM TRA ÁP LỰC HỆ THỐNG BLOG =====
HTTP URL: ${HTTP_URL}
WebSocket URL: ${WS_URL}
Số kết nối: ${NUM_CONNECTIONS}
Thời gian kiểm tra: ${DURATION} giây
=======================================
`);

function runHttpTest() {
  console.log('Bắt đầu kiểm tra HTTP...');

  return new Promise((resolve) => {
    const instance = autocannon({
      url: `${HTTP_URL}/blog`,
      connections: NUM_CONNECTIONS,
      duration: DURATION,
      headers: {
        'user-agent': 'autocannon stress test'
      }
    });

    autocannon.track(instance);

    instance.on('done', (result) => {
      console.log('Kết quả kiểm tra HTTP:');
      console.log(`  Requests: ${result.requests.total}`);
      console.log(`  Throughput: ${result.throughput.average.toFixed(2)} MB/s`);
      console.log(`  Latency (trung bình): ${result.latency.average.toFixed(2)} ms`);
      console.log(`  Errors: ${result.errors}`);
      
      results.httpRequests = result.requests.total;
      results.errors += result.errors;
      
      resolve();
    });
  });
}

function runSocketTest() {
  console.log('Bắt đầu kiểm tra WebSocket...');
  
  return new Promise((resolve) => {
    // Tạo các kết nối socket
    for (let i = 0; i < NUM_CONNECTIONS; i++) {
      const socket = io(WS_URL, {
        reconnection: true,
        reconnectionAttempts: 3,
        transports: ['websocket']
      });
      
      socket.on('connect', () => {
        results.socketConnections++;
        
        // Tham gia phòng kiểm tra
        socket.emit('join_post', POST_SLUG);
        
        // Gửi bình luận mỗi 2 giây
        if (i % 5 === 0) { // Chỉ 20% client gửi bình luận để không quá tải
          const interval = setInterval(() => {
            socket.emit('new_comment', {
              post_id: '1',
              author: `Test User ${i}`,
              content: `This is a stress test comment from connection ${i} at ${new Date().toISOString()}`,
              postSlug: POST_SLUG
            });
            results.socketMessages++;
          }, 2000);
          
          socket._testInterval = interval;
        }
      });
      
      socket.on('error', (err) => {
        console.error(`Socket error: ${err}`);
        results.errors++;
      });
      
      socket.on('disconnect', () => {
        console.log(`Socket ${i} disconnected`);
      });
      
      sockets.push(socket);
    }
    
    // Theo dõi tiến trình kiểm tra
    let seconds = 0;
    const timer = setInterval(() => {
      seconds++;
      console.log(`WebSocket test: ${seconds}/${DURATION} giây, ${results.socketConnections} kết nối, ${results.socketMessages} tin nhắn`);
      
      if (seconds >= DURATION) {
        clearInterval(timer);
        
        // Đóng tất cả kết nối
        sockets.forEach(socket => {
          if (socket._testInterval) {
            clearInterval(socket._testInterval);
          }
          socket.disconnect();
        });
        
        console.log('Kết quả kiểm tra WebSocket:');
        console.log(`  Kết nối: ${results.socketConnections}/${NUM_CONNECTIONS}`);
        console.log(`  Tin nhắn gửi: ${results.socketMessages}`);
        
        resolve();
      }
    }, 1000);
  });
}

async function runTest() {
  try {
    console.log('Bắt đầu kiểm tra áp lực...');
    
    // Chạy kiểm tra HTTP và WebSocket song song
    await Promise.all([
      runHttpTest(),
      runSocketTest()
    ]);
    
    console.log('\n===== KẾT QUẢ KIỂM TRA ÁP LỰC =====');
    console.log(`HTTP Requests: ${results.httpRequests}`);
    console.log(`Socket Connections: ${results.socketConnections}`);
    console.log(`Socket Messages: ${results.socketMessages}`);
    console.log(`Errors: ${results.errors}`);
    console.log('====================================\n');
    
  } catch (error) {
    console.error('Lỗi trong quá trình kiểm tra:', error);
  } finally {
    // Đảm bảo kết thúc quá trình
    process.exit(0);
  }
}

// Chạy kiểm tra
runTest();
