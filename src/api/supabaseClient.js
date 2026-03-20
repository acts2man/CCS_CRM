import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dplwelvxynuaiwedzmjn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbHdlbHZ4eW51YWl3ZWR6bWpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1MjM4NjIsImV4cCI6MjA2MzA5OTg2Mn0.S5ioBWtUKXki0GjvKms8ABcCwWdGfWd3QoVvhlj0g1U';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);