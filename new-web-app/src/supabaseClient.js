import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://orngqbozxgyyjxkltlnz.supabase.co' // Replace with your URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ybmdxYm96eGd5eWp4a2x0bG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NDQ0NDIsImV4cCI6MjA2NTQyMDQ0Mn0.fzb_m87J6YI2Xo9JsiwyFAKEcRZPcl5kEXZc8NZ5E5c' // Replace with your anon key

export const supabase = createClient(supabaseUrl, supabaseAnonKey)