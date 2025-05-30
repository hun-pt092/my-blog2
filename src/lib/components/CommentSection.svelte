<!-- src/lib/components/CommentSection.svelte -->
<script>
  import { onMount, onDestroy } from 'svelte';
  import { io } from 'socket.io-client';
  import { format } from 'date-fns';
  import { page } from '$app/stores';

  export let postSlug;
  export let postId;

  let comments = [];
  let newComment = { author: '', content: '' };
  let isSubmitting = false;
  let socket;
  let error = '';

  // Kết nối socket khi component mount
  onMount(async () => {
    // Lấy danh sách bình luận hiện có
    fetchExistingComments();

    // Kết nối websocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const wsPort = 3001; // Port cho websocket
    const wsUrl = `${protocol}//${host}:${wsPort}`;

    console.log(`Connecting to WebSocket at ${wsUrl}`);
    socket = io(wsUrl);

    // Xử lý khi kết nối thành công
    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      // Đăng ký theo dõi bài viết hiện tại
      socket.emit('join_post', postSlug);
    });

    // Lắng nghe sự kiện bình luận mới
    socket.on('comment_added', (newComment) => {
      console.log('New comment received:', newComment);
      comments = [...comments, newComment];
    });

    // Xử lý lỗi
    socket.on('comment_error', (data) => {
      error = data.error;
      isSubmitting = false;
    });

    // Xử lý ngắt kết nối
    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });
  });

  // Hủy kết nối socket khi component unmount
  onDestroy(() => {
    if (socket) {
      socket.emit('leave_post', postSlug);
      socket.disconnect();
    }
  });

  // Lấy danh sách bình luận hiện có từ API
  async function fetchExistingComments() {
    try {
      const response = await fetch(`/api/comments?slug=${postSlug}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch comments');
      }
      
      comments = data.comments;
    } catch (err) {
      console.error('Error fetching comments:', err);
      error = err.message;
    }
  }

  // Xử lý gửi bình luận mới
  async function submitComment() {
    if (!newComment.author.trim() || !newComment.content.trim()) {
      error = 'Please fill in all fields';
      return;
    }

    isSubmitting = true;
    error = '';

    try {
      // Gửi bình luận qua API
      const response = await fetch(`/api/comments?slug=${postSlug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          author: newComment.author,
          content: newComment.content
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit comment');
      }
      
      // Nếu submit thành công qua API, gửi realtime thông qua socket
      socket.emit('new_comment', {
        post_id: postId,
        postSlug,
        author: newComment.author,
        content: newComment.content
      });

      // Reset form
      newComment.content = '';
    } catch (err) {
      console.error('Error submitting comment:', err);
      error = err.message;
    } finally {
      isSubmitting = false;
    }
  }

  // Format thời gian
  function formatDate(dateString) {
    const date = new Date(dateString);
    return format(date, 'PPp'); // Example: "Apr 29, 2023, 3:30 PM"
  }
</script>

<div class="comments-section">
  <h2>Comments</h2>
  
  {#if comments.length > 0}
    <ul class="comments-list">
      {#each comments as comment (comment.id)}
        <li class="comment">
          <div class="comment-header">
            <strong>{comment.author}</strong>
            <span class="comment-date">{formatDate(comment.created_at)}</span>
          </div>
          <div class="comment-content">
            {comment.content}
          </div>
        </li>
      {/each}
    </ul>
  {:else}
    <p>No comments yet. Be the first to comment!</p>
  {/if}

  <div class="comment-form">
    <h3>Leave a comment</h3>
    
    {#if error}
      <div class="error-message">
        {error}
      </div>
    {/if}
    
    <form on:submit|preventDefault={submitComment}>
      <div class="form-group">
        <label for="author">Your Name</label>
        <input 
          type="text" 
          id="author" 
          bind:value={newComment.author} 
          required 
          disabled={isSubmitting}
        />
      </div>
      
      <div class="form-group">
        <label for="content">Comment</label>
        <textarea 
          id="content" 
          bind:value={newComment.content} 
          rows="4" 
          required 
          disabled={isSubmitting}
        ></textarea>
      </div>
      
      <button type="submit" class="submit-btn" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit Comment'}
      </button>
    </form>
  </div>
</div>

<style>
  .comments-section {
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 1px solid var(--color-bg-secondary);
  }
  
  .comments-list {
    list-style: none;
    padding: 0;
  }
  
  .comment {
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: var(--color-bg-secondary);
    border-radius: 0.5rem;
  }
  
  .comment-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.75rem;
    font-size: 0.9rem;
  }
  
  .comment-date {
    color: var(--color-text-secondary);
    font-size: 0.8rem;
  }
  
  .comment-content {
    line-height: 1.5;
  }
  
  .comment-form {
    margin-top: 2rem;
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
  }
  
  input, textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: 0.25rem;
    background: var(--color-bg);
    color: var(--color-text);
  }
  
  .submit-btn {
    padding: 0.75rem 1.5rem;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    font-weight: bold;
    transition: background-color 0.2s;
  }
  
  .submit-btn:hover:not(:disabled) {
    background: var(--color-primary-darker);
  }
  
  .submit-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  .error-message {
    color: #e53e3e;
    background-color: #fed7d7;
    padding: 0.75rem;
    border-radius: 0.25rem;
    margin-bottom: 1.5rem;
  }
</style>
