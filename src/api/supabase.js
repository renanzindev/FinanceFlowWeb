import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pkthulkqpkqamldyglnx.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrdGh1bGtxcGtxYW1sZHlnbG54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NzcyMTQsImV4cCI6MjA3MDI1MzIxNH0.PPSiur3VQh-LeoFxAgLP-NF5GPqJ2lEZdvK5qj30hr8';

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://pkthulkqpkqamldyglnx.supabase.co') {
  console.warn('Supabase credentials not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

export default supabase;

// Helper functions for authentication
export const setAuthToken = (token) => {
  localStorage.setItem('authToken', token);
};

export const removeAuthToken = () => {
  localStorage.removeItem('authToken');
};

export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};