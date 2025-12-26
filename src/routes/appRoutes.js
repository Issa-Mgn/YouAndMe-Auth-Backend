const { Router } = require('express');
const multer = require('multer');
const {
    addSouvenir, getSouvenirs,
    addEvent, getEvents,
    addSong, getPlaylist
} = require('../controllers/featureController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Souvenirs
router.post('/souvenirs', authMiddleware, upload.single('media'), addSouvenir);
router.get('/souvenirs', authMiddleware, getSouvenirs);

// Agenda
router.post('/agenda', authMiddleware, addEvent);
router.get('/agenda', authMiddleware, getEvents);

// Playlist
router.post('/playlist', authMiddleware, upload.single('song'), addSong);
router.get('/playlist', authMiddleware, getPlaylist);

module.exports = router;
