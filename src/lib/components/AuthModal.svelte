<script>
  import { AuthService } from '$lib/stores/auth.js';
  
  export let mode = 'login'; // 'login' or 'register'
  export let onSuccess = () => {};
  export let onClose = () => {};
    let formData = {
    usernameOrEmail: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  };
  
  let loading = false;
  let error = '';
  let validationErrors = {};
  let showPassword = false;
  let showConfirmPassword = false;
  
  function validateForm() {
    validationErrors = {};
    
    if (mode === 'register') {
      if (!formData.username || formData.username.length < 3) {
        validationErrors.username = 'Username must be at least 3 characters';
      }
      
      if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        validationErrors.email = 'Please enter a valid email';
      }
      
      if (!formData.password || formData.password.length < 6) {
        validationErrors.password = 'Password must be at least 6 characters';
      }
      
      if (formData.password !== formData.confirmPassword) {
        validationErrors.confirmPassword = 'Passwords do not match';
      }
    } else {
      if (!formData.usernameOrEmail) {
        validationErrors.usernameOrEmail = 'Username or email is required';
      }
      
      if (!formData.password) {
        validationErrors.password = 'Password is required';
      }
    }
    
    return Object.keys(validationErrors).length === 0;
  }
  
  async function handleSubmit() {
    if (!validateForm()) return;
    
    loading = true;
    error = '';
    
    try {
      let result;
      
      if (mode === 'register') {
        result = await AuthService.register(
          formData.username,
          formData.email,
          formData.password,
          formData.displayName || formData.username
        );
      } else {
        result = await AuthService.login(
          formData.usernameOrEmail,
          formData.password
        );
      }
      
      if (result.success) {
        onSuccess();
      } else {
        error = result.error;
      }
    } finally {
      loading = false;
    }
  }
    function switchMode() {
    mode = mode === 'login' ? 'register' : 'login';
    error = '';
    validationErrors = {};
    showPassword = false;
    showConfirmPassword = false;
    formData = {
      usernameOrEmail: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      displayName: ''
    };
  }

  function togglePasswordVisibility() {
    showPassword = !showPassword;
  }

  function toggleConfirmPasswordVisibility() {
    showConfirmPassword = !showConfirmPassword;
  }

  function handleOverlayClick(event) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }
</script>

<div class="auth-modal-overlay" on:click={handleOverlayClick} role="dialog" aria-modal="true">
  <div class="auth-modal" on:click|stopPropagation>
    <div class="auth-header">
      <h2>{mode === 'login' ? 'Sign In' : 'Create Account'}</h2>
      <button class="close-btn" on:click={onClose} aria-label="Close">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6 6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
    
    <form on:submit|preventDefault={handleSubmit} class="auth-form">
      {#if error}
        <div class="error-message">{error}</div>
      {/if}
      
      {#if mode === 'login'}
        <div class="form-group">
          <label for="usernameOrEmail">Username or Email</label>
          <input
            id="usernameOrEmail"
            type="text"
            bind:value={formData.usernameOrEmail}
            class:error={validationErrors.usernameOrEmail}
            placeholder="Enter your username or email"
            disabled={loading}
          />
          {#if validationErrors.usernameOrEmail}
            <span class="field-error">{validationErrors.usernameOrEmail}</span>
          {/if}
        </div>
      {:else}
        <div class="form-group">
          <label for="username">Username</label>
          <input
            id="username"
            type="text"
            bind:value={formData.username}
            class:error={validationErrors.username}
            placeholder="Choose a username"
            disabled={loading}
          />
          {#if validationErrors.username}
            <span class="field-error">{validationErrors.username}</span>
          {/if}
        </div>
        
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            type="email"
            bind:value={formData.email}
            class:error={validationErrors.email}
            placeholder="Enter your email"
            disabled={loading}
          />
          {#if validationErrors.email}
            <span class="field-error">{validationErrors.email}</span>
          {/if}
        </div>
        
        <div class="form-group">
          <label for="displayName">Display Name (Optional)</label>
          <input
            id="displayName"
            type="text"
            bind:value={formData.displayName}
            placeholder="How others will see you"
            disabled={loading}
          />
        </div>
      {/if}
      
      <div class="form-group">
        <label for="password">Password</label>
        <input
          id="password"
          type="password"
          bind:value={formData.password}
          class:error={validationErrors.password}
          placeholder="Enter your password"
          disabled={loading}
        />
        {#if validationErrors.password}
          <span class="field-error">{validationErrors.password}</span>
        {/if}
      </div>
      
      {#if mode === 'register'}
        <div class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            bind:value={formData.confirmPassword}
            class:error={validationErrors.confirmPassword}
            placeholder="Confirm your password"
            disabled={loading}
          />
          {#if validationErrors.confirmPassword}
            <span class="field-error">{validationErrors.confirmPassword}</span>
          {/if}
        </div>
      {/if}
      
      <button type="submit" class="submit-btn" disabled={loading}>
        {#if loading}
          <span class="spinner"></span>
          {mode === 'login' ? 'Signing In...' : 'Creating Account...'}
        {:else}
          {mode === 'login' ? 'Sign In' : 'Create Account'}
        {/if}
      </button>
    </form>
    
    <div class="auth-footer">
      <p>
        {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
        <button type="button" class="link-btn" on:click={switchMode}>
          {mode === 'login' ? 'Sign up' : 'Sign in'}
        </button>
      </p>
    </div>
  </div>
</div>

<style>
  .auth-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }
  
  .auth-modal {
    background: white;
    border-radius: 12px;
    width: 100%;
    max-width: 400px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }
  
  .auth-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 1.5rem 0;
  }
  
  .auth-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
  }
  
  .close-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 6px;
    color: #6b7280;
    transition: all 0.2s;
  }
  
  .close-btn:hover {
    background: #f3f4f6;
    color: #374151;
  }
  
  .auth-form {
    padding: 1.5rem;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #374151;
    font-size: 0.875rem;
  }
  
  .form-group input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 1rem;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
  }
  
  .form-group input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .form-group input.error {
    border-color: #ef4444;
  }
  
  .form-group input:disabled {
    background: #f9fafb;
    cursor: not-allowed;
  }
  
  .field-error {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.75rem;
    color: #ef4444;
  }
  
  .error-message {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
    padding: 0.75rem;
    border-radius: 6px;
    margin-bottom: 1rem;
    font-size: 0.875rem;
  }
  
  .submit-btn {
    width: 100%;
    background: #3b82f6;
    color: white;
    border: none;
    padding: 0.75rem;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }
  
  .submit-btn:hover:not(:disabled) {
    background: #2563eb;
  }
  
  .submit-btn:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
  
  .spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  .auth-footer {
    padding: 0 1.5rem 1.5rem;
    text-align: center;
  }
  
  .auth-footer p {
    margin: 0;
    color: #6b7280;
    font-size: 0.875rem;
  }
  
  .link-btn {
    background: none;
    border: none;
    color: #3b82f6;
    cursor: pointer;
    font-weight: 500;
    text-decoration: underline;
    font-size: inherit;
  }
  
  .link-btn:hover {
    color: #2563eb;
  }
</style>
