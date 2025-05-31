<!-- Test page for CommentSection debugging -->
<script>
  import CommentSection from '$lib/components/CommentSection.svelte';
  import SimpleCommentSection from '$lib/components/SimpleCommentSection.svelte';
</script>

<h1>Test CommentSection</h1>
<p>This is a test page to debug the CommentSection component.</p>

<div style="border: 2px solid blue; padding: 20px; margin: 20px 0;">
  <h2>SimpleCommentSection Test:</h2>
  <SimpleCommentSection postSlug="he-phan-tan" />
</div>

<div style="border: 2px solid red; padding: 20px; margin: 20px 0;">
  <h2>Full CommentSection should appear below:</h2>
  <CommentSection postSlug="he-phan-tan" />
</div>

<p>If you see components above, they are loading correctly.</p>
