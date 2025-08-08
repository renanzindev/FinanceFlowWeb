import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://pkthulkqpkqamldyglnx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrdGh1bGtxcGtxYW1sZHlnbG54Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDY3NzIxNCwiZXhwIjoyMDcwMjUzMjE0fQ.kBqyBHhlTjA6IoUrwsU8fHhC4SOX4S-wVhsm2O3k2AQ';

if (!supabaseUrl || !supabaseServiceKey || supabaseUrl === 'https://pkthulkqpkqamldyglnx.supabase.co' || supabaseServiceKey === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrdGh1bGtxcGtxYW1sZHlnbG54Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDY3NzIxNCwiZXhwIjoyMDcwMjUzMjE0fQ.kBqyBHhlTjA6IoUrwsU8fHhC4SOX4S-wVhsm2O3k2AQ') {
  console.warn('⚠️  Supabase credentials not configured. Please update your .env file with real Supabase credentials.');
} else {
  console.log('✅ Supabase credentials configured successfully!');
}

// Create Supabase client with service role key for server-side operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export default supabase;