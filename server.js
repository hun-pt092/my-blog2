// server.js for SvelteKit and WebSocket
import dotenv from 'dotenv';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import db from './src/lib/db.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;
const WS_PORT = process.env.WS_PORT || 3001;
const NODE_ID = process.env.NODE_ID || '1';

console.log(`[Node ${NODE_ID}] Starting server...`);

// Import handler from SvelteKit build output
const startServer = async () => {
  try {
    // Dynamic import to wait for handler.js to be created after build
    const { handler } = await import('./build/handler.js').catch(err => {
      console.error(`[Node ${NODE_ID}] Error importing handler:`, err);
      // Try again with different structure (adapter-node can create different files depending on version)
      return import('./build/index.js');
    });
    
    // Create HTTP server for SvelteKit
    const app = createServer(handler);
    
    // Listen for HTTP connections
    app.listen(PORT, () => {
      console.log(`[Node ${NODE_ID}] SvelteKit server running on port ${PORT}`);
    });
    
    // Initialize WebSocket server
    const io = new Server(WS_PORT, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    console.log(`[Node ${NODE_ID}] WebSocket server running on port ${WS_PORT}`);
      // Setup WebSocket using websocket-handler.js
    import('./websocket-handler.js').then(({ default: setupWebsocket }) => {
      setupWebsocket(io);
    }).catch(err => {
      console.error(`[Node ${NODE_ID}] Error importing websocket-handler:`, err);
      
      // Fallback basic handler if websocket-handler.js import fails
      console.log(`[Node ${NODE_ID}] Using fallback WebSocket handler`);
      
      const connectedUsers = new Map();

      io.on('connection', (socket) => {
        console.log(`[Node ${NODE_ID}] Client connected: ${socket.id}`);
  
        // Handle when client follows post
        socket.on('join_post', (postSlug) => {
          socket.join(`post:${postSlug}`);
          console.log(`[Node ${NODE_ID}] Client ${socket.id} joined post: ${postSlug}`);
        });
  
        // Handle when client leaves post
        socket.on('leave_post', (postSlug) => {
          socket.leave(`post:${postSlug}`);
          console.log(`[Node ${NODE_ID}] Client ${socket.id} left post: ${postSlug}`);
        });
        
        // Handle when client sends new comment
        socket.on('new_comment', (data) => {
          console.log(`[Node ${NODE_ID}] New comment:`, data);
          io.to(`post:${data.postSlug}`).emit('comment_added', {
            id: Date.now().toString(),
            author: data.author,
            content: data.content,
            created_at: new Date().toISOString()
          });
        });
        
        // Handle when client disconnects
        socket.on('disconnect', () => {
          console.log(`[Node ${NODE_ID}] Client disconnected: ${socket.id}`);
          connectedUsers.delete(socket.id);
        });
      });
    });
    
  } catch (err) {
    console.error(`[Node ${NODE_ID}] Error starting server:`, err);
    throw err;
  }
};

// Start server
startServer().catch(err => {
  console.error(`[Node ${NODE_ID}] Failed to import SvelteKit handler:`, err);
});
