import { json } from '@sveltejs/kit';
import db from '$lib/db';
import { AuthService } from '$lib/auth.js';

export const GET = async ({ url, params }) => {
  const postSlug = url.searchParams.get('slug');
  const sortBy = url.searchParams.get('sort') || 'newest';

  if (!postSlug) {
    return json({ error: 'Post slug is required' }, { status: 400 });
  }

  try {
    // First, get the post ID from slug
    const postResult = await db.query(
      'SELECT id FROM posts WHERE slug = $1',
      [postSlug]
    );

    if (postResult.rows.length === 0) {
      return json({ error: 'Post not found' }, { status: 404 });
    }

    const postId = postResult.rows[0].id;

    // Determine sort order
    let orderClause = 'ORDER BY created_at DESC'; // Default: newest first
    switch (sortBy) {
      case 'oldest':
        orderClause = 'ORDER BY created_at ASC';
        break;
      case 'popular':
        orderClause = 'ORDER BY likes DESC, created_at DESC';
        break;
      default: // newest
        orderClause = 'ORDER BY created_at DESC';
    }

    // Get total comment count
    const countResult = await db.query(
      'SELECT COUNT(*) as count FROM comments WHERE post_id = $1',
      [postId]
    );    // Now get all comments for this post with user information
    const commentResult = await db.query(
      `SELECT c.id, c.content, c.created_at, c.likes, c.dislikes,
              u.username, u.display_name, u.avatar_url
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.post_id = $1 
       ${orderClause}`,
      [postId]
    );    // Return comments with count
    return json({
      comments: commentResult.rows.map(comment => ({
        id: comment.id,
        author: comment.username || comment.display_name || 'Anonymous',
        content: comment.content,
        created_at: comment.created_at,
        likes: comment.likes || 0,
        dislikes: comment.dislikes || 0,
        avatar_url: comment.avatar_url
      })),
      count: parseInt(countResult.rows[0].count),
      sort: sortBy
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
};

export const POST = async ({ request, url }) => {
  const postSlug = url.searchParams.get('slug');

  if (!postSlug) {
    return json({ error: 'Post slug is required' }, { status: 400 });
  }

  try {
    // Require authentication for posting comments
    const user = await AuthService.requireAuth(request);

    // Get post ID from slug
    const postResult = await db.query(
      'SELECT id FROM posts WHERE slug = $1',
      [postSlug]
    );

    if (postResult.rows.length === 0) {
      return json({ error: 'Post not found' }, { status: 404 });
    }

    const postId = postResult.rows[0].id;
    const { content } = await request.json();

    // Validate input
    if (!content || content.trim().length === 0) {
      return json({ error: 'Comment content is required' }, { status: 400 });
    }

    if (content.length > 2000) {
      return json({ error: 'Comment too long (max 2000 characters)' }, { status: 400 });
    }

    // Insert the comment with user_id
    const result = await db.query(
      `INSERT INTO comments (post_id, user_id, content) 
       VALUES ($1, $2, $3)
       RETURNING id, content, created_at`,
      [postId, user.id, content.trim()]
    );

    const newComment = {
      id: result.rows[0].id,
      author: user.display_name || user.username,
      content: result.rows[0].content,
      created_at: result.rows[0].created_at,
      likes: 0,
      dislikes: 0,
      avatar_url: user.avatar_url
    };

    // Return the new comment
    return json({
      comment: newComment
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding comment:', error);
    
    if (error.message.includes('authentication')) {
      return json({ error: 'Authentication required to post comments' }, { status: 401 });
    }
    
    return json({ error: 'Failed to add comment' }, { status: 500 });
  }
};
