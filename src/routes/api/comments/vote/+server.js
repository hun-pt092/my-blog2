// Vote API endpoint with authentication
import { json } from '@sveltejs/kit';
import db from '$lib/db';
import { AuthService } from '$lib/auth.js';

// POST /api/comments/vote - Vote for a comment (like/dislike)
export const POST = async ({ request, url }) => {
  try {
    // Require authentication for voting
    const user = await AuthService.requireAuth(request);
    
    const { commentId, voteType } = await request.json();

    // Validate input
    if (!commentId || !voteType) {
      return json({ error: 'Comment ID and vote type are required' }, { status: 400 });
    }

    if (!['like', 'dislike'].includes(voteType)) {
      return json({ error: 'Vote type must be "like" or "dislike"' }, { status: 400 });
    }

    // Start transaction
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');      // Check if user already voted on this comment
      const existingVote = await client.query(
        'SELECT vote_type FROM comment_votes WHERE comment_id = $1 AND (user_id = $2 OR user_identifier = $3)',
        [commentId, user.id, user.id.toString()]
      );

      let operation = '';

      if (existingVote.rows.length > 0) {
        const currentVote = existingVote.rows[0].vote_type;
        
        if (currentVote === voteType) {          // User clicked same vote button - remove vote
          await client.query(
            'DELETE FROM comment_votes WHERE comment_id = $1 AND (user_id = $2 OR user_identifier = $3)',
            [commentId, user.id, user.id.toString()]
          );
          
          // Update comment counts
          if (voteType === 'like') {
            await client.query(
              'UPDATE comments SET likes = GREATEST(0, likes - 1) WHERE id = $1',
              [commentId]
            );
          } else {
            await client.query(
              'UPDATE comments SET dislikes = GREATEST(0, dislikes - 1) WHERE id = $1',
              [commentId]
            );
          }
          
          operation = 'removed';
        } else {          // User switched vote - update existing vote
          await client.query(
            'UPDATE comment_votes SET vote_type = $1 WHERE comment_id = $2 AND (user_id = $3 OR user_identifier = $4)',
            [voteType, commentId, user.id, user.id.toString()]
          );
          
          // Update comment counts (remove old vote, add new vote)
          if (currentVote === 'like') {
            await client.query(
              'UPDATE comments SET likes = GREATEST(0, likes - 1), dislikes = dislikes + 1 WHERE id = $1',
              [commentId]
            );
          } else {
            await client.query(
              'UPDATE comments SET likes = likes + 1, dislikes = GREATEST(0, dislikes - 1) WHERE id = $1',
              [commentId]
            );
          }
          
          operation = 'switched';
        }      } else {
        // New vote - gửi cả user_id và user_identifier để tương thích với schema DB
        await client.query(
          'INSERT INTO comment_votes (comment_id, user_id, user_identifier, vote_type) VALUES ($1, $2, $3, $4)',
          [commentId, user.id, user.id.toString(), voteType]
        );
        
        // Update comment counts
        if (voteType === 'like') {
          await client.query(
            'UPDATE comments SET likes = likes + 1 WHERE id = $1',
            [commentId]
          );
        } else {
          await client.query(
            'UPDATE comments SET dislikes = dislikes + 1 WHERE id = $1',
            [commentId]
          );
        }
        
        operation = 'added';
      }

      // Get updated comment data
      const updatedComment = await client.query(
        'SELECT id, likes, dislikes FROM comments WHERE id = $1',
        [commentId]
      );      // Get user's current vote (if any)
      const userVote = await client.query(
        'SELECT vote_type FROM comment_votes WHERE comment_id = $1 AND (user_id = $2 OR user_identifier = $3)',
        [commentId, user.id, user.id.toString()]
      );

      await client.query('COMMIT');

      return json({
        success: true,
        operation,
        comment: {
          id: updatedComment.rows[0].id,
          likes: updatedComment.rows[0].likes,
          dislikes: updatedComment.rows[0].dislikes,
          userVote: userVote.rows.length > 0 ? userVote.rows[0].vote_type : null
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error processing vote:', error);
    
    if (error.message.includes('authentication')) {
      return json({ error: 'Authentication required to vote' }, { status: 401 });
    }
    
    return json({ error: 'Failed to process vote' }, { status: 500 });
  }
};

