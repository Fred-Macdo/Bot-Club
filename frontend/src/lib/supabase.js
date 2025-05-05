// 2. Consolidate the Supabase client into a single file
// /frontend/src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// Use environment variables or fallback to test values
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://wxyzabcdefghijklmnopq.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4ZGF1cGxsenl6Y25wcWd5dG1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxMDU3MjgsImV4cCI6MTk2MDY4MTcyOH0.fakekey12345-for-development-only';

// For development purposes - add a console log to check connection
console.log('Supabase connection status:', supabaseUrl ? 'URL configured' : 'URL missing', supabaseAnonKey ? 'Key configured' : 'Key missing');

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Mock authentication functions for development if needed
if (!supabaseUrl || !supabaseAnonKey || process.env.NODE_ENV === 'development') {
  console.warn('Using mock authentication for development. Remove in production.');
  
  // Override authentication methods with mock implementations for development
  const mockUser = {
    id: 'mock-user-id',
    email: 'demo@botclub.com',
    user_metadata: { full_name: 'Demo User' }
  };
  
  // This is only used if Supabase credentials are missing
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
