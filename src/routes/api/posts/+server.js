import { json } from '@sveltejs/kit';
import { postsPerPage } from '$lib/config';
import fetchPosts from '$lib/assets/js/fetchPosts';

export const prerender = false;

export const GET = async ({ url }) => {
  const offset = parseInt(url.searchParams.get('offset')) || 0;
  const limit = parseInt(url.searchParams.get('limit')) || postsPerPage;
  const category = url.searchParams.get('category') || '';

  const options = {
    offset,
    limit, 
    category
  };

  const { posts } = await fetchPosts(options);
  
  return json(posts);
};
