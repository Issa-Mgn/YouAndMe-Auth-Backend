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
        // 1. Get current user
        const { data: currentUser, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', uid)
            .single();

        if (userError || !currentUser) throw new Error('User not found');
        if (currentUser.unique_code === partnerCode) throw new Error('Cannot link with yourself');
        if (currentUser.partner_code) throw new Error('User already has a partner');

        // 2. Find partner by code
        const { data: partner, error: partnerError } = await supabase
            .from('users')
            .select('*')
            .eq('unique_code', partnerCode)
            .single();

        if (partnerError || !partner) throw new Error('Partner code invalid');
        if (partner.partner_code) throw new Error('Partner already linked');

        // 3. Link both users (Sequential updates)

        // Update Current User
        const { error: updateCurrentUserError } = await supabase
            .from('users')
            .update({ partner_code: partnerCode })
            .eq('id', uid);

        if (updateCurrentUserError) throw new Error('Failed to update current user');

        // Update Partner
        const { error: updatePartnerError } = await supabase
            .from('users')
            .update({ partner_code: currentUser.unique_code })
            .eq('id', partner.id);

        if (updatePartnerError) {
            // Rollback current user update (manual compensation)
            await supabase.from('users').update({ partner_code: null }).eq('id', uid);
            throw new Error('Failed to link partner');
        }

        return { currentUser: { ...currentUser, partner_code: partnerCode }, partner };
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

    async getUserByUid(uid) {
        const { data, error } = await supabase.from('users').select('*').eq('id', uid).single();
        if (error) throw error;
        return data;
    }
}

module.exports = { UserService };
