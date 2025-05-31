<script>
	import { preventDefault } from 'svelte/legacy';
	import { user, isAuthenticated, AuthService } from '$lib/stores/auth.js';
	import AuthModal from './AuthModal.svelte';

	import MainNav from './MainNav.svelte'
	import HamburgerMenuButton from './HamburgerMenuButton.svelte'
	import { siteTitle } from '$lib/config'

	let showAuthModal = false;
	let authMode = 'login';
	let showUserMenu = false;

	const focusMain = () => {
		const main = document.querySelector('main');
		main.focus();
	}

	function openAuthModal(mode = 'login') {
		authMode = mode;
		showAuthModal = true;
	}

	function closeAuthModal() {
		showAuthModal = false;
	}

	function handleAuthSuccess() {
		closeAuthModal();
	}

	async function handleLogout() {
		await AuthService.logout();
		showUserMenu = false;
	}

	function toggleUserMenu() {
		showUserMenu = !showUserMenu;
	}

	// Close user menu when clicking outside
	function handleClickOutside(event) {
		if (showUserMenu && !event.target.closest('.user-menu-container')) {
			showUserMenu = false;
		}
	}
</script>

<svelte:window on:click={handleClickOutside} />

<header>
	<a onclick={preventDefault(focusMain)} class="skip-to-content-link" href="#main">
		Skip to main content
	</a>
	
	<!-- First Row: Site Title -->
	<div class="header-top">
		<a href="/" class="site-title">
			{siteTitle}
		</a>
	</div>
		<!-- Second Row: Navigation and Auth -->
	<div class="header-bottom">
		<div class="left-section">
			<HamburgerMenuButton />
		</div>
		<MainNav />
		<!-- Auth Section -->
		<div class="auth-section">
			{#if $isAuthenticated && $user}
				<div class="user-menu-container">
					<button class="user-button" onclick={toggleUserMenu}>
						<div class="user-avatar">
							{#if $user.avatarUrl}
								<img src={$user.avatarUrl} alt="{$user.displayName || $user.username}" />
							{:else}
								<span>{($user.displayName || $user.username).charAt(0).toUpperCase()}</span>
							{/if}
						</div>
						<span class="user-name">{$user.displayName || $user.username}</span>
						<svg class="chevron" class:rotated={showUserMenu} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M6 9l6 6 6-6"/>
						</svg>
					</button>
					
					{#if showUserMenu}
						<div class="user-menu">
							<div class="user-info">
								<div class="user-avatar large">
									{#if $user.avatarUrl}
										<img src={$user.avatarUrl} alt="{$user.displayName || $user.username}" />
									{:else}
										<span>{($user.displayName || $user.username).charAt(0).toUpperCase()}</span>
									{/if}
								</div>
								<div>
									<div class="user-display-name">{$user.displayName || $user.username}</div>
									<div class="user-email">{$user.email}</div>
								</div>
							</div>
							<hr />
							<button class="menu-item" onclick={handleLogout}>
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
								</svg>
								Sign Out
							</button>
						</div>
					{/if}
				</div>
			{:else}
				<div class="auth-buttons">
					<button class="auth-btn login-btn" onclick={() => openAuthModal('login')}>
						Sign In
					</button>
					<button class="auth-btn register-btn" onclick={() => openAuthModal('register')}>
						Sign Up
					</button>
				</div>
			{/if}
		</div>
	</div>
</header>

{#if showAuthModal}
	<AuthModal 
		mode={authMode} 
		onSuccess={handleAuthSuccess} 
		onClose={closeAuthModal} 
	/>
{/if}

<style>
	.skip-to-content-link {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		border: 0;
	}	header {
		position: relative;
		z-index: 1000;
		padding: 0.5rem 1rem;
		background: white;
		border-bottom: 1px solid var(--color-border);
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.header-top {
		/*display: flex;
		justify-content: center;
		align-items: center;
		*/
		text-align: center;
	}

	.header-bottom {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
	}	.site-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-primary);
		text-decoration: none;
		text-align: center;
		margin: 0 auto;
	}	/* Hide hamburger menu on desktop */
	:global(.hamburger-menu-button) {
		display: none;
	}

	.left-section {
		grid-column: 1;
		justify-self: start;
		display: flex;
		align-items: center;
	}.auth-section {
		grid-column: 3;
		justify-self: end;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.auth-buttons {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.auth-btn {
		padding: 0.5rem 1rem;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		border: 1px solid transparent;
	}

	.login-btn {
		background: transparent;
		color: var(--color-text);
		border-color: var(--color-border);
	}

	.login-btn:hover {
		background: var(--color-bg-1);
	}

	.register-btn {
		background: var(--color-primary);
		color: white;
		border-color: var(--color-primary);
	}

	.register-btn:hover {
		background: var(--color-primary-dark, #2563eb);
	}

	.user-menu-container {
		position: relative;
	}

	.user-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		background: transparent;
		border: 1px solid var(--color-border);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.user-button:hover {
		background: var(--color-bg-1);
	}

	.user-avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: var(--color-primary);
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-weight: 600;
		font-size: 0.875rem;
		overflow: hidden;
	}

	.user-avatar.large {
		width: 40px;
		height: 40px;
		font-size: 1rem;
	}

	.user-avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.user-name {
		font-weight: 500;
		color: var(--color-text);
		max-width: 120px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.chevron {
		color: var(--color-text-secondary);
		transition: transform 0.2s;
	}

	.chevron.rotated {
		transform: rotate(180deg);
	}

	.user-menu {
		position: absolute;
		top: calc(100% + 0.5rem);
		right: 0;
		background: white;
		border: 1px solid var(--color-border);
		border-radius: 8px;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
		min-width: 240px;
		z-index: 100;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
	}

	.user-display-name {
		font-weight: 500;
		color: var(--color-text);
		margin-bottom: 0.25rem;
	}

	.user-email {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
	}

	.user-menu hr {
		margin: 0;
		border: none;
		height: 1px;
		background: var(--color-border);
	}

	.menu-item {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background: transparent;
		border: none;
		cursor: pointer;
		transition: background-color 0.2s;
		color: var(--color-text);
		font-size: 0.875rem;
	}

	.menu-item:hover {
		background: var(--color-bg-1);
	}	/* Navigation styling */
	:global(.main-nav) {
		grid-column: 2;
		justify-self: center;
		display: flex;
		justify-content: center;
		/* Override global styles for desktop */
		position: static !important;
		transform: none !important;
		opacity: 1 !important;
		visibility: visible !important;
		width: auto !important;
		height: auto !important;
		background: transparent !important;
		pointer-events: auto !important;
		color: inherit !important;
		z-index: auto !important;
	}
	/* Restore mobile menu functionality */
	@media (max-width: 768px) {
		:global(.main-nav) {
			position: fixed !important;
			z-index: 2000 !important;
			top: 0 !important;
			left: 0 !important;
			transform: translateX(-100vw) !important;
			visibility: hidden !important;
			width: 100% !important;
			height: 100vh !important;
			pointer-events: none !important;
			opacity: 0 !important;
			display: flex !important;
			justify-content: center !important;
			align-items: center !important;
			background: var(--darker) !important;
			color: var(--paper) !important;
			transition: all 0.25s cubic-bezier(0.785, 0.135, 0.15, 0.86) !important;
		}

		:global(.main-nav.open) {
			transform: translateX(0) !important;
			opacity: 1 !important;
			pointer-events: unset !important;
			visibility: unset !important;
		}

		/* Mobile navigation list styles */
		:global(.main-nav ul) {
			display: flex !important;
			flex-direction: column !important;
			list-style: none !important;
			margin: 0 !important;
			padding: 0 !important;
			gap: 1rem !important;
			align-items: center !important;
			border-top: none !important;
			width: auto !important;
		}

		:global(.main-nav li) {
			margin: 0 !important;
			display: block !important;
			width: 100% !important;
			text-align: center !important;
			font-size: 1.2rem !important;
			margin-bottom: 1rem !important;
		}

		:global(.main-nav a) {
			color: var(--paper) !important;
			text-decoration: none !important;
			font-weight: 500 !important;
			padding: 1rem !important;
			transition: color 0.2s !important;
			white-space: nowrap !important;
			display: block !important;
		}

		:global(.main-nav a:hover) {
			color: var(--lightAccent) !important;
		}

		/* Close button in mobile menu */
		:global(.main-nav .menu-button) {
			position: absolute !important;
			top: 2rem !important;
			right: 2rem !important;
			background: transparent !important;
			border: none !important;
			color: var(--paper) !important;
			width: 2rem !important;
			height: 2rem !important;
			display: block !important;
		}
	}
	:global(.main-nav ul) {
		display: flex !important;
		list-style: none !important;
		margin: 0 !important;
		padding: 0 !important;
		gap: 2rem !important;
		align-items: center !important;
		border-top: none !important;
		width: auto !important;
		flex-direction: row !important;
	}

	:global(.main-nav li) {
		margin: 0 !important;
		display: inline-block !important;
		width: auto !important;
		text-align: left !important;
		font-size: inherit !important;
		margin-bottom: 0 !important;
	}

	/* Hide the hamburger button inside main-nav on desktop */
	:global(.main-nav .hamburger-menu-button) {
		display: none !important;
	}

	:global(.main-nav a) {
		color: var(--color-text);
		text-decoration: none;
		font-weight: 500;
		padding: 0.5rem 0;
		transition: color 0.2s;
		white-space: nowrap;
	}

	:global(.main-nav a:hover) {
		color: var(--color-primary);
	}

	:global(.main-nav a.active) {
		color: var(--color-primary);
		font-weight: 600;
	}	@media (max-width: 768px) {
		.header-bottom {
			display: flex;
			justify-content: space-between;
		}

		.left-section {
			grid-column: unset;
			justify-self: unset;
		}

		.auth-section {
			grid-column: unset;
			justify-self: unset;
		}
		/* Show hamburger menu on mobile */
		:global(.hamburger-menu-button) {
			display: block !important;
		}

		.user-name {
			display: none;
		}

		.auth-buttons {
			gap: 0.25rem;
		}

		.auth-btn {
			padding: 0.375rem 0.75rem;
			font-size: 0.8125rem;
		}

		/* Ensure navigation is hidden on mobile by default */
		:global(.main-nav) {
			display: none !important;
		}

		/* Show navigation when menu is open */
		:global(.main-nav.open) {
			display: flex !important;
		}
	}
</style>