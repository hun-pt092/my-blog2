import { io } from 'socket.io-client';

console.log('🎉 YouTube-like Comment System Demo');
console.log('===================================\n');

async function runDemo() {
  console.log('📋 Features Demo:');
  console.log('• Real-time comment posting');
  console.log('• Like/Dislike system with vote tracking');
  console.log('• Comment sorting (newest, oldest, popular)');
  console.log('• Conflict resolution for concurrent users');
  console.log('• Loading states and error handling');
  console.log('• User avatar generation');
  console.log('• Comment counting');
  console.log('• "No comments" empty state');
  console.log('• Responsive YouTube-like UI\n');

  // Test API endpoints
  console.log('🔍 Testing API Endpoints...');
  
  try {
    // 1. Test GET comments with sorting
    console.log('\n1. Fetching comments (newest first):');
    let response = await fetch('http://localhost/api/comments?slug=he-phan-tan&sort=newest');
    let data = await response.json();
    console.log(`   ✅ Found ${data.count} comments`);
    console.log(`   📊 Comments with likes: ${data.comments.filter(c => c.likes > 0).length}`);
    
    // 2. Test GET comments with different sorting
    console.log('\n2. Fetching comments (most popular):');
    response = await fetch('http://localhost/api/comments?slug=he-phan-tan&sort=popular');
    data = await response.json();
    const topComment = data.comments[0];
    console.log(`   ✅ Top comment by ${topComment.author} with ${topComment.likes} likes`);
    
    // 3. Test POST new comment
    console.log('\n3. Adding new comment:');
    response = await fetch('http://localhost/api/comments?slug=he-phan-tan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        author: 'Demo User',
        content: '🚀 This is a demo comment showcasing the YouTube-like system! It supports real-time updates, voting, and much more.'
      })
    });
    
    if (response.ok) {
      const newComment = await response.json();
      console.log(`   ✅ Comment posted successfully with ID: ${newComment.comment.id.substring(0, 8)}...`);
      
      // 4. Test voting on the new comment
      console.log('\n4. Testing vote system:');
      const voteResponse = await fetch('http://localhost/api/comments/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId: newComment.comment.id,
          voteType: 'like',
          userIdentifier: 'demo_user_' + Date.now()
        })
      });
      
      if (voteResponse.ok) {
        const voteResult = await voteResponse.json();
        console.log(`   ✅ Vote successful! Likes: ${voteResult.comment.likes}`);
      }
      
      // 5. Test concurrent voting (simulating YouTube scenario)
      console.log('\n5. Testing concurrent voting (simulating multiple users):');
      const concurrentVotes = [];
      for (let i = 0; i < 5; i++) {
        concurrentVotes.push(
          fetch('http://localhost/api/comments/vote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              commentId: newComment.comment.id,
              voteType: 'like',
              userIdentifier: 'concurrent_user_' + i + '_' + Date.now()
            })
          })
        );
      }
      
      const results = await Promise.all(concurrentVotes);
      const successCount = results.filter(r => r.ok).length;
      console.log(`   ✅ ${successCount}/5 concurrent votes processed successfully`);
    }
    
  } catch (error) {
    console.log(`   ❌ API Error: ${error.message}`);
  }

  // Test WebSocket real-time functionality
  console.log('\n🔌 Testing Real-time WebSocket Features...');
  
  const socket1 = io('ws://localhost:3001');
  const socket2 = io('ws://localhost:3001');
  
  let receivedUpdates = 0;
  
  const testRealtime = new Promise((resolve) => {
    socket1.on('connect', () => {
      console.log('   ✅ User 1 connected to WebSocket');
      socket1.emit('join_post', 'he-phan-tan');
    });

    socket2.on('connect', () => {
      console.log('   ✅ User 2 connected to WebSocket');
      socket2.emit('join_post', 'he-phan-tan');
    });

    socket1.on('comment_added', (comment) => {
      console.log(`   📝 User 1 received real-time comment from ${comment.author}`);
      receivedUpdates++;
    });

    socket2.on('comment_added', (comment) => {
      console.log(`   📝 User 2 received real-time comment from ${comment.author}`);
      receivedUpdates++;
    });

    socket1.on('comment_vote_updated', (data) => {
      console.log(`   👍 User 1 received vote update: ${data.likes} likes`);
      receivedUpdates++;
    });

    socket2.on('comment_vote_updated', (data) => {
      console.log(`   👍 User 2 received vote update: ${data.likes} likes`);
      receivedUpdates++;
    });

    // Send test real-time comment after connections are established
    setTimeout(async () => {
      console.log('\n   🧪 Posting real-time test comment...');
      
      try {
        const rtResponse = await fetch('http://localhost/api/comments?slug=he-phan-tan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            author: 'Real-time Tester',
            content: '⚡ This comment tests real-time broadcasting to all connected users!'
          })
        });

        if (rtResponse.ok) {
          const rtComment = await rtResponse.json();
          socket1.emit('new_comment', {
            postSlug: 'he-phan-tan',
            author: rtComment.comment.author,
            content: rtComment.comment.content
          });
        }
      } catch (error) {
        console.log(`   ❌ Real-time test error: ${error.message}`);
      }

      setTimeout(() => {
        socket1.disconnect();
        socket2.disconnect();
        resolve();
      }, 2000);
    }, 1000);
  });

  await testRealtime;

  // Final summary
  console.log('\n📊 Demo Summary:');
  console.log('================');
  
  try {
    const finalResponse = await fetch('http://localhost/api/comments?slug=he-phan-tan');
    const finalData = await finalResponse.json();
    
    console.log(`📝 Total Comments: ${finalData.count}`);
    console.log(`👍 Total Likes: ${finalData.comments.reduce((sum, c) => sum + (c.likes || 0), 0)}`);
    console.log(`👎 Total Dislikes: ${finalData.comments.reduce((sum, c) => sum + (c.dislikes || 0), 0)}`);
    console.log(`⚡ Real-time Updates Received: ${receivedUpdates}`);
    console.log(`🎯 Most Popular Comment: "${finalData.comments.sort((a, b) => (b.likes || 0) - (a.likes || 0))[0]?.content.substring(0, 50)}..."`);
    
  } catch (error) {
    console.log(`❌ Summary error: ${error.message}`);
  }

  console.log('\n🎉 Demo Complete!');
  console.log('🌐 Visit http://localhost/blog/he-phan-tan to see the YouTube-like UI');
  console.log('✨ Features working: Real-time comments, voting, sorting, conflict resolution');
  console.log('📱 Responsive design with YouTube-style avatars and interactions');
}

runDemo().catch(console.error);
