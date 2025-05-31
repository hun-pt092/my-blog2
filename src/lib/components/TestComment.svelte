<!-- Minimal test component -->
<script>
  export let postSlug;
  console.log('TestComment: postSlug =', postSlug);
</script>

<div style="background: red; color: white; padding: 20px; margin: 20px; border: 3px solid black;">
  <h2>🚨 TEST COMMENT COMPONENT 🚨</h2>
  <p>PostSlug: {postSlug}</p>
  <p>If you see this red box, components are working!</p>
</div>
