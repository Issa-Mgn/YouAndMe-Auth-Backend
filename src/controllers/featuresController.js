const { supabase } = require('../config/supabase');

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

// ==================== PLACEHOLDER FUNCTIONS ====================

const uploadVlog = async (req, res) => res.status(501).json({ error: 'Non implémenté' });
const getVlogs = async (req, res) => res.json([]);
const unlockVlog = async (req, res) => res.status(501).json({ error: 'Non implémenté' });

const getDailyFortune = async (req, res) => res.json({ fortune: 'Votre amour grandira aujourd\'hui ❤️' });
const getTarotCard = async (req, res) => res.json({ card: 'Les Amoureux', meaning: 'Union et harmonie' });

const saveDrawing = async (req, res) => res.status(501).json({ error: 'Non implémenté' });
const getDrawings = async (req, res) => res.json([]);

const getDailyQuestions = async (req, res) => res.json([]);
const submitAnswer = async (req, res) => res.status(501).json({ error: 'Non implémenté' });
const getQuestionResults = async (req, res) => res.json({});

const addBattleSong = async (req, res) => res.status(501).json({ error: 'Non implémenté' });
const getBattleSongs = async (req, res) => res.json([]);
const voteSong = async (req, res) => res.status(501).json({ error: 'Non implémenté' });

const addSecret = async (req, res) => res.status(501).json({ error: 'Non implémenté' });
const getSecrets = async (req, res) => res.json([]);
const deleteSecret = async (req, res) => res.status(501).json({ error: 'Non implémenté' });

const sendAnonymous = async (req, res) => res.status(501).json({ error: 'Non implémenté' });
const getAnonymousMessages = async (req, res) => res.json([]);
const revealMessage = async (req, res) => res.status(501).json({ error: 'Non implémenté' });

const createCoupon = async (req, res) => res.status(501).json({ error: 'Non implémenté' });
const getCoupons = async (req, res) => res.json([]);
const useCoupon = async (req, res) => res.status(501).json({ error: 'Non implémenté' });

const createPuzzle = async (req, res) => res.status(501).json({ error: 'Non implémenté' });
const getPuzzles = async (req, res) => res.json([]);
const updatePuzzleProgress = async (req, res) => res.status(501).json({ error: 'Non implémenté' });

// ==================== EXPORTS ====================

module.exports = {
    // Decision Wheel
    createDecision,
    getDecisions,
    spinWheel: spinDecisionWheel,
    
    // Ephemeral Thoughts
    sendThought,
    getThoughts,
    markThoughtRead,
    
    // Vlogs
    uploadVlog,
    getVlogs,
    unlockVlog,
    
    // Fortune
    getDailyFortune,
    getTarotCard,
    
    // Canvas
    saveDrawing,
    getDrawings,
    
    // Questions
    getDailyQuestions,
    submitAnswer,
    getQuestionResults,
    
    // Playlist Battle
    addBattleSong,
    getBattleSongs,
    voteSong,
    
    // Secret Box
    addSecret,
    getSecrets,
    deleteSecret,
    
    // Anonymous
    sendAnonymous,
    getAnonymousMessages,
    revealMessage,
    
    // Coupons
    createCoupon,
    getCoupons,
    useCoupon,
    
    // Puzzles
    createPuzzle,
    getPuzzles,
    updatePuzzleProgress,
};
