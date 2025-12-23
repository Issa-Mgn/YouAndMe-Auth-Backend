const { Router } = require('express');
const { linkPartner } = require('../controllers/partnerController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = Router();

router.post('/link', authMiddleware, linkPartner);

module.exports = router;
