import { createClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || 'https://spwlyrrgowitiacgxjni.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || 'sb_publishable_B0GDNWvGNbF98hWcsBKmUg_HADtmbH5';

console.log('🔍 Testing Supabase connection...');
console.log('URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('Key:', supabaseKey ? '✅ Set' : '❌ Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Environment variables not set!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('\n🔄 Testing insert...');
  
  const newUser = {
    email: `test-${Date.now()}@termux.com`,
    username: `termux_${Date.now()}`,
    full_name: 'Termux User',
    status: 'active'
  };
  
  const { data: insertData, error: insertError } = await supabase
    .from('users')
    .insert([newUser])
    .select();
  
  if (insertError) {
    console.log('❌ Insert failed:', insertError.message);
    console.log('🔍 Error details:', insertError);
  } else {
    console.log('✅ Insert success:', insertData);
  }

  console.log('\n🔄 Testing select...');
  
  const { data: users, error: selectError } = await supabase
    .from('users')
    .select('*')
    .limit(5);
  
  if (selectError) {
    console.log('❌ Select failed:', selectError.message);
  } else {
    console.log(`✅ Found ${users?.length || 0} users:`);
    console.log(users);
  }
}

test();
