const { supabase } = require('../config/supabase');
const { NotificationService } = require('./notificationService');

class CoupleService {
    async handlePairing(userId, partnerCode) {
        // 1. Get current user
        const { data: currentUser, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (userError || !currentUser) throw new Error('User not found');
        if (currentUser.unique_code === partnerCode) throw new Error('Cannot link with yourself');
        if (currentUser.couple_id) throw new Error('User already in a couple');

        // 2. Find partner by code
        const { data: partner, error: partnerError } = await supabase
            .from('users')
            .select('*')
            .eq('unique_code', partnerCode)
            .single();

        if (partnerError || !partner) throw new Error('Partner code invalid');
        if (partner.couple_id) throw new Error('Partner already in a couple');

        // 3. Update current user's partner_code
        await supabase
            .from('users')
            .update({ partner_code: partnerCode })
            .eq('id', userId);

        // 4. Check if reciprocal link exists
        if (partner.partner_code === currentUser.unique_code) {
            // Perfect match! Create couple
            const { data: couple, error: coupleError } = await supabase
                .from('couples')
                .insert({
                    user1_id: currentUser.id,
                    user2_id: partner.id,
                    started_at: new Date().toISOString()
                })
                .select()
                .single();

            if (coupleError) throw coupleError;

            // Update both users with couple_id
            await supabase.from('users').update({ couple_id: couple.id }).in('id', [currentUser.id, partner.id]);

            // Notify both
            await NotificationService.notifyPartner(partner.id, 'Jumelage réussi !', `Vous êtes maintenant jumelé avec ${currentUser.display_name}.`);

            return { status: 'paired', couple };
        }

        return { status: 'pending', message: 'Waiting for partner to enter your code' };
    }

    async getCoupleInfo(coupleId) {
        const { data, error } = await supabase
            .from('couples')
            .select('*, user1:users!couples_user1_id_fkey(*), user2:users!couples_user2_id_fkey(*)')
            .eq('id', coupleId)
            .single();

        if (error) throw error;
        return data;
    }

    async requestBreakup(coupleId) {
        const { data, error } = await supabase
            .from('couples')
            .update({
                status: 'breakup_requested',
                breakup_requested_at: new Date().toISOString()
            })
            .eq('id', coupleId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async cancelBreakup(coupleId) {
        const { data, error } = await supabase
            .from('couples')
            .update({
                status: 'active',
                breakup_requested_at: null
            })
            .eq('id', coupleId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async finalizeBreakup(coupleId) {
        // Remove couple_id from users
        const { data: couple } = await supabase.from('couples').select('*').eq('id', coupleId).single();
        if (!couple) return;

        await supabase.from('users').update({ couple_id: null, partner_code: null }).in('id', [couple.user1_id, couple.user2_id]);

        // Mark couple as broken
        await supabase.from('couples').update({ status: 'broken' }).eq('id', coupleId);

        // Notify both
        await NotificationService.notifyPartner(couple.user1_id, 'Duo terminé 💔', 'Le délai de 10 jours est écoulé. Votre duo est maintenant terminé.');
        await NotificationService.notifyPartner(couple.user2_id, 'Duo terminé 💔', 'Le délai de 10 jours est écoulé. Votre duo est maintenant terminé.');
    }

    async checkBreakups() {
        const { data: couples } = await supabase
            .from('couples')
            .select('*')
            .eq('status', 'breakup_requested');

        if (!couples) return;

        const now = new Date();
        for (const couple of couples) {
            const requestedAt = new Date(couple.breakup_requested_at);
            const diffDays = Math.floor((now - requestedAt) / (1000 * 60 * 60 * 24));

            if (diffDays >= 10) {
                await this.finalizeBreakup(couple.id);
            } else {
                // Send daily countdown notification
                const remaining = 10 - diffDays;
                const message = `Il reste ${remaining} jour(s) avant la fin définitive de votre duo. Vous pouvez encore annuler.`;
                await NotificationService.notifyPartner(couple.user1_id, 'Compte à rebours Rupture ⏳', message);
                await NotificationService.notifyPartner(couple.user2_id, 'Compte à rebours Rupture ⏳', message);
            }
        }
    }
}

module.exports = { CoupleService: new CoupleService() };
