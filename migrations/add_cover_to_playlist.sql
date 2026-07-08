-- Migration: Add cover column to playlist table
-- Date: 2026-07-08

ALTER TABLE playlist ADD COLUMN IF NOT EXISTS cover TEXT;

-- Add comment for documentation
COMMENT ON COLUMN playlist.cover IS 'URL of the album cover image for the song';
