import { json } from '@sveltejs/kit';
import db from '$lib/db';

export const GET = async ({ params }) => {
  try {
    const slug = params.post;
    
    if (!slug) {
      return json({ error: 'Post slug is required' }, { status: 400 });
    }

    // Truy vấn bài viết dựa trên slug
    const result = await db.query(
      `SELECT id, title, slug, content, excerpt, coverImage, coverWidth, coverHeight, date, categories
       FROM posts
       WHERE slug = $1`,
      [slug]
    );

    // Nếu không tìm thấy bài viết, thử đọc từ file markdown
    if (result.rows.length === 0) {
      try {
        const post = await import(`../../../lib/posts/${slug}.md`);
        return json({
          post: {
            ...post.metadata,
            content: post.default.render().html,
            slug
          }
        });
      } catch (err) {
        return json({ error: 'Post not found' }, { status: 404 });
      }
    }

    // Định dạng lại kết quả
    const post = result.rows[0];
    
    return json({
      post: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt,
        coverImage: post.coverimage,
        coverWidth: post.coverwidth,
        coverHeight: post.coverheight,
        date: post.date.toISOString().split('T')[0],
        categories: post.categories
      }
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    return json({ error: 'Failed to fetch post' }, { status: 500 });
  }
};
