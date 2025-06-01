import { error } from '@sveltejs/kit'

export const load = async ({ params }) => {
	try {	
		// Decode URL-encoded parameters to handle special characters like &
		const decodedSlug = decodeURIComponent(params.post)
		console.log('Loading post with slug:', decodedSlug, 'from params:', params.post)
		
		const post = await import(`../../../lib/posts/${decodedSlug}.md`)

		return {
			PostContent: post.default,
			meta: { ...post.metadata, slug: decodedSlug } 
		}
	} catch(err) {
		console.error('Error loading post:', params.post, 'decoded:', decodeURIComponent(params.post), err)
		error(404, `Post not found: ${params.post}`);
	}
}
