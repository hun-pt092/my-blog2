-- Update comment_votes table to use user_id instead of user_identifier
-- Drop the old constraint and column, add new user_id column

-- First, drop the unique constraint
ALTER TABLE comment_votes DROP CONSTRAINT IF EXISTS comment_votes_comment_id_user_identifier_key;

-- Drop the old index
DROP INDEX IF EXISTS idx_comment_votes_user_id;

-- Add user_id column if it doesn't exist
ALTER TABLE comment_votes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Create new unique constraint with user_id
ALTER TABLE comment_votes ADD CONSTRAINT comment_votes_comment_id_user_id_key UNIQUE (comment_id, user_id);

-- Create new index for user_id
CREATE INDEX IF NOT EXISTS idx_comment_votes_user_id ON comment_votes(user_id);

-- You may need to manually migrate existing data or drop user_identifier column later
-- For now, keeping both columns for compatibility
