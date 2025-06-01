import { json } from '@sveltejs/kit';
import { db } from '$lib/db';

export const GET = async ({ url }) => {
  const slug = url.searchParams.get('slug');

  if (!slug) {
    return json({ error: 'Slug is required' }, { status: 400 });
  }

  try {
    const result = await db.query(
      'SELECT id, title, slug, date FROM posts WHERE slug = $1',
      [slug]
    );

    if (result.rows.length === 0) {
      return json({ error: 'Post not found' }, { status: 404 });
    }

    return json({ post: result.rows[0] });
  } catch (error) {
    console.error('Error fetching post by slug:', error);
    return json({ error: 'Failed to fetch post' }, { status: 500 });
  }
};
