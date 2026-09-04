import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignUp() {
  console.log('Testing sign up...');
  
  const testEmail = `test.user.${Date.now()}@gmail.com`;
  const fullName = 'Test User';
  
  const { data, error } = await supabase.auth.signUp({
    email: testEmail,
    password: 'password123',
    options: {
      data: {
        full_name: fullName,
      }
    }
  });

  if (error) {
    console.error('Sign up failed:', error.message);
    return;
  }

  console.log('User created in auth.users:', data.user ? 'YES' : 'NO');
  console.log('User ID:', data.user?.id);

  if (data.user?.id) {
    console.log('Checking public.profiles for ID:', data.user.id);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id);
      
    if (profileError) {
      console.error('Failed to find profile:', profileError.message);
    } else {
      console.log('Profile found in public.profiles:', profile);
    }
  }
}

testSignUp();
