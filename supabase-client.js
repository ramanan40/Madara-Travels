// --- supabase-client.js ---

// 1. Get your Supabase keys
// (I have kept your keys here for you)
const SUPABASE_URL = 'https://krmrtwjpkcgadtqhiizd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtybXJ0d2pwa2NnYWR0cWhpaXpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMjI4MzQsImV4cCI6MjA3ODc5ODgzNH0.gh99F2Y3BqkVZVaAR1lerZ-dZW_uOr3Po2qDtCE3PrY';

// 2. Create the Supabase client with a UNIQUE KEY
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // ✅ THE FIX: This creates a unique "box" for your data.
    // It ignores all the old junk cookies on localhost.
    storageKey: 'madara_travels_auth_token', 
    persistSession: true,
    detectSessionInUrl: true
  }
});

// 3. Log to confirm
console.log('Supabase client initialized with Unique Key');401429