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
        res.status(200).json({ message: 'Partners linked successfully', ...result });
    } catch (error) {
        console.error('Link Partner Error:', error);
        // Determine status code based on error message (simplistic approach)
        const status = error.message.includes('not found') || error.message.includes('invalid') ? 404 : 400;
        res.status(status).json({ error: error.message || 'Internal Server Error' });
    }
};

module.exports = { linkPartner };
