import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bhjkpepmrklicrkqparx.supabase.co';
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoamtwZXBtcmtsaWNya3FwYXJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTkzNTM3OCwiZXhwIjoyMTAxNTExMzc4fQ.4By3cQveLZZNmUrk66VNcnA5x_wun4JN5y5xdiQdPFE';

// Admin panel uses the service_role key to bypass Row Level Security
export const supabase = createClient(supabaseUrl, supabaseServiceKey);
