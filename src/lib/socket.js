// src/lib/socket.js
import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import io from 'socket.io-client';

// Store để lưu trữ kết nối socket
export const socketStore = writable(null);

// Hàm khởi tạo socket
export function initSocket() {
  if (!browser) return;

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.hostname;
  const wsPort = 3001; // Port cho websocket
  const wsUrl = `${protocol}//${host}:${wsPort}`;
  
  console.log(`Initializing socket connection to ${wsUrl}`);
  
  const socket = io(wsUrl);
  
  socket.on('connect', () => {
    console.log('Connected to socket server');
  });
  
  socket.on('disconnect', () => {
    console.log('Disconnected from socket server');
  });
  
  socketStore.set(socket);
  
  return socket;
}
