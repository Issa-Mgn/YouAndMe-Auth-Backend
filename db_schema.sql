-- Create Users Table
CREATE TABLE users (
  id TEXT PRIMARY KEY, -- Firebase UID
  email TEXT NOT NULL,
  display_name TEXT,
  unique_code TEXT UNIQUE NOT NULL,
  partner_code TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Note: Since we are using a Node.js Backend with the Service Key (Admin), 
-- we don't strictly need RLS policies for the backend to work. 
-- The Service Key acts as an admin and bypasses RLS.
-- We avoid using auth.uid() here because that is for Supabase Auth, not Firebase.

-- Indexes
CREATE INDEX idx_users_unique_code ON users(unique_code);
CREATE INDEX idx_users_partner_code ON users(partner_code);
