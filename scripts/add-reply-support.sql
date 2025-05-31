-- Add reply functionality to comments table
-- This script adds a parent_id column to support comment replies

ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES comments(id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);

-- Add a column to track reply count
ALTER TABLE comments ADD COLUMN IF NOT EXISTS reply_count INTEGER DEFAULT 0;

-- Update existing comments to have reply_count = 0
UPDATE comments SET reply_count = 0 WHERE reply_count IS NULL;
