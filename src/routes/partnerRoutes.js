const { Router } = require('express');
const { linkPartner, requestBreakup, cancelBreakup } = require('../controllers/partnerController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = Router();

router.post('/link', authMiddleware, linkPartner);
router.post('/breakup', authMiddleware, requestBreakup);
router.post('/cancel-breakup', authMiddleware, cancelBreakup);

module.exports = router;
