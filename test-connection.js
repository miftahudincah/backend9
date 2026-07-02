import { createClient } from '@supabase/supabase-js'

// Hardcode dulu buat test
const supabaseUrl = 'https://spwlyrrgowitiacgxjni.supabase.co'
const supabaseKey = 'sb_publishable_B0GDNWvGNbF98hWcsBKmUg_HADtmbH5'

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  console.log('🔄 Mencoba insert data...')
  
  // Insert sample data
  const { data: insertData, error: insertError } = await supabase
    .from('users')
    .insert([{ email: 'test@termux.com', name: 'Termux User' }])
  
  if (insertError) {
    console.log('❌ Gagal insert:', insertError.message)
  } else {
    console.log('✅ Insert berhasil:', insertData)
  }

  console.log('🔄 Mencoba select data...')
  
  // Select semua users
  const { data: users, error: selectError } = await supabase
    .from('users')
    .select('*')
  
  if (selectError) {
    console.log('❌ Gagal select:', selectError.message)
  } else {
    console.log('📋 Data users:', users)
  }
}

test()
