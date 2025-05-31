// Logout API endpoint
import { json } from '@sveltejs/kit';
import { AuthService } from '../../../../lib/auth.js';

export async function POST({ request }) {
    try {
        const cookieHeader = request.headers.get('cookie');
        
        if (cookieHeader) {
            const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
                const [key, value] = cookie.trim().split('=');
                acc[key] = value;
                return acc;
            }, {});
            
            const token = cookies.auth_token;
            if (token) {
                // Delete session from database if needed
                // For now, we'll just clear the cookie
            }
        }

        return json({ success: true }, {
            headers: {
                'Set-Cookie': 'auth_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict'
            }
        });

    } catch (error) {
        console.error('Logout error:', error);
        return json({ error: error.message }, { status: 400 });
    }
}
