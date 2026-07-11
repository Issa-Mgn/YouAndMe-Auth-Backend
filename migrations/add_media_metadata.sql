-- Migration: Add media metadata fields to messages table
-- This allows the frontend to display file size and type BEFORE downloading

ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS file_size BIGINT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS mime_type TEXT DEFAULT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(type);

-- Comment to explain the fields
COMMENT ON COLUMN messages.file_size IS 'File size in bytes (for media messages)';
COMMENT ON COLUMN messages.mime_type IS 'MIME type of the media file (e.g., image/jpeg, video/mp4)';
