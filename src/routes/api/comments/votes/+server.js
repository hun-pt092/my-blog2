// Get user votes for multiple comments
import { json } from '@sveltejs/kit';
import db from '$lib/db';
import { AuthService } from '$lib/auth.js';

// POST /api/comments/votes - Get user's votes for multiple comments
export const POST = async ({ request }) => {
  try {
    // Require authentication
    const user = await AuthService.requireAuth(request);
    
    const { commentIds } = await request.json();

    // Validate input
    if (!commentIds || !Array.isArray(commentIds) || commentIds.length === 0) {
      return json({ error: 'Comment IDs array is required' }, { status: 400 });
    }

    // Get user's votes for these comments
    const placeholders = commentIds.map((_, i) => `$${i + 2}`).join(',');
    const votes = await db.query(
      `SELECT comment_id, vote_type 
       FROM comment_votes 
       WHERE user_id = $1 AND comment_id IN (${placeholders})`,
      [user.id, ...commentIds]
    );

    return json({
      votes: votes.rows
    });

  } catch (error) {
    console.error('Error fetching user votes:', error);
    
    if (error.message.includes('authentication')) {
      return json({ error: 'Authentication required' }, { status: 401 });
    }
    
    return json({ error: 'Failed to fetch votes' }, { status: 500 });
  }
};
