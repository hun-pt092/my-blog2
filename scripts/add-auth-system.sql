-- Add authentication system
-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Create sessions table for auth
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Update comments table to reference users
ALTER TABLE comments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES comments(id);
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_reply BOOLEAN DEFAULT false;

-- Update comment_votes to reference users
ALTER TABLE comment_votes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password_hash, display_name, role) 
VALUES (
    'admin', 
    'admin@example.com', 
    '$2b$10$K7gV1QxrRzE.wKzMx8yIl.Y9oWx.V4lGcz.tH8kXm6WoqNrGzT7eO', -- admin123
    'Administrator',
    'admin'
) ON CONFLICT (username) DO NOTHING;

-- Insert sample users
INSERT INTO users (username, email, password_hash, display_name, role) 
VALUES 
    ('user1', 'user1@example.com', '$2b$10$K7gV1QxrRzE.wKzMx8yIl.Y9oWx.V4lGcz.tH8kXm6WoqNrGzT7eO', 'User One', 'user'),
    ('user2', 'user2@example.com', '$2b$10$K7gV1QxrRzE.wKzMx8yIl.Y9oWx.V4lGcz.tH8kXm6WoqNrGzT7eO', 'User Two', 'user')
ON CONFLICT (username) DO NOTHING;
