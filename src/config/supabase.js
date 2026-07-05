const { createClient } = require('@supabase/supabase-js');
const { config } = require('./env');

if (!config.supabase.url || !config.supabase.serviceKey) {
    throw new Error('Missing Supabase configuration');
}

const supabase = createClient(config.supabase.url, config.supabase.serviceKey);

module.exports = { supabase };
