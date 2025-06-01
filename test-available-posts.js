#!/usr/bin/env node

async function listAvailablePosts() {
  try {
    console.log('📝 Checking available blog posts...\n');

    // Get list of comments to see which posts exist
    const commentsResponse = await fetch('http://localhost/api/comments?slug=dummy');
    console.log('Comments API response:', commentsResponse.status);

    // Try to access direct backend
    const directResponse = await fetch('http://localhost:3000/api/debug/posts', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (directResponse.ok) {
      const data = await directResponse.json();
      console.log('Posts from debug endpoint:', JSON.stringify(data, null, 2));
    } else {
      console.log('No debug endpoint available');
      
      // Let's just try some common post slugs
      const commonSlugs = [
        'he-phan-tan',
        'welcome-to-my-blog',
        'first-post',
        'hello-world',
        'introduction'
      ];

      console.log('\n🔍 Testing common post slugs...');
      
      for (const slug of commonSlugs) {
        const response = await fetch(`http://localhost/api/comments?slug=${slug}`);
        console.log(`\nPost slug "${slug}": ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Found post! Comments: ${data.comments?.length}, Total: ${data.count}`);
          
          // Try posting a comment to this valid post
          console.log(`\n🧪 Testing comment posting to "${slug}"...`);
          
          // Login first
          const loginResponse = await fetch('http://localhost/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              usernameOrEmail: 'admin',
              password: 'admin123'
            })
          });

          if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            
            // Post comment
            const commentResponse = await fetch(`http://localhost/api/comments?slug=${slug}`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${loginData.token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                content: `🎉 SUCCESS! Comment posted at ${new Date().toISOString()} - Fixed field names working!`
              })
            });

            console.log(`Comment posting result: ${commentResponse.status}`);
            const result = await commentResponse.text();
            console.log('Response:', result);
            
            if (commentResponse.ok) {
              console.log('🎉🎉🎉 COMMENT POSTING WORKS! 🎉🎉🎉');
              return; // Success, we can stop here
            }
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the check
listAvailablePosts();
