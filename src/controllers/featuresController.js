const db = require('../config/database');
const admin = require('../config/firebase-admin');

// ==================== DECISION WHEEL ====================

const createDecision = async (req, res) => {
    try {
        const { category, options } = req.body;
        const userId = req.user.userId;
        
        const user = db.prepare('SELECT couple_id FROM users WHERE id = ?').get(userId);
        if (!user?.couple_id) {
            return res.status(400).json({ error: 'Pas de couple lié' });
        }

        const result = db.prepare(`
            INSERT INTO decision_wheel (couple_id, category, options)
            VALUES (?, ?, ?)
            RETURNING *
        `).get(user.couple_id, category, JSON.stringify(options));

        res.json({ id: result.id, category, options });
    } catch (error) {
        console.error('Create decision error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const getDecisions = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const user = db.prepare('SELECT couple_id FROM users WHERE id = ?').get(userId);
        if (!user?.couple_id) {
            return res.status(400).json({ error: 'Pas de couple lié' });
        }

        const decisions = db.prepare(`
            SELECT * FROM decision_wheel 
            WHERE couple_id = ? 
            ORDER BY created_at DESC 
            LIMIT 50
        `).all(user.couple_id);

        const parsed = decisions.map(d => ({
            ...d,
            options: JSON.parse(d.options)
        }));

        res.json(parsed);
    } catch (error) {
        console.error('Get decisions error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const spinWheel = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        
        const decision = db.prepare('SELECT * FROM decision_wheel WHERE id = ?').get(id);
        if (!decision) {
            return res.status(404).json({ error: 'Décision non trouvée' });
        }

        const options = JSON.parse(decision.options);
        const result = options[Math.floor(Math.random() * options.length)];

        db.prepare(`
            UPDATE decision_wheel 
            SET result = ?, decided_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `).run(result, id);

        res.json({ result, options });
    } catch (error) {
        console.error('Spin wheel error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// ==================== EPHEMERAL THOUGHTS ====================

const sendThought = async (req, res) => {
    try {
        const { content, expiresInHours = 24 } = req.body;
        const userId = req.user.userId;
        
        const user = db.prepare('SELECT couple_id FROM users WHERE id = ?').get(userId);
        if (!user?.couple_id) {
            return res.status(400).json({ error: 'Pas de couple lié' });
        }

        const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();
        
        const result = db.prepare(`
            INSERT INTO ephemeral_thoughts (couple_id, sender_id, content, expires_at)
            VALUES (?, ?, ?, ?)
            RETURNING *
        `).get(user.couple_id, userId, content, expiresAt);

        res.json({ id: result.id, content, expiresAt });
    } catch (error) {
        console.error('Send thought error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const getThoughts = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const user = db.prepare('SELECT couple_id, id FROM users WHERE id = ?').get(userId);
        if (!user?.couple_id) {
            return res.status(400).json({ error: 'Pas de couple lié' });
        }

        // Delete expired thoughts
        db.prepare(`
            DELETE FROM ephemeral_thoughts 
            WHERE expires_at < CURRENT_TIMESTAMP
        `).run();

        // Get thoughts sent to this user (not by them)
        const thoughts = db.prepare(`
            SELECT * FROM ephemeral_thoughts 
            WHERE couple_id = ? AND sender_id != ? AND is_read = FALSE
            ORDER BY created_at DESC
        `).all(user.couple_id, userId);

        res.json(thoughts);
    } catch (error) {
        console.error('Get thoughts error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const markThoughtRead = async (req, res) => {
    try {
        const { id } = req.params;
        
        db.prepare(`
            UPDATE ephemeral_thoughts 
            SET is_read = TRUE, read_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `).run(id);

        // Delete after read
        setTimeout(() => {
            db.prepare('DELETE FROM ephemeral_thoughts WHERE id = ?').run(id);
        }, 3000); // 3 seconds to show animation

        res.json({ success: true });
    } catch (error) {
        console.error('Mark thought read error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// ==================== VLOGS ====================

const uploadVlog = async (req, res) => {
    try {
        const { title, unlockDate } = req.body;
        const userId = req.user.userId;
        const file = req.file;
        
        if (!file) {
            return res.status(400).json({ error: 'Aucune vidéo fournie' });
        }

        const user = db.prepare('SELECT couple_id FROM users WHERE id = ?').get(userId);
        if (!user?.couple_id) {
            return res.status(400).json({ error: 'Pas de couple lié' });
        }

        const id = uuidv4();
        const fileName = `vlogs/${user.couple_id}/${id}.mp4`;
        const bucket = admin.storage().bucket();
        const fileUpload = bucket.file(fileName);

        await fileUpload.save(file.buffer, {
            metadata: { contentType: file.mimetype },
            public: false
        });

        const [url] = await fileUpload.getSignedUrl({
            action: 'read',
            expires: '03-01-2500'
        });

        db.prepare(`
            INSERT INTO vlogs (id, couple_id, title, video_url, unlock_date, created_by)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(id, user.couple_id, title, url, unlockDate || null, userId);

        res.json({ id, title, video_url: url, unlock_date: unlockDate });
    } catch (error) {
        console.error('Upload vlog error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const getVlogs = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const user = db.prepare('SELECT couple_id FROM users WHERE id = ?').get(userId);
        if (!user?.couple_id) {
            return res.status(400).json({ error: 'Pas de couple lié' });
        }

        const vlogs = db.prepare(`
            SELECT * FROM vlogs 
            WHERE couple_id = ? 
            ORDER BY created_at DESC
        `).all(user.couple_id);

        res.json(vlogs);
    } catch (error) {
        console.error('Get vlogs error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const unlockVlog = async (req, res) => {
    try {
        const { id } = req.params;
        
        const vlog = db.prepare('SELECT * FROM vlogs WHERE id = ?').get(id);
        if (!vlog) {
            return res.status(404).json({ error: 'Vlog non trouvé' });
        }

        if (vlog.unlock_date && new Date(vlog.unlock_date) > new Date()) {
            return res.status(403).json({ 
                error: 'Pas encore débloqué',
                unlock_date: vlog.unlock_date 
            });
        }

        res.json(vlog);
    } catch (error) {
        console.error('Unlock vlog error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// ==================== FORTUNE ====================

const FORTUNES = [
    "Aujourd'hui, un geste simple fera fondre votre partenaire 💕",
    "Une surprise vous attend ce soir... Soyez attentif(ve) 🎁",
    "Votre prochain date sera mémorable 🌟",
    "Un compliment inattendu illuminera votre journée ✨",
    "L'amour se cache dans les petits détails aujourd'hui 🌸",
    "Préparez-vous à rire ensemble comme jamais 😂",
    "Un message tendre arrive bientôt 💌",
    "Aujourd'hui est parfait pour dire 'Je t'aime' 💖",
    "Votre connexion sera plus forte que jamais 🔗",
    "Une aventure spontanée vous rapprochera 🚀"
];

const TAROT_CARDS = [
    { name: "Les Amoureux", meaning: "Harmonie parfaite - Vos cœurs battent à l'unisson", emoji: "💑" },
    { name: "Le Soleil", meaning: "Joie et bonheur - Une journée radieuse vous attend", emoji: "☀️" },
    { name: "L'Étoile", meaning: "Espoir - Vos rêves de couple se réaliseront", emoji: "⭐" },
    { name: "La Lune", meaning: "Mystère - Laissez-vous surprendre par l'inattendu", emoji: "🌙" },
    { name: "Le Monde", meaning: "Accomplissement - Votre amour atteint de nouveaux sommets", emoji: "🌍" },
    { name: "La Force", meaning: "Passion - Votre lien est indestructible", emoji: "💪" },
    { name: "La Roue", meaning: "Changement positif - De belles surprises arrivent", emoji: "🎡" },
    { name: "Le Chariot", meaning: "Avancez ensemble - Rien ne peut vous arrêter", emoji: "🏎️" }
];

const getDailyFortune = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = db.prepare('SELECT couple_id FROM users WHERE id = ?').get(userId);
        
        if (!user?.couple_id) {
            return res.status(400).json({ error: 'Pas de couple lié' });
        }

        const today = new Date().toISOString().split('T')[0];
        
        let fortune = db.prepare(`
            SELECT * FROM love_fortunes 
            WHERE couple_id = ? AND date = ? AND fortune_type = 'daily'
        `).get(user.couple_id, today);

        if (!fortune) {
            const id = uuidv4();
            const content = FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
            
            db.prepare(`
                INSERT INTO love_fortunes (id, couple_id, fortune_type, content, date)
                VALUES (?, ?, 'daily', ?, ?)
            `).run(id, user.couple_id, content, today);

            fortune = { id, content, date: today };
        }

        res.json(fortune);
    } catch (error) {
        console.error('Get fortune error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const getTarotCard = async (req, res) => {
    try {
        const card = TAROT_CARDS[Math.floor(Math.random() * TAROT_CARDS.length)];
        res.json(card);
    } catch (error) {
        console.error('Get tarot error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// ==================== CANVAS ====================

const saveDrawing = async (req, res) => {
    try {
        const { drawingData } = req.body;
        const userId = req.user.userId;
        
        const user = db.prepare('SELECT couple_id FROM users WHERE id = ?').get(userId);
        if (!user?.couple_id) {
            return res.status(400).json({ error: 'Pas de couple lié' });
        }

        const id = uuidv4();
        db.prepare(`
            INSERT INTO canvas_drawings (id, couple_id, drawing_data, created_by)
            VALUES (?, ?, ?, ?)
        `).run(id, user.couple_id, JSON.stringify(drawingData), userId);

        res.json({ id });
    } catch (error) {
        console.error('Save drawing error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const getDrawings = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const user = db.prepare('SELECT couple_id FROM users WHERE id = ?').get(userId);
        if (!user?.couple_id) {
            return res.status(400).json({ error: 'Pas de couple lié' });
        }

        const drawings = db.prepare(`
            SELECT * FROM canvas_drawings 
            WHERE couple_id = ? 
            ORDER BY saved_at DESC 
            LIMIT 20
        `).all(user.couple_id);

        const parsed = drawings.map(d => ({
            ...d,
            drawing_data: JSON.parse(d.drawing_data)
        }));

        res.json(parsed);
    } catch (error) {
        console.error('Get drawings error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Export all functions
module.exports = {
    createDecision,
    getDecisions,
    spinWheel,
    sendThought,
    getThoughts,
    markThoughtRead,
    uploadVlog,
    getVlogs,
    unlockVlog,
    getDailyFortune,
    getTarotCard,
    saveDrawing,
    getDrawings,
    // À continuer dans la partie 2...
};

// ==================== QUICK QUESTIONS ====================

const QUESTIONS_POOL = [
    "Quelle est ma couleur préférée ?",
    "Quel est mon plat favori ?",
    "Quelle est ma série préférée ?",
    "Quel est mon plus grand rêve ?",
    "Quelle est ma plus grande peur ?",
    "Quel est mon animal préféré ?",
    "Quelle est ma saison préférée ?",
    "Quel est mon hobby favori ?",
    "Quel est mon film préféré ?",
    "Quelle est ma chanson préférée ?",
    "Quel est mon dessert favori ?",
    "Quelle est ma destination de rêve ?",
    "Quel est mon sport préféré ?",
    "Quelle est mon acteur/actrice préféré(e) ?",
    "Quel est mon parfum de glace favori ?"
];

const getDailyQuestions = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = db.prepare('SELECT couple_id FROM users WHERE id = ?').get(userId);
        
        if (!user?.couple_id) {
            return res.status(400).json({ error: 'Pas de couple lié' });
        }

        const today = new Date().toISOString().split('T')[0];
        
        let questions = db.prepare(`
            SELECT * FROM quick_questions 
            WHERE couple_id = ? AND date = ?
        `).all(user.couple_id, today);

        if (questions.length === 0) {
            // Generate 5 random questions for today
            const shuffled = [...QUESTIONS_POOL].sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, 5);
            
            for (const question of selected) {
                const id = uuidv4();
                db.prepare(`
                    INSERT INTO quick_questions (id, couple_id, question, date)
                    VALUES (?, ?, ?, ?)
                `).run(id, user.couple_id, question, today);
            }
            
            questions = db.prepare(`
                SELECT * FROM quick_questions 
                WHERE couple_id = ? AND date = ?
            `).all(user.couple_id, today);
        }

        res.json(questions);
    } catch (error) {
        console.error('Get questions error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const submitAnswer = async (req, res) => {
    try {
        const { id } = req.params;
        const { answer } = req.body;
        const userId = req.user.userId;
        
        const question = db.prepare('SELECT * FROM quick_questions WHERE id = ?').get(id);
        if (!question) {
            return res.status(404).json({ error: 'Question non trouvée' });
        }

        // Determine which user is answering
        const users = db.prepare(`
            SELECT id FROM users WHERE couple_id = ?
        `).all(question.couple_id);
        
        const isUser1 = users[0].id === userId;
        const column = isUser1 ? 'user1_answer' : 'user2_answer';
        
        db.prepare(`
            UPDATE quick_questions 
            SET ${column} = ?
            WHERE id = ?
        `).run(answer, id);

        // Check if both answered
        const updated = db.prepare('SELECT * FROM quick_questions WHERE id = ?').get(id);
        if (updated.user1_answer && updated.user2_answer) {
            db.prepare('UPDATE quick_questions SET completed = TRUE WHERE id = ?').run(id);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Submit answer error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const getQuestionResults = async (req, res) => {
    try {
        const { id } = req.params;
        
        const question = db.prepare('SELECT * FROM quick_questions WHERE id = ?').get(id);
        if (!question) {
            return res.status(404).json({ error: 'Question non trouvée' });
        }

        const match = question.user1_answer === question.user2_answer;
        
        res.json({
            question: question.question,
            user1_answer: question.user1_answer,
            user2_answer: question.user2_answer,
            match,
            completed: question.completed
        });
    } catch (error) {
        console.error('Get results error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// ==================== PLAYLIST BATTLE ====================

const addBattleSong = async (req, res) => {
    try {
        const { songTitle, artist, songUrl } = req.body;
        const userId = req.user.userId;
        
        const user = db.prepare('SELECT couple_id FROM users WHERE id = ?').get(userId);
        if (!user?.couple_id) {
            return res.status(400).json({ error: 'Pas de couple lié' });
        }

        const today = new Date().toISOString().split('T')[0];
        const id = uuidv4();
        
        db.prepare(`
            INSERT INTO playlist_battle (id, couple_id, song_title, artist, song_url, added_by, date)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(id, user.couple_id, songTitle, artist, songUrl, userId, today);

        res.json({ id, songTitle, artist });
    } catch (error) {
        console.error('Add battle song error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const getBattleSongs = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const user = db.prepare('SELECT couple_id FROM users WHERE id = ?').get(userId);
        if (!user?.couple_id) {
            return res.status(400).json({ error: 'Pas de couple lié' });
        }

        const songs = db.prepare(`
            SELECT * FROM playlist_battle 
            WHERE couple_id = ? 
            ORDER BY created_at DESC 
            LIMIT 50
        `).all(user.couple_id);

        res.json(songs);
    } catch (error) {
        console.error('Get battle songs error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const voteSong = async (req, res) => {
    try {
        const { id } = req.params;
        const { vote } = req.body; // 'like' or 'dislike'
        
        db.prepare(`
            UPDATE playlist_battle 
            SET partner_vote = ? 
            WHERE id = ?
        `).run(vote, id);

        res.json({ success: true });
    } catch (error) {
        console.error('Vote song error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// ==================== SECRET BOX ====================

const addSecret = async (req, res) => {
    try {
        const { title, content, type } = req.body;
        const userId = req.user.userId;
        
        const user = db.prepare('SELECT couple_id FROM users WHERE id = ?').get(userId);
        if (!user?.couple_id) {
            return res.status(400).json({ error: 'Pas de couple lié' });
        }

        const id = uuidv4();
        db.prepare(`
            INSERT INTO secret_box (id, couple_id, title, content, type, created_by)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(id, user.couple_id, title, content, type, userId);

        res.json({ id, title, type });
    } catch (error) {
        console.error('Add secret error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const getSecrets = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const user = db.prepare('SELECT couple_id FROM users WHERE id = ?').get(userId);
        if (!user?.couple_id) {
            return res.status(400).json({ error: 'Pas de couple lié' });
        }

        const secrets = db.prepare(`
            SELECT * FROM secret_box 
            WHERE couple_id = ? 
            ORDER BY created_at DESC
        `).all(user.couple_id);

        res.json(secrets);
    } catch (error) {
        console.error('Get secrets error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const deleteSecret = async (req, res) => {
    try {
        const { id } = req.params;
        
        db.prepare('DELETE FROM secret_box WHERE id = ?').run(id);

        res.json({ success: true });
    } catch (error) {
        console.error('Delete secret error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// ==================== ANONYMOUS MESSAGES ====================

const sendAnonymous = async (req, res) => {
    try {
        const { content, revealInHours = 24 } = req.body;
        const userId = req.user.userId;
        
        const user = db.prepare('SELECT couple_id FROM users WHERE id = ?').get(userId);
        if (!user?.couple_id) {
            return res.status(400).json({ error: 'Pas de couple lié' });
        }

        const id = uuidv4();
        const revealAt = new Date(Date.now() + revealInHours * 60 * 60 * 1000).toISOString();
        
        db.prepare(`
            INSERT INTO anonymous_messages (id, couple_id, content, reveal_at, sender_id)
            VALUES (?, ?, ?, ?, ?)
        `).run(id, user.couple_id, content, revealAt, userId);

        res.json({ id, content, reveal_at: revealAt });
    } catch (error) {
        console.error('Send anonymous error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const getAnonymousMessages = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const user = db.prepare('SELECT couple_id FROM users WHERE id = ?').get(userId);
        if (!user?.couple_id) {
            return res.status(400).json({ error: 'Pas de couple lié' });
        }

        const messages = db.prepare(`
            SELECT id, couple_id, content, reveal_at, is_revealed, 
                   CASE WHEN is_revealed THEN sender_id ELSE NULL END as sender_id,
                   created_at
            FROM anonymous_messages 
            WHERE couple_id = ? AND sender_id != ?
            ORDER BY created_at DESC
        `).all(user.couple_id, userId);

        res.json(messages);
    } catch (error) {
        console.error('Get anonymous error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const revealMessage = async (req, res) => {
    try {
        const { id } = req.params;
        
        db.prepare(`
            UPDATE anonymous_messages 
            SET is_revealed = TRUE 
            WHERE id = ?
        `).run(id);

        const message = db.prepare('SELECT * FROM anonymous_messages WHERE id = ?').get(id);

        res.json(message);
    } catch (error) {
        console.error('Reveal message error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// ==================== COUPONS ====================

const createCoupon = async (req, res) => {
    try {
        const { title, description, givenTo, expiresInDays } = req.body;
        const userId = req.user.userId;
        
        const user = db.prepare('SELECT couple_id FROM users WHERE id = ?').get(userId);
        if (!user?.couple_id) {
            return res.status(400).json({ error: 'Pas de couple lié' });
        }

        const id = uuidv4();
        const expiresAt = expiresInDays 
            ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
            : null;
        
        db.prepare(`
            INSERT INTO coupons (id, couple_id, title, description, created_by, given_to, expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(id, user.couple_id, title, description, userId, givenTo, expiresAt);

        res.json({ id, title, description, expires_at: expiresAt });
    } catch (error) {
        console.error('Create coupon error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const getCoupons = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const user = db.prepare('SELECT couple_id FROM users WHERE id = ?').get(userId);
        if (!user?.couple_id) {
            return res.status(400).json({ error: 'Pas de couple lié' });
        }

        const coupons = db.prepare(`
            SELECT * FROM coupons 
            WHERE couple_id = ? 
            ORDER BY created_at DESC
        `).all(user.couple_id);

        res.json(coupons);
    } catch (error) {
        console.error('Get coupons error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const useCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        
        const coupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(id);
        if (!coupon) {
            return res.status(404).json({ error: 'Coupon non trouvé' });
        }

        if (coupon.is_used) {
            return res.status(400).json({ error: 'Coupon déjà utilisé' });
        }

        if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
            return res.status(400).json({ error: 'Coupon expiré' });
        }

        db.prepare(`
            UPDATE coupons 
            SET is_used = TRUE, used_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `).run(id);

        res.json({ success: true });
    } catch (error) {
        console.error('Use coupon error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// ==================== PUZZLES ====================

const createPuzzle = async (req, res) => {
    try {
        const { photoUrl, difficulty = 9 } = req.body;
        const userId = req.user.userId;
        
        const user = db.prepare('SELECT couple_id FROM users WHERE id = ?').get(userId);
        if (!user?.couple_id) {
            return res.status(400).json({ error: 'Pas de couple lié' });
        }

        const id = uuidv4();
        const progress = JSON.stringify({});
        
        db.prepare(`
            INSERT INTO photo_puzzles (id, couple_id, photo_url, difficulty, progress)
            VALUES (?, ?, ?, ?, ?)
        `).run(id, user.couple_id, photoUrl, difficulty, progress);

        res.json({ id, photoUrl, difficulty });
    } catch (error) {
        console.error('Create puzzle error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const getPuzzles = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const user = db.prepare('SELECT couple_id FROM users WHERE id = ?').get(userId);
        if (!user?.couple_id) {
            return res.status(400).json({ error: 'Pas de couple lié' });
        }

        const puzzles = db.prepare(`
            SELECT * FROM photo_puzzles 
            WHERE couple_id = ? 
            ORDER BY created_at DESC 
            LIMIT 20
        `).all(user.couple_id);

        const parsed = puzzles.map(p => ({
            ...p,
            progress: JSON.parse(p.progress)
        }));

        res.json(parsed);
    } catch (error) {
        console.error('Get puzzles error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const updatePuzzleProgress = async (req, res) => {
    try {
        const { id } = req.params;
        const { progress, isCompleted } = req.body;
        
        if (isCompleted) {
            db.prepare(`
                UPDATE photo_puzzles 
                SET progress = ?, is_completed = TRUE, completed_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            `).run(JSON.stringify(progress), id);
        } else {
            db.prepare(`
                UPDATE photo_puzzles 
                SET progress = ? 
                WHERE id = ?
            `).run(JSON.stringify(progress), id);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Update puzzle error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Export all remaining functions
module.exports = {
    ...module.exports,
    getDailyQuestions,
    submitAnswer,
    getQuestionResults,
    addBattleSong,
    getBattleSongs,
    voteSong,
    addSecret,
    getSecrets,
    deleteSecret,
    sendAnonymous,
    getAnonymousMessages,
    revealMessage,
    createCoupon,
    getCoupons,
    useCoupon,
    createPuzzle,
    getPuzzles,
    updatePuzzleProgress,
};
