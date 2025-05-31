import { io } from 'socket.io-client';

console.log('🚀 Testing YouTube-like Comment System...\n');

// Test comment posting và voting
async function testCommentAndVoting() {
  const protocol = 'ws:';
  const host = 'localhost';
  const wsPort = 3001;
  const wsUrl = `${protocol}//${host}:${wsPort}`;

  console.log(`Connecting to WebSocket at ${wsUrl}...`);
  
  const socket1 = io(wsUrl);
  const socket2 = io(wsUrl);

  socket1.on('connect', () => {
    console.log('✅ User 1 connected');
    socket1.emit('join_post', 'he-phan-tan');
  });

  socket2.on('connect', () => {
    console.log('✅ User 2 connected');
    socket2.emit('join_post', 'he-phan-tan');
  });

  // Listen for new comments
  socket1.on('comment_added', (comment) => {
    console.log('📝 User 1 received new comment:', {
      author: comment.author,
      content: comment.content.substring(0, 50) + '...',
      likes: comment.likes || 0
    });
  });

  socket2.on('comment_added', (comment) => {
    console.log('📝 User 2 received new comment:', {
      author: comment.author,
      content: comment.content.substring(0, 50) + '...',
      likes: comment.likes || 0
    });
  });

  // Listen for vote updates
  socket1.on('comment_vote_updated', (data) => {
    console.log('👍 User 1 received vote update:', {
      commentId: data.commentId.substring(0, 8) + '...',
      likes: data.likes,
      dislikes: data.dislikes
    });
  });

  socket2.on('comment_vote_updated', (data) => {
    console.log('👍 User 2 received vote update:', {
      commentId: data.commentId.substring(0, 8) + '...',
      likes: data.likes,
      dislikes: data.dislikes
    });
  });

  // Wait for connections to establish
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 1: Post a new comment
  console.log('\n🧪 Test 1: Posting new comment...');
  try {
    const response = await fetch('http://localhost/api/comments?slug=he-phan-tan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        author: 'Test User Real-time',
        content: 'This is a real-time test comment with YouTube-like features! 🎉'
      })
    });

    const result = await response.json();
    if (response.ok) {
      console.log('✅ Comment posted successfully via API');
      
      // Emit real-time event
      socket1.emit('new_comment', {
        postSlug: 'he-phan-tan',
        author: result.comment.author,
        content: result.comment.content
      });
    } else {
      console.log('❌ Failed to post comment:', result.error);
    }
  } catch (error) {
    console.log('❌ Error posting comment:', error.message);
  }

  // Wait for real-time update
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Test 2: Test voting functionality
  console.log('\n🧪 Test 2: Testing vote functionality...');
  try {
    // First get a comment ID
    const commentsResponse = await fetch('http://localhost/api/comments?slug=he-phan-tan');
    const commentsData = await commentsResponse.json();
    
    if (commentsData.comments && commentsData.comments.length > 0) {
      const testComment = commentsData.comments[0];
      console.log(`Testing votes on comment by ${testComment.author}`);
      
      // Test like vote
      const voteResponse = await fetch('http://localhost/api/comments/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          commentId: testComment.id,
          voteType: 'like',
          userIdentifier: 'test_user_' + Date.now()
        })
      });

      const voteResult = await voteResponse.json();
      if (voteResponse.ok) {
        console.log('✅ Vote successful:', {
          operation: voteResult.operation,
          likes: voteResult.comment.likes,
          dislikes: voteResult.comment.dislikes
        });

        // Emit vote event for real-time update
        socket2.emit('comment_voted', {
          postSlug: 'he-phan-tan',
          commentId: testComment.id,
          voteType: 'like',
          operation: voteResult.operation,
          likes: voteResult.comment.likes,
          dislikes: voteResult.comment.dislikes
        });
      } else {
        console.log('❌ Vote failed:', voteResult.error);
      }
    } else {
      console.log('⚠️ No comments found to test voting');
    }
  } catch (error) {
    console.log('❌ Error testing votes:', error.message);
  }

  // Wait for vote updates
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Test 3: Test concurrent commenting (conflict simulation)
  console.log('\n🧪 Test 3: Testing concurrent comments...');
  
  const promises = [];
  for (let i = 1; i <= 3; i++) {
    promises.push(
      fetch('http://localhost/api/comments?slug=he-phan-tan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          author: `Concurrent User ${i}`,
          content: `Concurrent comment #${i} - Testing conflict resolution! ⚡`
        })
      })
    );
  }

  try {
    const responses = await Promise.all(promises);
    const results = await Promise.all(responses.map(r => r.json()));
    
    results.forEach((result, index) => {
      if (responses[index].ok) {
        console.log(`✅ Concurrent comment ${index + 1} posted successfully`);
        
        // Emit real-time events
        setTimeout(() => {
          socket1.emit('new_comment', {
            postSlug: 'he-phan-tan',
            author: result.comment.author,
            content: result.comment.content
          });
        }, index * 100); // Stagger the emissions slightly
      } else {
        console.log(`❌ Concurrent comment ${index + 1} failed:`, result.error);
      }
    });
  } catch (error) {
    console.log('❌ Error in concurrent test:', error.message);
  }

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 4: Check final comment count
  console.log('\n🧪 Test 4: Checking final comment count...');
  try {
    const finalResponse = await fetch('http://localhost/api/comments?slug=he-phan-tan');
    const finalData = await finalResponse.json();
    
    console.log('📊 Final Results:');
    console.log(`- Total comments: ${finalData.count}`);
    console.log(`- Comments with likes: ${finalData.comments.filter(c => c.likes > 0).length}`);
    console.log(`- Average likes per comment: ${(finalData.comments.reduce((sum, c) => sum + (c.likes || 0), 0) / finalData.count).toFixed(1)}`);
  } catch (error) {
    console.log('❌ Error checking final count:', error.message);
  }

  console.log('\n🎉 YouTube-like Comment System Test Completed!');
  console.log('✨ Features tested:');
  console.log('  - Real-time comment posting');
  console.log('  - Like/Dislike voting system');
  console.log('  - Concurrent user handling');
  console.log('  - Comment counting');
  console.log('  - WebSocket real-time updates');

  // Cleanup
  socket1.disconnect();
  socket2.disconnect();
}

testCommentAndVoting().catch(console.error);
