const { Router } = require('express');
const multer = require('multer');
const { sendMessage, getChatHistory, addReaction } = require('../controllers/messageController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', authMiddleware, upload.single('media'), sendMessage);
router.get('/', authMiddleware, getChatHistory);
router.post('/:messageId/reaction', authMiddleware, addReaction);

module.exports = router;
