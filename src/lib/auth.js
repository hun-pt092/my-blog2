// Authentication service
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { pool } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 10;

export class AuthService {
    // Hash password
    static async hashPassword(password) {
        return bcrypt.hash(password, SALT_ROUNDS);
    }

    // Verify password
    static async verifyPassword(password, hash) {
        return bcrypt.compare(password, hash);
    }

    // Generate JWT token
    static generateToken(user) {
        return jwt.sign(
            { 
                userId: user.id, 
                username: user.username, 
                role: user.role 
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
    }

    // Verify JWT token
    static verifyToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (error) {
            return null;
        }
    }

    // Create user session
    static async createSession(userId) {
        const sessionToken = uuidv4();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        const query = `
            INSERT INTO user_sessions (user_id, session_token, expires_at)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        
        const result = await pool.query(query, [userId, sessionToken, expiresAt]);
        return result.rows[0];
    }

    // Get session
    static async getSession(sessionToken) {
        const query = `
            SELECT s.*, u.id as user_id, u.username, u.email, u.display_name, u.role, u.avatar_url
            FROM user_sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.session_token = $1 AND s.expires_at > NOW()
        `;
        
        const result = await pool.query(query, [sessionToken]);
        return result.rows[0] || null;
    }

    // Delete session
    static async deleteSession(sessionToken) {
        const query = 'DELETE FROM user_sessions WHERE session_token = $1';
        await pool.query(query, [sessionToken]);
    }

    // Register user
    static async register(username, email, password, displayName) {
        // Check if user exists
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );

        if (existingUser.rows.length > 0) {
            throw new Error('Username or email already exists');
        }

        // Hash password
        const passwordHash = await this.hashPassword(password);

        // Create user
        const query = `
            INSERT INTO users (username, email, password_hash, display_name)
            VALUES ($1, $2, $3, $4)
            RETURNING id, username, email, display_name, role, created_at
        `;

        const result = await pool.query(query, [username, email, passwordHash, displayName]);
        return result.rows[0];
    }

    // Login user
    static async login(usernameOrEmail, password) {
        // Find user
        const query = `
            SELECT * FROM users 
            WHERE (username = $1 OR email = $1) AND is_active = true
        `;
        
        const result = await pool.query(query, [usernameOrEmail]);
        const user = result.rows[0];

        if (!user) {
            throw new Error('Invalid credentials');
        }

        // Verify password
        const isValid = await this.verifyPassword(password, user.password_hash);
        if (!isValid) {
            throw new Error('Invalid credentials');
        }

        // Remove password hash from response
        const { password_hash, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    // Get user by ID
    static async getUserById(userId) {
        const query = `
            SELECT id, username, email, display_name, role, avatar_url, created_at
            FROM users 
            WHERE id = $1 AND is_active = true
        `;
        
        const result = await pool.query(query, [userId]);
        return result.rows[0] || null;
    }

    // Middleware to check authentication
    static async requireAuth(request) {
        const authHeader = request.headers.get('authorization');
        const cookieHeader = request.headers.get('cookie');
        
        let token = null;

        // Try to get token from Authorization header
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
        // Try to get token from cookie
        else if (cookieHeader) {
            const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
                const [key, value] = cookie.trim().split('=');
                acc[key] = value;
                return acc;
            }, {});
            token = cookies.auth_token;
        }

        if (!token) {
            throw new Error('No authentication token provided');
        }

        // Verify token
        const payload = this.verifyToken(token);
        if (!payload) {
            throw new Error('Invalid authentication token');
        }

        // Get user details
        const user = await this.getUserById(payload.userId);
        if (!user) {
            throw new Error('User not found');
        }

        return user;
    }

    // Optional auth - returns user if authenticated, null if not
    static async optionalAuth(request) {
        try {
            return await this.requireAuth(request);
        } catch {
            return null;
        }
    }
}
