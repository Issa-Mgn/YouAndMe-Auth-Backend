const { Router } = require('express');
const { uploadAvatar } = require('../controllers/profileController');
const { authMiddleware } = require('../middleware/authMiddleware');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.post('/avatar', authMiddleware, upload.single('image'), uploadAvatar);

module.exports = router;
