const SUPABASE_URL = 'https://ehkqzvifmrtkylcwxajy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoa3F6dmlmbXJ0a3lsY3d4YWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3MTQ5MjUsImV4cCI6MjA5NjI5MDkyNX0.V0UEjx9lOAEfE9JWc_Os1m459nz6OSRFBjKA71nLnJI';

// Initialize the Supabase client and attach it to window so other scripts can use it
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
