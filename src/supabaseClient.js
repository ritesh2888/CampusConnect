import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://doychvufppkmqzwbnrdz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRveWNodnVmcHBrbXF6d2JucmR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyOTkzNTAsImV4cCI6MjEwNjg3NTM1MH0.HvrD54dAMpUwoqkfoSt9iuvjsmHi9sWKORgVYz5u_l0';

export const supabase = createClient(supabaseUrl, supabaseKey);
