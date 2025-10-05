import { createClient } from '@supabase/supabase-js';

// Supabase configuration - hardcoded for hackathon prototyping
const supabaseUrl = 'https://thndamxclsnnjbeoejbw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRobmRhbXhjbHNubmpiZW9lamJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NTk0MjEsImV4cCI6MjA3NTEzNTQyMX0.gsABsjFXdZjUB3VEmKSNV7VptuXzM6nbn1J2NYMYagY';

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);