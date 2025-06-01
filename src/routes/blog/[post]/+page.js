import { error } from '@sveltejs/kit'

// Map to handle URL-to-filename normalization
const urlToFileMap = {
    'Dinh_danh': 'Dinh_danh',
    'Kien_truc_HPT': 'Kien_truc_HPT',
    'truyen_thong': 'truyen_thong',
    'tien-trinh-luong': 'tien-trinh-luong',
    'he-phan-tan': 'he-phan-tan'
};

export const load = async ({ params, fetch }) => {
	try {	
		// Decode URL-encoded parameters to handle special characters like &
		const decodedSlug = decodeURIComponent(params.post)
		console.log('Loading post with slug:', decodedSlug, 'from params:', params.post)
		
		// Check if we have a mapping for this URL, otherwise use the URL parameter directly
		const filename = urlToFileMap[decodedSlug] || decodedSlug
		console.log('Using filename:', filename)
		
		// Load the markdown file
		const post = await import(`../../../lib/posts/${filename}.md`)
		
		// Fetch post data from database for comments
		let dbPost = null;
		try {
			// Thử tìm post theo URL slug
			const response = await fetch(`/api/posts/by-slug?slug=${decodedSlug}`);
			if (response.ok) {
				const data = await response.json();
				dbPost = data.post;
				console.log('Found post in database by URL slug:', dbPost);
			} else {
				// Nếu không tìm thấy, thử tìm theo tên file
				const fileResponse = await fetch(`/api/posts/by-slug?slug=${filename}`);
				if (fileResponse.ok) {
					const fileData = await fileResponse.json();
					dbPost = fileData.post;
					console.log('Found post in database by filename:', dbPost);
				} else {
					console.warn('Post not found in database:', filename);
				}
			}
		} catch (dbErr) {
			console.error('Error fetching post from database:', dbErr);
		}

		return {
			PostContent: post.default,
			meta: { ...post.metadata, slug: filename }, // Use filename as slug for database consistency
			dbPost
		}
	} catch(err) {
		console.error('Error loading post:', params.post, 'decoded:', decodeURIComponent(params.post), err)
		error(404, `Post not found: ${params.post}`);
	}
}
