import { createClient } from '@supabase/supabase-js'

// const supabaseUrl = 'https://orngqbozxgyyjxkltlnz.supabase.co';
const supabaseUrl = 'http://127.0.0.1:54321';

// const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ybmdxYm96eGd5eWp4a2x0bG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NDQ0NDIsImV4cCI6MjA2NTQyMDQ0Mn0.fzb_m87J6YI2Xo9JsiwyFAKEcRZPcl5kEXZc8NZ5E5c';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey)