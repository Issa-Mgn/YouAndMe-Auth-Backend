-- Migration pour les nouvelles features

-- Table pour la Roue de Décision
CREATE TABLE IF NOT EXISTS decision_wheel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL,
    category TEXT NOT NULL, -- 'food', 'movie', 'activity', 'chores', 'custom'
    options TEXT NOT NULL, -- JSON array des options
    result TEXT,
    decided_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE
);

-- Table pour Pensées Éphémères
CREATE TABLE IF NOT EXISTS ephemeral_thoughts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL,
    sender_id TEXT NOT NULL, -- Firebase UID (TEXT)
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE
);

-- Table pour Mini-Vlogs
CREATE TABLE IF NOT EXISTS vlogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL,
    title TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration INTEGER, -- en secondes
    unlock_date TIMESTAMP, -- NULL si pas time capsule
    created_by TEXT NOT NULL, -- Firebase UID (TEXT)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE
);

-- Table pour Prédictions Amoureuses
CREATE TABLE IF NOT EXISTS love_fortunes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL,
    fortune_type TEXT NOT NULL, -- 'daily', 'tarot', 'prediction'
    content TEXT NOT NULL,
    date DATE NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE,
    UNIQUE(couple_id, date, fortune_type)
);

-- Table pour Canvas Partagé
CREATE TABLE IF NOT EXISTS canvas_drawings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL,
    drawing_data TEXT NOT NULL, -- JSON des paths/strokes
    created_by TEXT, -- Firebase UID (TEXT)
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE
);

-- Table pour Quick Fire Questions
CREATE TABLE IF NOT EXISTS quick_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL,
    question TEXT NOT NULL,
    user1_answer TEXT,
    user2_answer TEXT,
    is_custom BOOLEAN DEFAULT FALSE,
    date DATE NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE
);

-- Table pour Bataille de Playlist
CREATE TABLE IF NOT EXISTS playlist_battle (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL,
    song_title TEXT NOT NULL,
    artist TEXT,
    song_url TEXT,
    added_by TEXT NOT NULL, -- Firebase UID (TEXT)
    partner_vote TEXT, -- 'like', 'dislike', NULL
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE
);

-- Table pour Boîte à Secrets
CREATE TABLE IF NOT EXISTS secret_box (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- Encrypted
    type TEXT NOT NULL, -- 'password', 'note', 'photo', 'important'
    created_by TEXT NOT NULL, -- Firebase UID (TEXT)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE
);

-- Table pour Messages Anonymes
CREATE TABLE IF NOT EXISTS anonymous_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL,
    content TEXT NOT NULL,
    reveal_at TIMESTAMP,
    is_revealed BOOLEAN DEFAULT FALSE,
    sender_id TEXT NOT NULL, -- Firebase UID (TEXT) Hidden until reveal
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE
);

-- Table pour Coupons Surprise
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    created_by TEXT NOT NULL, -- Firebase UID (TEXT)
    given_to TEXT NOT NULL, -- Firebase UID (TEXT)
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE
);

-- Table pour Puzzle Photos
CREATE TABLE IF NOT EXISTS photo_puzzles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID NOT NULL,
    photo_url TEXT NOT NULL,
    difficulty INTEGER DEFAULT 9, -- 9, 16, 25 pièces
    progress TEXT, -- JSON des pièces placées
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_decision_wheel_couple ON decision_wheel(couple_id);
CREATE INDEX IF NOT EXISTS idx_ephemeral_couple ON ephemeral_thoughts(couple_id);
CREATE INDEX IF NOT EXISTS idx_vlogs_couple ON vlogs(couple_id);
CREATE INDEX IF NOT EXISTS idx_fortunes_couple_date ON love_fortunes(couple_id, date);
CREATE INDEX IF NOT EXISTS idx_questions_couple_date ON quick_questions(couple_id, date);
CREATE INDEX IF NOT EXISTS idx_playlist_battle_couple ON playlist_battle(couple_id);
CREATE INDEX IF NOT EXISTS idx_coupons_couple ON coupons(couple_id);
CREATE INDEX IF NOT EXISTS idx_puzzles_couple ON photo_puzzles(couple_id);
