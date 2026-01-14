import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vbwvrwlwzkefqvebuvxi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZid3Zyd2x3emtlZnF2ZWJ1dnhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4NTA3MjEsImV4cCI6MjA3NjQyNjcyMX0.YYkq0VOLHvL3GqG1Ccxb7EEeICbo8wkMk0BJiUevHJE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
