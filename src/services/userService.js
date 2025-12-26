const { supabase } = require('../config/supabase');
const { generateUniqueCode } = require('../utils/codeGenerator');

class UserService {
    async syncUser(uid, email, displayName) {
        // Check if user exists
        const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', uid)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
            throw new Error(`Error fetching user: ${fetchError.message}`);
        }

        if (existingUser) {
            return existingUser;
        }

        // Create new user
        let uniqueCode = generateUniqueCode();
        let isUnique = false;

        // Retry loop to ensure uniqueness (simplified)
        while (!isUnique) {
            const { data } = await supabase.from('users').select('id').eq('unique_code', uniqueCode).single();
            if (!data) {
                isUnique = true;
            } else {
                uniqueCode = generateUniqueCode();
            }
        }

        const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
                id: uid,
                email,
                display_name: displayName || '',
                unique_code: uniqueCode,
                created_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (createError) {
            throw new Error(`Error creating user: ${createError.message}`);
        }

        return newUser;
    }

    async linkPartner(uid, partnerCode) {
        // This is now handled by CoupleService for the reciprocal logic
        const { CoupleService } = require('./coupleService');
        return CoupleService.handlePairing(uid, partnerCode);
    }

    async updateAvatar(uid, avatarUrl) {
        const { data, error } = await supabase
            .from('users')
            .update({ avatar_url: avatarUrl })
            .eq('id', uid)
            .select()
            .single();

        if (error) throw new Error(`Failed to update avatar: ${error.message}`);
        return data;
    }

    async updateFcmToken(uid, token) {
        await supabase.from('users').update({ fcm_token: token }).eq('id', uid);
    }

    async getUserByUid(uid) {
        const { data, error } = await supabase.from('users').select('*, couple:couples!fk_user_couple(*)').eq('id', uid).single();
        if (error) throw error;
        return data;
    }

    async getStats(userId, coupleId) {
        // Counts for Profile stats
        const { count: souvenirsCount } = await supabase.from('souvenirs').select('*', { count: 'exact', head: true }).eq('couple_id', coupleId);
        const { data: likesData } = await supabase.from('souvenirs').select('likes_count').eq('couple_id', coupleId);
        const heartsCount = likesData.reduce((acc, curr) => acc + (curr.likes_count || 0), 0);
        const { count: videosCount } = await supabase.from('souvenirs').select('*', { count: 'exact', head: true }).eq('couple_id', coupleId).eq('media_type', 'video');

        // Days together
        const { data: couple } = await supabase.from('couples').select('started_at').eq('id', coupleId).single();
        const start = new Date(couple.started_at);
        const now = new Date();
        const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;

        return {
            moments: souvenirsCount || 0,
            days: diff,
            hearts: heartsCount || 0,
            videos: videosCount || 0
        };
    }
}

module.exports = { UserService };
