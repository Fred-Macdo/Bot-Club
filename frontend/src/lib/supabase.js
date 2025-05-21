// 2. Consolidate the Supabase client into a single file
// /frontend/src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// Use environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Check if credentials are available
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing. Please check your environment variables.');
}

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Optional: You can keep this for development/fallback, but ONLY activate if explicitly needed 
// by checking a separate flag, not NODE_ENV
const USE_MOCK_AUTH = false; // Set this to false to use real Supabase auth

if (USE_MOCK_AUTH && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn('Using mock authentication as fallback.');
  
  const mockUser = {
    id: 'mock-user-id',
    email: 'demo@botclub.com',
    user_metadata: { full_name: 'Demo User' }
  };
  
  // Mock implementations
  supabase.auth.signInWithPassword = async () => ({ 
    data: { user: mockUser, session: { user: mockUser } },
    error: null
  });
  
  supabase.auth.getSession = async () => ({
    data: { session: { user: mockUser } },
    error: null
  });
  
  supabase.auth.onAuthStateChange = (_event, _callback) => ({
    data: { subscription: { unsubscribe: () => {} } }
  });
}
