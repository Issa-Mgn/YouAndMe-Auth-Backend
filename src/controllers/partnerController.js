const { CoupleService } = require('../services/coupleService');
const { UserService } = require('../services/userService');
const { z } = require('zod');

const userService = new UserService();

const linkSchema = z.object({
    partnerCode: z.string().min(1, "Partner code is required"),
});

const linkPartner = async (req, res) => {
    try {
        const { uid } = req.user;

        // Validation
        const validation = linkSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: validation.error.errors });
            return;
        }

        const { partnerCode } = validation.data;

        const result = await userService.linkPartner(uid, partnerCode);
        res.status(200).json({ message: 'Success', ...result });
    } catch (error) {
        console.error('Link Partner Error:', error);
        res.status(400).json({ error: error.message || 'Internal Server Error' });
    }
};

const requestBreakup = async (req, res) => {
    try {
        const { uid } = req.user;
        const user = await userService.getUserByUid(uid);
        if (!user.couple_id) return res.status(400).json({ error: 'Not in a couple' });

        const result = await CoupleService.requestBreakup(user.couple_id);
        res.status(200).json({ message: 'Breakup requested. Disconnection in 10 days.', ...result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const cancelBreakup = async (req, res) => {
    try {
        const { uid } = req.user;
        const user = await userService.getUserByUid(uid);
        if (!user.couple_id) return res.status(400).json({ error: 'Not in a couple' });

        const result = await CoupleService.cancelBreakup(user.couple_id);
        res.status(200).json({ message: 'Breakup cancelled. Your duo is active again!', ...result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { linkPartner, requestBreakup, cancelBreakup };
