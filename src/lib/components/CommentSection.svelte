<!-- src/lib/components/CommentSection.svelte -->
<script>
  import { onMount, onDestroy } from 'svelte';
  import { io } from 'socket.io-client';
  import { format } from 'date-fns';
  import { page } from '$app/stores';
  import { user, isAuthenticated, AuthService } from '$lib/stores/auth.js';
  import AuthModal from './AuthModal.svelte';

  export let postSlug;
  export let postId;
  
  console.log('CommentSection: Component loaded with postSlug =', postSlug);
  let comments = [];
  let newComment = { content: '' };
  let isSubmitting = false;
  let socket;
  let error = '';
  let isLoading = true;
  let commentCount = 0;
  let sortBy = 'newest'; // newest, oldest, popular
  let showCommentForm = false;
  let userVotes = new Map(); // Track user's votes by comment ID
  let votingStates = new Map(); // Track voting loading states
  let showAuthModal = false;
  let authMode = 'login';

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
    });    // Lắng nghe sự kiện bình luận mới
    socket.on('comment_added', (newComment) => {
      console.log('New comment received via WebSocket:', newComment);
      
      // Kiểm tra nếu comment này từ chính người dùng hiện tại 
      // (để tránh hiển thị duplicate vì chúng ta đã thêm đó khi gửi)
      if (newComment.author === ($user.display_name || $user.username)) {
        console.log('Ignoring own comment received via WebSocket');
        return;
      }
      
      // Kiểm tra duplicate để tránh hiển thị comment 2 lần
      const exists = comments.find(c => c.id === newComment.id);
      if (!exists) {
        console.log('Adding new comment from WebSocket to UI');
        comments = [newComment, ...comments]; // Thêm vào đầu list
        commentCount += 1;
      }
    });// Lắng nghe cập nhật số lượng comment
    socket.on('comment_count_updated', (data) => {
      commentCount = data.count;
    });

    // Lắng nghe cập nhật vote real-time
    socket.on('comment_vote_updated', (data) => {
      // Update comment likes/dislikes in real-time
      comments = comments.map(comment => {
        if (comment.id === data.commentId) {
          return {
            ...comment,
            likes: data.likes,
            dislikes: data.dislikes
          };
        }
        return comment;
      });
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
  });  // Lấy danh sách bình luận hiện có từ API
  async function fetchExistingComments() {
    try {
      isLoading = true;
      const response = await fetch(`/api/comments?slug=${postSlug}&sort=${sortBy}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch comments');
      }      
      comments = data.comments || [];
      commentCount = data.count || 0;

      // Fetch user votes if authenticated
      if ($isAuthenticated) {
        fetchUserVotes();
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
      error = err.message;
    } finally {
      isLoading = false;
    }
  }
  // Xử lý gửi bình luận mới
  async function submitComment() {
    // Check authentication first
    if (!$isAuthenticated) {
      showAuthModal = true;
      authMode = 'login';
      return;
    }

    if (!newComment.content.trim()) {
      error = 'Please enter your comment';
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
        credentials: 'include',
        body: JSON.stringify({
          content: newComment.content
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) {
          // Authentication required
          showAuthModal = true;
          authMode = 'login';
          error = 'Please sign in to comment';
          return;
        }
        throw new Error(data.error || 'Failed to submit comment');
      }
        // Thêm bình luận vào giao diện người dùng ngay lập tức
      const localComment = {
        id: data.comment?.id || `temp-${Date.now()}`,
        author: $user.display_name || $user.username,
        content: newComment.content,
        created_at: new Date().toISOString(),
        likes: 0,
        dislikes: 0
      };
      
      // Thêm bình luận vào đầu danh sách
      comments = [localComment, ...comments];
      commentCount += 1;
      
      // Nếu submit thành công qua API, gửi realtime thông qua socket cho các người dùng khác
      if (socket && socket.connected) {
        console.log('Emitting new_comment event via WebSocket', { postSlug, postId });
        socket.emit('new_comment', {
          post_id: postId,
          postSlug,
          author: $user.display_name || $user.username,
          content: newComment.content
        });
      }

      // Reset form
      newComment = { content: '' };
      showCommentForm = false;
    } catch (err) {
      console.error('Error submitting comment:', err);
      error = err.message;
    } finally {
      isSubmitting = false;
    }
  }

  // Sort comments
  function handleSortChange() {
    fetchExistingComments();
  }

  // Generate avatar placeholder
  function getAvatarColor(name) {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
  function getInitials(name) {
    return name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
  }

  // Generate simple user identifier for voting
  function generateUserIdentifier() {
    // Simple identifier based on session + timestamp
    let identifier = localStorage.getItem('userIdentifier');
    if (!identifier) {
      identifier = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('userIdentifier', identifier);
    }
    return identifier;
  }

  // Handle authentication modal
  function openAuthModal(mode = 'login') {
    authMode = mode;
    showAuthModal = true;
  }

  function closeAuthModal() {
    showAuthModal = false;
  }

  function handleAuthSuccess() {
    closeAuthModal();
    // Refresh user votes after login
    if ($isAuthenticated) {
      fetchUserVotes();
    }
  }

  // Fetch user's votes for all comments
  async function fetchUserVotes() {
    if (!$isAuthenticated || comments.length === 0) return;
    
    try {
      const commentIds = comments.map(c => c.id);
      const response = await fetch('/api/comments/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ commentIds })
      });

      if (response.ok) {
        const data = await response.json();
        userVotes.clear();
        data.votes.forEach(vote => {
          userVotes.set(vote.comment_id, vote.vote_type);
        });
        userVotes = userVotes; // Trigger reactivity
      }
    } catch (err) {
      console.error('Error fetching user votes:', err);
    }
  }// Handle like/dislike votes
  async function handleVote(commentId, voteType) {
    // Check authentication first
    if (!$isAuthenticated) {
      showAuthModal = true;
      authMode = 'login';
      return;
    }

    // Prevent multiple votes at once
    if (votingStates.get(commentId)) {
      return;
    }

    votingStates.set(commentId, true);
    votingStates = votingStates; // Trigger reactivity

    try {
      const response = await fetch('/api/comments/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          commentId,
          voteType
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) {
          // Authentication required
          showAuthModal = true;
          authMode = 'login';
          error = 'Please sign in to vote';
          return;
        }
        throw new Error(result.error || 'Failed to vote');
      }

      // Update comment in the list
      comments = comments.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            likes: result.comment.likes,
            dislikes: result.comment.dislikes
          };
        }
        return comment;
      });

      // Update user vote tracking
      if (result.comment.userVote) {
        userVotes.set(commentId, result.comment.userVote);
      } else {
        userVotes.delete(commentId);
      }
      userVotes = userVotes; // Trigger reactivity

      // Emit vote event via websocket for real-time updates
      if (socket && socket.connected) {
        socket.emit('comment_voted', {
          postSlug,
          commentId,
          voteType,
          operation: result.operation,
          likes: result.comment.likes,
          dislikes: result.comment.dislikes
        });
      }

    } catch (err) {
      console.error('Error voting:', err);
      error = err.message;
      // Clear error after 3 seconds
      setTimeout(() => { error = ''; }, 3000);
    } finally {
      votingStates.delete(commentId);
      votingStates = votingStates; // Trigger reactivity
    }  }

  // Format thời gian
  function formatDate(dateString) {
    try {
      const date = new Date(dateString);
      const now = new Date();
      
      // Đảm bảo thời gian không trong tương lai
      if (date > now) {
        return 'just now';
      }
      
      const diffInSeconds = Math.floor((now - date) / 1000);
      
      if (diffInSeconds < 60) return 'just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minute${Math.floor(diffInSeconds / 60) !== 1 ? 's' : ''} ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hour${Math.floor(diffInSeconds / 3600) !== 1 ? 's' : ''} ago`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} day${Math.floor(diffInSeconds / 86400) !== 1 ? 's' : ''} ago`;
      
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown date';
    }
  }

  // Reactive statement: fetch user votes when authentication state changes
  $: if ($isAuthenticated && comments.length > 0) {
    fetchUserVotes();
  }
</script>

<div class="comments-section">
  <div style="background: #ffffcc; border: 1px solid #ccc; padding: 10px; margin: 10px 0;">
    ✅ CommentSection Loaded! PostSlug: <strong>{postSlug}</strong> | Comments: {comments.length}
  </div>
  
  <!-- Comment Header -->
  <div class="comments-header">
    <h2 class="comments-title">
      {#if isLoading}
        Comments
      {:else if commentCount > 0}
        {commentCount} Comment{commentCount !== 1 ? 's' : ''}
      {:else}
        Comments
      {/if}
    </h2>
    
    {#if commentCount > 0}
      <div class="sort-controls">
        <label for="sort-select">Sort by:</label>
        <select id="sort-select" bind:value={sortBy} on:change={handleSortChange}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="popular">Most liked</option>
        </select>
      </div>
    {/if}
  </div>
  <!-- Add Comment Button -->
  <div class="add-comment-section">
    {#if !$isAuthenticated}
      <div class="auth-required">
        <button class="add-comment-btn" on:click={() => openAuthModal('login')}>
          <div class="avatar-placeholder" style="background-color: #ccc;">
            <span>👤</span>
          </div>
          <span>Sign in to add a comment...</span>
        </button>
      </div>
    {:else if !showCommentForm}
      <button class="add-comment-btn" on:click={() => showCommentForm = true}>
        <div class="avatar-placeholder" style="background-color: {getAvatarColor($user.display_name || $user.username)};">
          <span>{getInitials($user.display_name || $user.username)}</span>
        </div>
        <span>Add a comment...</span>
      </button>
    {:else}
      <div class="comment-form-inline">
        {#if error}
          <div class="error-message">
            {error}
          </div>
        {/if}
        
        <form on:submit|preventDefault={submitComment}>
          <div class="form-row">
            <div class="avatar-placeholder" style="background-color: {getAvatarColor($user.display_name || $user.username)};">
              <span>{getInitials($user.display_name || $user.username)}</span>
            </div>
            <div class="form-inputs">
              <textarea 
                placeholder="Add a comment..."
                bind:value={newComment.content} 
                rows="3" 
                required 
                disabled={isSubmitting}
              ></textarea>
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" class="cancel-btn" on:click={() => {showCommentForm = false; newComment = {content: ''}; error = ''}}>
              Cancel
            </button>
            <button type="submit" class="submit-btn" disabled={isSubmitting || !newComment.content.trim()}>
              {isSubmitting ? 'Commenting...' : 'Comment'}
            </button>
          </div>
        </form>
      </div>
    {/if}
  </div>

  <!-- Comments List -->
  {#if isLoading}
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading comments...</p>
    </div>
  {:else if comments.length > 0}
    <div class="comments-list">
      {#each comments as comment (comment.id)}
        <div class="comment-item">
          <div class="comment-avatar">
            <div class="avatar-circle" style="background-color: {getAvatarColor(comment.author)}">
              {getInitials(comment.author)}
            </div>
          </div>
          
          <div class="comment-content">
            <div class="comment-header">
              <span class="comment-author">{comment.author}</span>
              <span class="comment-date">{formatDate(comment.created_at)}</span>
            </div>
            
            <div class="comment-text">
              {comment.content}
            </div>            <div class="comment-actions">
              <button 
                class="action-btn like-btn {userVotes.get(comment.id) === 'like' ? 'active' : ''} {votingStates.get(comment.id) ? 'voting' : ''} {!$isAuthenticated ? 'auth-required' : ''}"
                on:click={() => handleVote(comment.id, 'like')}
                disabled={votingStates.get(comment.id)}
                title={!$isAuthenticated ? 'Sign in to vote' : ''}
              >
                {#if votingStates.get(comment.id)}
                  <span class="voting-spinner">⌛</span>
                {:else}
                  <span class="like-icon">👍</span>
                {/if}
                <span>{comment.likes || 0}</span>
              </button>
              <button 
                class="action-btn dislike-btn {userVotes.get(comment.id) === 'dislike' ? 'active' : ''} {votingStates.get(comment.id) ? 'voting' : ''} {!$isAuthenticated ? 'auth-required' : ''}"
                on:click={() => handleVote(comment.id, 'dislike')}
                disabled={votingStates.get(comment.id)}
                title={!$isAuthenticated ? 'Sign in to vote' : ''}
              >
                {#if votingStates.get(comment.id)}
                  <span class="voting-spinner">⌛</span>
                {:else}
                  <span class="dislike-icon">👎</span>
                {/if}
                {#if comment.dislikes > 0}
                  <span>{comment.dislikes}</span>
                {/if}
              </button>
              <button class="action-btn reply-btn {!$isAuthenticated ? 'auth-required' : ''}" 
                      title={!$isAuthenticated ? 'Sign in to reply' : ''}
                      disabled={!$isAuthenticated}>
                Reply
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="empty-state">
      <div class="empty-icon">💬</div>
      <h3>No comments yet</h3>
      <p>Be the first to share what you think!</p>    </div>
  {/if}
</div>

{#if showAuthModal}
  <AuthModal 
    mode={authMode} 
    onClose={closeAuthModal}
    onSuccess={handleAuthSuccess}
  />
{/if}

<style>
  .comments-section {
    margin-top: 3rem;
    padding-top: 2rem;
    max-width: 800px;
  }
  
  .comments-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e0e0e0;
  }
  
  .comments-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
    color: #0f0f0f;
  }
  
  .sort-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
  }
  
  .sort-controls select {
    padding: 0.25rem 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: white;
  }
    .add-comment-section {
    margin-bottom: 2rem;
  }

  .auth-required {
    opacity: 0.8;
  }
  
  .add-comment-btn {
    display: flex;
    align-items: center;
    gap: 1rem;
    width: 100%;
    padding: 0.75rem;
    background: #f9f9f9;
    border: 1px solid #e0e0e0;
    border-radius: 24px;
    cursor: pointer;
    text-align: left;
    font-size: 0.9rem;
    color: #606060;
    transition: background-color 0.2s;
  }
  
  .add-comment-btn:hover {
    background: #f0f0f0;
  }
  
  .avatar-placeholder, .avatar-circle {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: 600;
    color: white;
    flex-shrink: 0;
  }
  
  .comment-form-inline {
    background: white;
    border-radius: 8px;
    padding: 1rem;
    border: 1px solid #e0e0e0;
  }
  
  .form-row {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
  }
    .form-inputs {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .form-inputs textarea {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-family: inherit;
    font-size: 0.9rem;
    resize: vertical;
  }
  
  .form-inputs textarea:focus {
    outline: none;
    border-color: #065fd4;
    box-shadow: 0 0 0 1px #065fd4;
  }
  
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }
  
  .cancel-btn,
  .submit-btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 18px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .cancel-btn {
    background: transparent;
    color: #606060;
  }
  
  .cancel-btn:hover {
    background: #f0f0f0;
  }
  
  .submit-btn {
    background: #065fd4;
    color: white;
  }
  
  .submit-btn:hover:not(:disabled) {
    background: #054bb8;
  }
  
  .submit-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
  
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
    color: #606060;
  }
  
  .loading-spinner {
    width: 24px;
    height: 24px;
    border: 2px solid #e0e0e0;
    border-top: 2px solid #065fd4;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: #606060;
  }
  
  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }
  
  .empty-state h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.2rem;
    color: #0f0f0f;
  }
  
  .comments-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .comment-item {
    display: flex;
    gap: 1rem;
  }
  
  .comment-avatar {
    flex-shrink: 0;
  }
  
  .comment-content {
    flex: 1;
    min-width: 0;
  }
  
  .comment-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
  }
  
  .comment-author {
    font-weight: 500;
    font-size: 0.85rem;
    color: #0f0f0f;
  }
  
  .comment-date {
    font-size: 0.75rem;
    color: #606060;
  }
  
  .comment-text {
    line-height: 1.4;
    margin-bottom: 0.5rem;
    word-wrap: break-word;
    font-size: 0.9rem;
  }
  
  .comment-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .action-btn {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    background: none;
    border: none;
    color: #606060;
    font-size: 0.75rem;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    transition: all 0.2s;
  }
    .action-btn:hover {
    background: #f0f0f0;
  }
    .action-btn.active {
    background: #e8f0fe;
    color: #1976d2;
  }

  .action-btn.auth-required {
    opacity: 0.6;
    cursor: help;
  }
  
  .like-btn.active .like-icon {
    color: #1976d2;
  }
    .action-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .action-btn.voting {
    pointer-events: none;
  }
  
  .voting-spinner {
    animation: pulse 1s infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  .like-icon, .dislike-icon {
    font-size: 0.8rem;
  }
  
  .error-message {
    color: #d93025;
    background-color: #fce8e6;
    padding: 0.75rem;
    border-radius: 4px;
    margin-bottom: 1rem;
    font-size: 0.85rem;
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .comments-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }
    
    .comment-item {
      gap: 0.75rem;
    }
    
    .avatar-placeholder, .avatar-circle {
      width: 28px;
      height: 28px;
      font-size: 0.7rem;
    }
  }
</style>
