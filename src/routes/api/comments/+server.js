import { json } from '@sveltejs/kit';
import db from '$lib/db';

export const GET = async ({ url, params }) => {
  const postSlug = url.searchParams.get('slug');

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

    // Now get all comments for this post
    const commentResult = await db.query(
      `SELECT id, author, content, created_at 
       FROM comments 
       WHERE post_id = $1 
       ORDER BY created_at ASC`,
      [postId]
    );

    // Return comments
    return json({
      comments: commentResult.rows.map(comment => ({
        id: comment.id,
        author: comment.author,
        content: comment.content,
        created_at: comment.created_at
      }))
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
    // Get post ID from slug
    const postResult = await db.query(
      'SELECT id FROM posts WHERE slug = $1',
      [postSlug]
    );

    if (postResult.rows.length === 0) {
      return json({ error: 'Post not found' }, { status: 404 });
    }

    const postId = postResult.rows[0].id;
    const { author, content } = await request.json();

    // Validate input
    if (!author || !content) {
      return json({ error: 'Author and content are required' }, { status: 400 });
    }

    // Insert the comment
    const result = await db.query(
      `INSERT INTO comments (post_id, author, content) 
       VALUES ($1, $2, $3)
       RETURNING id, author, content, created_at`,
      [postId, author, content]
    );

    // Return the new comment
    return json({
      comment: {
        id: result.rows[0].id,
        author: result.rows[0].author,
        content: result.rows[0].content,
        created_at: result.rows[0].created_at
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding comment:', error);
    return json({ error: 'Failed to add comment' }, { status: 500 });
  }
};
