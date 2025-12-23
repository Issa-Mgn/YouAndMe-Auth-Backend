const { Router } = require('express');
const { syncUser } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = Router();

router.post('/sync', authMiddleware, syncUser);

module.exports = router;
