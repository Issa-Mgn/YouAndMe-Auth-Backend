-- Create Users Table
CREATE TABLE users (
  id TEXT PRIMARY KEY, -- Firebase UID
  email TEXT NOT NULL,
  display_name TEXT,
  unique_code TEXT UNIQUE NOT NULL,
  partner_code TEXT,
  couple_id UUID,
  avatar_url TEXT,
  fcm_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Couples Table
CREATE TABLE couples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id TEXT REFERENCES users(id),
  user2_id TEXT REFERENCES users(id),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  status TEXT DEFAULT 'active', -- 'active', 'broken'
  breakup_requested_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add foreign key constraint to users after couples table is created
ALTER TABLE users ADD CONSTRAINT fk_user_couple FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE SET NULL;

-- Souvenirs Table (Album)
CREATE TABLE souvenirs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id),
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL, -- 'image', 'video'
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Agenda Table
CREATE TABLE agenda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id),
  title TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  category TEXT NOT NULL, -- 'upcoming', 'history'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Playlist Table
CREATE TABLE playlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id),
  song_url TEXT NOT NULL,
  title TEXT NOT NULL,
  artist TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Messages Table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
  sender_id TEXT REFERENCES users(id),
  content TEXT,
  type TEXT DEFAULT 'text', -- 'text', 'audio', 'image', 'video', 'doc'
  media_url TEXT,
  duration INTEGER, -- duration in seconds for audio/video
  reaction TEXT,
  reply_to_id UUID REFERENCES messages(id),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE souvenirs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_users_unique_code ON users(unique_code);
CREATE INDEX idx_users_partner_code ON users(partner_code);
CREATE INDEX idx_users_couple_id ON users(couple_id);
CREATE INDEX idx_souvenirs_couple_id ON souvenirs(couple_id);
CREATE INDEX idx_agenda_couple_id ON agenda(couple_id);
CREATE INDEX idx_playlist_couple_id ON playlist(couple_id);
CREATE INDEX idx_messages_couple_id ON messages(couple_id);
