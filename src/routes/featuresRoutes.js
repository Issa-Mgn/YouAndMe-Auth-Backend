const { Router } = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const {
    // Decision Wheel
    createDecision,
    getDecisions,
    spinWheel,
    
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
    
    // Quick Questions
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
    
    // Anonymous Messages
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
} = require('../controllers/featuresController');

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Decision Wheel Routes
router.post('/decision-wheel', authMiddleware, createDecision);
router.get('/decision-wheel', authMiddleware, getDecisions);
router.post('/decision-wheel/:id/spin', authMiddleware, spinWheel);

// Ephemeral Thoughts Routes
router.post('/thoughts', authMiddleware, sendThought);
router.get('/thoughts', authMiddleware, getThoughts);
router.put('/thoughts/:id/read', authMiddleware, markThoughtRead);

// Vlogs Routes
router.post('/vlogs', authMiddleware, upload.single('video'), uploadVlog);
router.get('/vlogs', authMiddleware, getVlogs);
router.get('/vlogs/:id/unlock', authMiddleware, unlockVlog);

// Fortune Routes
router.get('/fortune/daily', authMiddleware, getDailyFortune);
router.get('/fortune/tarot', authMiddleware, getTarotCard);

// Canvas Routes
router.post('/canvas', authMiddleware, saveDrawing);
router.get('/canvas', authMiddleware, getDrawings);

// Quick Questions Routes
router.get('/questions/daily', authMiddleware, getDailyQuestions);
router.post('/questions/:id/answer', authMiddleware, submitAnswer);
router.get('/questions/:id/results', authMiddleware, getQuestionResults);

// Playlist Battle Routes
router.post('/playlist-battle', authMiddleware, addBattleSong);
router.get('/playlist-battle', authMiddleware, getBattleSongs);
router.put('/playlist-battle/:id/vote', authMiddleware, voteSong);

// Secret Box Routes
router.post('/secrets', authMiddleware, upload.single('file'), addSecret);
router.get('/secrets', authMiddleware, getSecrets);
router.delete('/secrets/:id', authMiddleware, deleteSecret);

// Anonymous Messages Routes
router.post('/anonymous', authMiddleware, sendAnonymous);
router.get('/anonymous', authMiddleware, getAnonymousMessages);
router.put('/anonymous/:id/reveal', authMiddleware, revealMessage);

// Coupons Routes
router.post('/coupons', authMiddleware, createCoupon);
router.get('/coupons', authMiddleware, getCoupons);
router.put('/coupons/:id/use', authMiddleware, useCoupon);

// Puzzles Routes
router.post('/puzzles', authMiddleware, createPuzzle);
router.get('/puzzles', authMiddleware, getPuzzles);
router.put('/puzzles/:id/progress', authMiddleware, updatePuzzleProgress);

module.exports = router;
