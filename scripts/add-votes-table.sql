USE blog;

-- Add likes and dislikes columns to comments table
ALTER TABLE comments ADD COLUMN IF NOT EXISTS likes INT DEFAULT 0;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS dislikes INT DEFAULT 0;

-- Create comment_votes table to track who voted on what
CREATE TABLE IF NOT EXISTS comment_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_identifier TEXT NOT NULL,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('like', 'dislike')),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE(comment_id, user_identifier)
);

-- Create index for faster vote lookups
CREATE INDEX IF NOT EXISTS idx_comment_votes_comment_id ON comment_votes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_votes_user_id ON comment_votes(user_identifier);
