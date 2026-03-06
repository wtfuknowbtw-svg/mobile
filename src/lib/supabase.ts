import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vchknshhzyikwlmstquf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjaGtuc2hoenlpa3dsbXN0cXVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NDg2NzIsImV4cCI6MjA4ODIyNDY3Mn0.pnpZramnz8YtE0vk_Js2bE82QpTdKuXW-NdXoE7oepg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
