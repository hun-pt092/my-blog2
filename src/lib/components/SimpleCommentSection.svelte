<!-- Simple test version of CommentSection -->
<script>
  export let postSlug;
  
  console.log('SimpleCommentSection loaded with postSlug:', postSlug);
  
  let message = "CommentSection is working!";
  let count = 0;
  
  function increment() {
    count++;
  }
</script>

<div style="border: 2px solid green; padding: 20px; margin: 10px 0; background: lightgreen;">
  <h3>Simple CommentSection Test</h3>
  <p>PostSlug: {postSlug}</p>
  <p>Message: {message}</p>
  <p>Count: {count}</p>
  <button on:click={increment}>Increment</button>
</div>
