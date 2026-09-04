import { createClient } from '@supabase/supabase-js';

try {
  const supabaseUrl = 'https://zvrdgjynhgtywbgdpsnd.supabase.co';
  const supabaseAnonKey = ' '; // space key
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('Client created successfully with space key!');
  
  // Try to make a request
  supabase.from('reports').select('*').limit(1).then(res => {
    console.log('Request response:', res);
  }).catch(err => {
    console.error('Request error:', err);
  });

} catch (err) {
  console.error('createClient error:', err);
}
