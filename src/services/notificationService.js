const admin = require('firebase-admin');

class NotificationService {
    async sendPushNotification(fcmToken, title, body, data = {}) {
        if (!fcmToken) return;

        const message = {
            notification: {
                title,
                body,
            },
            data,
            token: fcmToken,
        };

        try {
            const response = await admin.messaging().send(message);
            console.log('Successfully sent message:', response);
            return response;
        } catch (error) {
            console.error('Error sending message:', error);
            if (error.code === 'messaging/registration-token-not-registered') {
                // Token is no longer valid, should clear it in DB
            }
        }
    }

    async notifyPartner(partnerId, title, body, data = {}) {
        const { supabase } = require('../config/supabase');

        const { data: user, error } = await supabase
            .from('users')
            .select('fcm_token')
            .eq('id', partnerId)
            .single();

        if (error || !user || !user.fcm_token) return;

        return this.sendPushNotification(user.fcm_token, title, body, data);
    }
}

module.exports = { NotificationService: new NotificationService() };
