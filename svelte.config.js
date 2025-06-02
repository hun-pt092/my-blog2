import netlifyAdapter from '@sveltejs/adapter-netlify';
import vercelAdapter from '@sveltejs/adapter-vercel';
import { mdsvex } from 'mdsvex';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Ensures both .svelte and .md files are treated as components (can be imported and used anywhere, or used as pages)
	extensions: [".svelte", ".md"],
	kit: {
		// Chọn adapter dựa vào biến môi trường ADAPTER
		adapter: process.env.ADAPTER === 'netlify' 
			? netlifyAdapter({
				// Cấu hình adapter cho Netlify
				edge: false,
				split: false
			}) 
			: vercelAdapter(),
		files: {
			assets: 'static'
		},		
		prerender: {
			// Disable prerendering for dynamic routes
			entries: [],
			// Explicitly opt out of prerendering problematic routes
			handleMissingId: 'ignore',
			handleHttpError: ({ path, referrer, message }) => {
				// Bỏ qua lỗi 404 cho các dynamic routes
				if (message.includes('Not found')) return;
				console.warn(`${path} referenced from ${referrer} - ${message}`);
			}
		},
	},

	preprocess: [
		mdsvex({
			// The default mdsvex extension is .svx; this overrides that.
			extensions: [".md"],

			// Adds IDs to headings, and anchor links to those IDs. Note: must stay in this order to work.
			rehypePlugins: [
				rehypeSlug,
				rehypeAutolinkHeadings,
			],
		}),
	],
};

export default config;
