// extension/supabaseClient.js

import { createClient } from 'https://esm.sh/@supabase/supabase-js';

// IMPORTANT: Copy your Supabase URL and Key again carefully.
const supabaseUrl = 'https://orngqbozxgyyjxkltlnz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ybmdxYm96eGd5eWp4a2x0bG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NDQ0NDIsImV4cCI6MjA2NTQyMDQ0Mn0.fzb_m87J6YI2Xo9JsiwyFAKEcRZPcl5kEXZc8NZ5E5c';

// This line will throw an error if the URL or Key is invalid.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);