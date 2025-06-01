// Test direct backend access
import fetch from 'node-fetch';

async function testDirectBackend() {
    console.log('🔗 Testing direct backend access\n');
    
    // Test both backend services directly
    const backends = ['3000', '3002'];
    
    for (const port of backends) {
        console.log(`\n🧪 Testing backend on port ${port}:`);
        
        try {
            // Login first
            const loginResponse = await fetch(`http://localhost:${port}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    usernameOrEmail: 'admin',
                    password: 'admin123'
                })
            });
            
            if (!loginResponse.ok) {
                console.log(`❌ Login failed on port ${port}: ${loginResponse.status}`);
                continue;
            }
            
            const authCookie = loginResponse.headers.get('set-cookie');
            console.log(`✅ Login successful on port ${port}`);
            
            // Try comment posting
            const commentResponse = await fetch(`http://localhost:${port}/api/comments?slug=he-phan-tan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': authCookie
                },
                body: JSON.stringify({
                    content: `Direct test comment on port ${port} - ${Date.now()}`
                })
            });
            
            console.log(`📊 Comment response on port ${port}:`, commentResponse.status);
            const responseText = await commentResponse.text();
            console.log(`Response:`, responseText);
            
        } catch (error) {
            console.log(`❌ Error testing port ${port}:`, error.message);
        }
    }
}

testDirectBackend();
