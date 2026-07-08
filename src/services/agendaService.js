const { supabase } = require('../config/supabase');
const { NotificationService } = require('./notificationService');

class AgendaService {
    async addEvent(userId, coupleId, partnerId, title, date, category) {
        const { data, error } = await supabase
            .from('agenda')
            .insert({
                couple_id: coupleId,
                user_id: userId,
                title,
                event_date: date,
                category // 'upcoming' or 'history'
            })
            .select()
            .single();

        if (error) throw error;

        // Notify Partner
        await NotificationService.notifyPartner(partnerId, 'Nouvel événement 📅', `Un nouvel événement "${title}" a été ajouté à votre agenda.`);

        return data;
    }

    async getEvents(coupleId) {
        const { data, error } = await supabase
            .from('agenda')
            .select('*')
            .eq('couple_id', coupleId)
            .order('event_date', { ascending: true });

        if (error) throw error;
        return data;
    }

    async deleteEvent(eventId, coupleId) {
        // Verify ownership
        const { data: event, error: fetchError } = await supabase
            .from('agenda')
            .select('*')
            .eq('id', eventId)
            .eq('couple_id', coupleId)
            .single();

        if (fetchError) throw fetchError;
        if (!event) throw new Error('Event not found');

        // Delete from database
        const { error: deleteError } = await supabase
            .from('agenda')
            .delete()
            .eq('id', eventId);

        if (deleteError) throw deleteError;
        return { success: true };
    }
}

module.exports = { AgendaService: new AgendaService() };
