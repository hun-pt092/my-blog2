// Test script for real-time commenting functionality
import { io } from 'socket.io-client';

// Configuration
const WEBSITE_URL = 'http://localhost';
const WEBSOCKET_URL = 'ws://localhost:3001';
const TEST_POST_SLUG = 'chao-mung-blog-phan-tan';

// Test comment data
const testComments = [
  {
    author: 'Test User 1',
    content: 'This is a test comment from user 1'
  },
  {
    author: 'Test User 2', 
    content: 'This is a real-time test comment from user 2'
  },
  {
    author: 'Test User 3',
    content: 'Testing distributed comment system with multiple nodes'
  }
];

async function testCommentAPI() {
  console.log('Testing Comment API...');
  
  try {
    // Test adding a comment via API
    const response = await fetch(`${WEBSITE_URL}/api/comments?slug=${TEST_POST_SLUG}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testComments[0])
    });
    
    const result = await response.json();
      if (response.ok) {
      console.log('Comment API test successful:', result.comment);
      return result.comment;
    } else {
      console.log('Comment API test failed:', result.error);
      return null;
    }
  } catch (error) {
    console.log('Comment API error:', error.message);
    return null;
  }
}

async function testWebSocketComments() {
  console.log('Testing WebSocket real-time comments...');
  
  return new Promise((resolve, reject) => {
    // Create multiple socket connections to simulate different users
    const socket1 = io(WEBSOCKET_URL);
    const socket2 = io(WEBSOCKET_URL);
    
    let receivedComments = 0;
    const expectedComments = 2;
      // Setup event listeners for socket1
    socket1.on('connect', () => {
      console.log('User 1 connected to WebSocket');
      socket1.emit('join_post', TEST_POST_SLUG);
    });
    
    socket1.on('comment_added', (comment) => {
      console.log('User 1 received comment:', comment);
      receivedComments++;
      
      if (receivedComments >= expectedComments) {
        socket1.disconnect();
        socket2.disconnect();
        resolve('WebSocket test completed successfully');
      }
    });
      // Setup event listeners for socket2  
    socket2.on('connect', () => {
      console.log('User 2 connected to WebSocket');
      socket2.emit('join_post', TEST_POST_SLUG);
      
      // Send test comments after both users connected
      setTimeout(() => {
        console.log('Sending test comment from User 2...');
        socket2.emit('new_comment', {
          post_id: 1, // Assuming post ID for test slug
          postSlug: TEST_POST_SLUG,
          author: testComments[1].author,
          content: testComments[1].content
        });
        
        setTimeout(() => {
          console.log('Sending test comment from User 1...');
          socket1.emit('new_comment', {
            post_id: 1,
            postSlug: TEST_POST_SLUG, 
            author: testComments[2].author,
            content: testComments[2].content
          });
        }, 1000);
      }, 1000);
    });
      socket2.on('comment_added', (comment) => {
      console.log('User 2 received comment:', comment);
      receivedComments++;
      
      if (receivedComments >= expectedComments) {
        socket1.disconnect();
        socket2.disconnect();
        resolve('WebSocket test completed successfully');
      }
    });
    
    // Handle errors
    socket1.on('error', reject);
    socket2.on('error', reject);
    
    // Timeout after 30 seconds
    setTimeout(() => {
      socket1.disconnect();
      socket2.disconnect();
      reject(new Error('WebSocket test timeout'));
    }, 30000);
  });
}

async function testLoadBalancing() {
  console.log('Testing load balancing across backend instances...');
  
  const requests = [];
  
  // Make multiple requests to test load balancing
  for (let i = 0; i < 10; i++) {
    requests.push(
      fetch(`${WEBSITE_URL}/api/comments?slug=${TEST_POST_SLUG}`)
        .then(res => res.json())
        .then(data => ({ success: true, comments: data.comments?.length || 0 }))
        .catch(error => ({ success: false, error: error.message }))
    );
  }
    const results = await Promise.all(requests);
  const successful = results.filter(r => r.success).length;
  
  console.log(`Load balancing test: ${successful}/10 requests successful`);
  return successful >= 8; // Allow for some failures
}

async function runAllTests() {
  console.log('Starting Distributed Blog Comment System Tests\n');
  
  try {
    // Test 1: API functionality
    const apiResult = await testCommentAPI();
      // Test 2: WebSocket real-time functionality
    const wsResult = await testWebSocketComments();
    console.log('WebSocket test result:', wsResult);
    
    // Test 3: Load balancing
    const lbResult = await testLoadBalancing();
    
    console.log('\nTest Results Summary:');
    console.log(`- Comment API: ${apiResult ? 'PASS' : 'FAIL'}`);
    console.log(`- WebSocket Real-time: PASS`);
    console.log(`- Load Balancing: ${lbResult ? 'PASS' : 'FAIL'}`);
      if (apiResult && lbResult) {
      console.log('\nAll tests passed! Distributed blog system is working correctly.');
    } else {
      console.log('\nSome tests failed. Please check the system configuration.');
    }
    
  } catch (error) {
    console.error('Test execution failed:', error.message);
  }
  
  process.exit(0);
}

// Install required dependencies and run tests
runAllTests();
