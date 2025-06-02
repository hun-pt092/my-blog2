// src/lib/socket.js
import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import io from 'socket.io-client';

// Store để lưu trữ kết nối socket
export const socketStore = writable(null);

// Store để lưu trữ trạng thái kết nối
export const connectionStatusStore = writable({
  connected: false,
  nodeId: null,
  lastPing: null,
  reconnecting: false
});

// Store để lưu trữ thống kê hiệu suất
export const performanceStore = writable({
  latency: 0,
  messageCount: 0,
  errorCount: 0,
  reconnectCount: 0
});

// Hàm khởi tạo socket
export function initSocket() {
  if (!browser) return;

  // Kiểm tra nếu đang chạy trên Netlify
  const isNetlify = window.location.hostname.includes('netlify.app');
  
  let socketUrl;
  if (isNetlify) {
    // Sử dụng Netlify Functions cho WebSocket trên production
    socketUrl = window.location.origin;
  } else {
    // Cho môi trường development
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const wsPort = 3001; // Port cho websocket
    socketUrl = `${protocol}//${host}:${wsPort}`;
  }  console.log(`Initializing socket connection to ${socketUrl}`);
  
  // Tạo kết nối socket với retry và timeout
  const socket = io(socketUrl, {
    reconnectionDelayMax: 10000,
    reconnectionAttempts: 10,
    timeout: 20000,
    path: isNetlify ? '/.netlify/functions/socket-io' : undefined
  });
  
  // Xử lý sự kiện kết nối
  socket.on('connect', () => {
    console.log('Connected to socket server');
    
    // Cập nhật store trạng thái kết nối
    connectionStatusStore.update(state => ({
      ...state,
      connected: true,
      reconnecting: false
    }));
    
    // Yêu cầu thông tin node
    socket.emit('get_node_info');
    
    // Bắt đầu ping để đo độ trễ
    startLatencyCheck(socket);
  });
  
  // Xử lý thông tin node
  socket.on('node_info', (info) => {
    console.log('Connected to node:', info);
    connectionStatusStore.update(state => ({
      ...state,
      nodeId: info.nodeId
    }));
  });
  
  // Xử lý sự kiện ngắt kết nối
  socket.on('disconnect', (reason) => {
    console.log('Disconnected from socket server:', reason);
    connectionStatusStore.update(state => ({
      ...state,
      connected: false,
      reconnecting: reason !== 'io client disconnect'
    }));
    
    // Cập nhật số lần reconnect
    if (reason !== 'io client disconnect') {
      performanceStore.update(state => ({
        ...state,
        reconnectCount: state.reconnectCount + 1
      }));
    }
  });
  
  // Xử lý lỗi
  socket.on('error', (error) => {
    console.error('Socket error:', error);
    performanceStore.update(state => ({
      ...state,
      errorCount: state.errorCount + 1
    }));
  });
  
  // Cập nhật socket store
  socketStore.set(socket);
  
  return socket;
}

// Hàm kiểm tra độ trễ
function startLatencyCheck(socket) {
  // Gửi ping mỗi 30 giây
  const pingInterval = setInterval(() => {
    if (!socket.connected) {
      clearInterval(pingInterval);
      return;
    }
    
    const start = Date.now();
    
    socket.emit('ping', {}, () => {
      const latency = Date.now() - start;
      
      // Cập nhật độ trễ
      performanceStore.update(state => ({
        ...state,
        latency
      }));
      
      // Cập nhật thời gian ping cuối cùng
      connectionStatusStore.update(state => ({
        ...state,
        lastPing: new Date()
      }));
    });
  }, 30000);
  
  return pingInterval;
}
