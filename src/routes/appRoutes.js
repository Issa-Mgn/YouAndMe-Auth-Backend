const { Router } = require('express');
const multer = require('multer');
const {
    addSouvenir, getSouvenirs, deleteSouvenir, likeSouvenir,
    addEvent, getEvents, deleteEvent,
    addSong, getPlaylist, deleteSong
} = require('../controllers/featureController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Souvenirs
router.post('/souvenirs', authMiddleware, upload.single('media'), addSouvenir);
router.get('/souvenirs', authMiddleware, getSouvenirs);
router.delete('/souvenirs/:id', authMiddleware, deleteSouvenir);
router.post('/souvenirs/:id/like', authMiddleware, likeSouvenir);

// Agenda
router.post('/agenda', authMiddleware, addEvent);
router.get('/agenda', authMiddleware, getEvents);
router.delete('/agenda/:id', authMiddleware, deleteEvent);

// Playlist
router.post('/playlist', authMiddleware, upload.single('song'), addSong);
router.get('/playlist', authMiddleware, getPlaylist);
router.delete('/playlist/:id', authMiddleware, deleteSong);

module.exports = router;
