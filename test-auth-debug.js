// Test authentication flow debug
// Using built-in fetch (Node.js 18+)

const API_BASE = 'http://localhost:5174';

async function testAuthFlow() {
    console.log('🔐 Testing authentication flow...\n');

    // Test 1: Try to access protected endpoint without login
    console.log('1. Testing unauth access to /api/auth/me...');
    try {
        const response = await fetch(`${API_BASE}/api/auth/me`, {
            credentials: 'include'
        });
        const data = await response.json();
        console.log('✅ /api/auth/me response:', data);
    } catch (error) {
        console.log('❌ Error:', error.message);
    }

    // Test 2: Login with test credentials
    console.log('\n2. Testing login...');
    try {
        const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                usernameOrEmail: 'admin',
                password: 'admin123'
            })
        });

        const loginData = await loginResponse.json();
        console.log('Login response status:', loginResponse.status);
        console.log('Login response data:', loginData);
        
        // Extract cookies from response
        const cookies = loginResponse.headers.get('set-cookie');
        console.log('Set-Cookie header:', cookies);

        if (loginResponse.ok) {
            // Test 3: Try accessing protected endpoint after login
            console.log('\n3. Testing auth access to /api/auth/me after login...');
            const meResponse = await fetch(`${API_BASE}/api/auth/me`, {
                credentials: 'include',
                headers: {
                    'Cookie': cookies || ''
                }
            });
            const meData = await meResponse.json();
            console.log('✅ /api/auth/me after login:', meData);

            // Test 4: Try posting a comment
            console.log('\n4. Testing comment posting...');
            const commentResponse = await fetch(`${API_BASE}/api/comments?slug=he-phan-tan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': cookies || ''
                },
                credentials: 'include',
                body: JSON.stringify({
                    content: 'Test comment via API after login'
                })
            });

            const commentData = await commentResponse.json();
            console.log('Comment response status:', commentResponse.status);
            console.log('Comment response data:', commentData);
        }

    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

testAuthFlow().catch(console.error);
