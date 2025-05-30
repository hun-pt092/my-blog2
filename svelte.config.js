import adapter from '@sveltejs/adapter-node';
import { mdsvex } from 'mdsvex';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Ensures both .svelte and .md files are treated as components (can be imported and used anywhere, or used as pages)
	extensions: [".svelte", ".md"],
	kit: {
		adapter: adapter({
			// Câu hình adapter để tạo phần động cho API thời gian thực
			fallback: 'index.html',
			precompress: false,
			strict: true
		}),
		files: {
			assets: 'static'
		},
		prerender: {
			// Disable prerender API routes for comments và các API động
			entries: [
				'*',
				'/api/posts/page/*',
				'/blog/category/*/page/',
				'/blog/category/*/page/*',
				'/blog/category/page/',
				'/blog/category/page/*',
				'/blog/page/',
				'/blog/page/*',
			],
			handleHttpError: 'warn'
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
