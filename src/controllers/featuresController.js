const { supabase } = require('../config/supabase');
const admin = require('../config/firebase-admin');

// Helper pour obtenir le couple_id
const getCoupleId = async (userId) => {
    const { data: user } = await supabase
        .from('users')
        .select('couple_id')
        .eq('id', userId)
        .single();
    return user?.couple_id;
};

// ==================== DECISION WHEEL ====================

const createDecision = async (req, res) => {
    try {
        const { category, options } = req.body;
        const userId = req.user.uid || req.user.userId;
        
        const coupleId = await getCoupleId(userId);
        if (!coupleId) {
            return res.status(400).json({ error: 'Pas de couple lié' });
        }

        const { data, error } = await supabase
            .from('decision_wheel')
            .insert({
                couple_id: coupleId,
                category,
                options: JSON.stringify(options)
            })
            .select()
            .single();

        if (error) throw error;

        res.json({ ...data, options: JSON.parse(data.options) });
    } catch (error) {
        console.error('Create decision error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const getDecisions = async (req, res) => {
    try {
        const userId = req.user.uid || req.user.userId;
        
        const coupleId = await getCoupleId(userId);
        if (!coupleId) {
            return res.status(400).json({ error: 'Pas de couple lié' });
        }

        const { data, error } = await supabase
            .from('decision_wheel')
            .select('*')
            .eq('couple_id', coupleId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        const parsed = (data || []).map(d => ({
            ...d,
            options: JSON.parse(d.options)
        }));

        res.json(parsed);
    } catch (error) {
        console.error('Get decisions error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const spinDecisionWheel = async (req, res) => {
    try {
        const { id } = req.params;

        const { data: decision } = await supabase
            .from('decision_wheel')
            .select('options')
            .eq('id', id)
            .single();

        if (!decision) {
            return res.status(404).json({ error: 'Décision non trouvée' });
        }

        const options = JSON.parse(decision.options);
        const randomIndex = Math.floor(Math.random() * options.length);
        const result = options[randomIndex];

        const { data, error } = await supabase
            .from('decision_wheel')
            .update({
                result,
                decided_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({ result });
    } catch (error) {
        console.error('Spin wheel error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// ==================== EPHEMERAL THOUGHTS ====================

const sendThought = async (req, res) => {
    try {
        const { content, expiresInHours = 24 } = req.body;
        const userId = req.user.uid || req.user.userId;
        
        const coupleId = await getCoupleId(userId);
        if (!coupleId) {
            return res.status(400).json({ error: 'Pas de couple lié' });
        }

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + expiresInHours);

        const { data, error } = await supabase
            .from('ephemeral_thoughts')
            .insert({
                couple_id: coupleId,
                sender_id: userId,
                content,
                expires_at: expiresAt.toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Send thought error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const getThoughts = async (req, res) => {
    try {
        const userId = req.user.uid || req.user.userId;
        
        const coupleId = await getCoupleId(userId);
        if (!coupleId) {
            return res.status(400).json({ error: 'Pas de couple lié' });
        }

        const { data, error } = await supabase
            .from('ephemeral_thoughts')
            .select('*')
            .eq('couple_id', coupleId)
            .gte('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json(data || []);
    } catch (error) {
        console.error('Get thoughts error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const markThoughtRead = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('ephemeral_thoughts')
            .update({
                is_read: true,
                read_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Mark thought read error:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// ==================== EXPORTS ====================

module.exports = {
    // Decision Wheel
    createDecision,
    getDecisions,
    spinDecisionWheel,
    
    // Ephemeral Thoughts
    sendThought,
    getThoughts,
    markThoughtRead,
    
    // Placeholders for other features (implement as needed)
    uploadVlog: async (req, res) => res.status(501).json({ error: 'Non implémenté' }),
    getVlogs: async (req, res) => res.json([]),
    unlockVlog: async (req, res) => res.status(501).json({ error: 'Non implémenté' }),
    
    getDailyFortune: async (req, res) => res.json({ fortune: 'Votre amour grandira aujourd\'hui ❤️' }),
    getTarotCard: async (req, res) => res.json({ card: 'Les Amoureux', meaning: 'Union et harmonie' }),
    
    saveDrawing: async (req, res) => res.status(501).json({ error: 'Non implémenté' }),
    getDrawings: async (req, res) => res.json([]),
    
    getDailyQuestions: async (req, res) => res.json([]),
    submitAnswer: async (req, res) => res.status(501).json({ error: 'Non implémenté' }),
    getQuestionResults: async (req, res) => res.json({}),
    
    addBattleSong: async (req, res) => res.status(501).json({ error: 'Non implémenté' }),
    getBattleSongs: async (req, res) => res.json([]),
    voteSong: async (req, res) => res.status(501).json({ error: 'Non implémenté' }),
    
    addSecret: async (req, res) => res.status(501).json({ error: 'Non implémenté' }),
    getSecrets: async (req, res) => res.json([]),
    deleteSecret: async (req, res) => res.status(501).json({ error: 'Non implémenté' }),
    
    sendAnonymous: async (req, res) => res.status(501).json({ error: 'Non implémenté' }),
    getAnonymousMessages: async (req, res) => res.json([]),
    revealMessage: async (req, res) => res.status(501).json({ error: 'Non implémenté' }),
    
    createCoupon: async (req, res) => res.status(501).json({ error: 'Non implémenté' }),
    getCoupons: async (req, res) => res.json([]),
    useCoupon: async (req, res) => res.status(501).json({ error: 'Non implémenté' }),
    
    createPuzzle: async (req, res) => res.status(501).json({ error: 'Non implémenté' }),
    getPuzzles: async (req, res) => res.json([]),
    updatePuzzleProgress: async (req, res) => res.status(501).json({ error: 'Non implémenté' }),
};
