const { supabase } = require('../config/supabase');
const { imagekit } = require('../config/imagekit');
const { NotificationService } = require('./notificationService');

class SouvenirService {
    async addSouvenir(userId, coupleId, partnerId, file, type) {
        // 1. Upload to ImageKit
        const uploadResponse = await imagekit.upload({
            file: file.buffer,
            fileName: `${type}_${Date.now()}_${userId}`,
            folder: `/couples/${coupleId}/souvenirs`,
        });

        // 2. Save to DB
        const { data, error } = await supabase
            .from('souvenirs')
            .insert({
                couple_id: coupleId,
                user_id: userId,
                media_url: uploadResponse.url,
                media_type: type, // 'image' or 'video'
            })
            .select()
            .single();

        if (error) throw error;

        // 3. Notify partner
        await NotificationService.notifyPartner(partnerId, 'Nouveau souvenir ❤️', `Votre partenaire a ajouté une ${type === 'image' ? 'photo' : 'vidéo'}.`);

        return data;
    }

    async getSouvenirs(coupleId) {
        const { data, error } = await supabase
            .from('souvenirs')
            .select('*')
            .eq('couple_id', coupleId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    async likeSouvenir(souvenirId, partnerId) {
        const { data, error } = await supabase.rpc('increment_likes', { row_id: souvenirId });
        // Note: You need a Postgres function 'increment_likes' or just a select/update.
        // Let's do it simply here:
        const { data: souvenir, error: fetchError } = await supabase.from('souvenirs').select('likes_count').eq('id', souvenirId).single();
        if (fetchError) throw fetchError;

        const { data: updated, error: updateError } = await supabase
            .from('souvenirs')
            .update({ likes_count: (souvenir.likes_count || 0) + 1 })
            .eq('id', souvenirId)
            .select()
            .single();

        if (updateError) throw updateError;

        // Optional: Notify author that it was liked
        if (updated.user_id !== partnerId) {
            await NotificationService.notifyPartner(updated.user_id, 'Coup de cœur !', 'Votre partenaire a liké un souvenir.');
        }

        return updated;
    }
}

module.exports = { SouvenirService: new SouvenirService() };
