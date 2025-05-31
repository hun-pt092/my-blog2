// Get current user API endpoint
import { json } from '@sveltejs/kit';
import { AuthService } from '../../../../lib/auth.js';

export async function GET({ request }) {
    try {
        const user = await AuthService.optionalAuth(request);
        
        if (!user) {
            return json({ user: null });
        }

        return json({ 
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                displayName: user.display_name,
                role: user.role,
                avatarUrl: user.avatar_url
            }
        });

    } catch (error) {
        console.error('Get user error:', error);
        return json({ user: null });
    }
}
