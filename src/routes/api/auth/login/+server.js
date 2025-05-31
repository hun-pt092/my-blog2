// Login API endpoint
import { json } from '@sveltejs/kit';
import { AuthService } from '../../../../lib/auth.js';

export async function POST({ request }) {
    try {
        // Check if request exists and has json method
        if (!request) {
            console.error('Request object is undefined');
            return json({ error: 'Invalid request' }, { status: 400 });
        }

        let body;
        try {
            body = await request.json();
        } catch (jsonError) {
            console.error('JSON parsing error:', jsonError);
            return json({ error: 'Invalid JSON in request body' }, { status: 400 });
        }

        const { usernameOrEmail, password } = body;

        // Validation
        if (!usernameOrEmail || !password) {
            return json({ error: 'Username/email and password are required' }, { status: 400 });
        }

        // Login user
        const user = await AuthService.login(usernameOrEmail, password);
        
        // Generate JWT token
        const token = AuthService.generateToken(user);

        // Create session
        const session = await AuthService.createSession(user.id);

        return json({ 
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                displayName: user.display_name,
                role: user.role,
                avatarUrl: user.avatar_url
            },
            token
        }, {
            headers: {
                'Set-Cookie': `auth_token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Strict`
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return json({ error: error.message }, { status: 401 });
    }
}
