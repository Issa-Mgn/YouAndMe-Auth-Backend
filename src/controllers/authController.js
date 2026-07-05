const { UserService } = require('../services/userService');
const { supabase } = require('../config/supabase');

const userService = new UserService();

const syncUser = async (req, res) => {
    try {
        const { uid, email } = req.user;
        const { displayName } = req.body;

        if (!email) {
            res.status(400).json({ error: 'Email is required' });
            return;
        }

        const user = await userService.syncUser(uid, email, displayName);
        
        // Si l'utilisateur est dans un couple, récupérer les données du partenaire
        let partnerData = null;
        if (user.couple_id) {
            const { data: couple } = await supabase
                .from('couples')
                .select('user1_id, user2_id')
                .eq('id', user.couple_id)
                .single();
            
            if (couple) {
                // Déterminer l'ID du partenaire
                const partnerId = couple.user1_id === uid ? couple.user2_id : couple.user1_id;
                
                // Récupérer les données du partenaire
                const { data: partner } = await supabase
                    .from('users')
                    .select('id, email, display_name, avatar_url, unique_code')
                    .eq('id', partnerId)
                    .single();
                
                if (partner) {
                    partnerData = {
                        id: partner.id,
                        email: partner.email,
                        display_name: partner.display_name,
                        name: partner.display_name,
                        partner_name: partner.display_name,
                        partner_display_name: partner.display_name,
                        avatar_url: partner.avatar_url,
                        partner_avatar_url: partner.avatar_url,
                        unique_code: partner.unique_code
                    };
                }
            }
        }
        
        // Retourner l'utilisateur avec les données du partenaire
        res.status(200).json({
            user: user,
            partner: partnerData,
            couple_id: user.couple_id
        });
    } catch (error) {
        console.error('Sync User Error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};

module.exports = { syncUser };
