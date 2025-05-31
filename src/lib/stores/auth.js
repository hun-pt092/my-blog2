// User authentication store
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Create user store
export const user = writable(null);
export const isAuthenticated = writable(false);
export const isLoading = writable(true);

// Authentication service
class AuthService {
    static async getCurrentUser() {
        try {
            const response = await fetch('/api/auth/me', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.user;
            }
            return null;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    }    static async login(usernameOrEmail, password) {
        try {
            console.log('Attempting login with:', { usernameOrEmail, password: '***' });
            
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ usernameOrEmail, password })
            });

            console.log('Login response status:', response.status);
            const data = await response.json();
            console.log('Login response data:', data);
            
            if (response.ok) {
                user.set(data.user);
                isAuthenticated.set(true);
                return { success: true, user: data.user };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Network error' };
        }
    }    static async register(username, email, password, displayName) {
        try {
            console.log('Attempting register with:', { username, email, password: '***', displayName });
            
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ username, email, password, displayName })
            });

            console.log('Register response status:', response.status);
            const data = await response.json();
            console.log('Register response data:', data);
            
            if (response.ok) {
                user.set(data.user);
                isAuthenticated.set(true);
                return { success: true, user: data.user };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            console.error('Register error:', error);
            return { success: false, error: 'Network error' };
        }
    }

    static async logout() {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
        
        user.set(null);
        isAuthenticated.set(false);
    }

    static async initialize() {
        if (!browser) return;
        
        isLoading.set(true);
        const currentUser = await this.getCurrentUser();
        
        if (currentUser) {
            user.set(currentUser);
            isAuthenticated.set(true);
        } else {
            user.set(null);
            isAuthenticated.set(false);
        }
        
        isLoading.set(false);
    }
}

// Initialize auth on load
if (browser) {
    AuthService.initialize();
}

export { AuthService };
