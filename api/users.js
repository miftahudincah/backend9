// api/users.js - Versi dengan Hardcode Sementara
const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  // 🔥 HARDCODE SEMENTARA UNTUK TESTING
  // (Hapus ini setelah berhasil!)
  const supabaseUrl = 'https://spwlyrrgowitiacgxjni.supabase.co';
  const supabaseKey = 'sb_publishable_B0GDNWvGNbF98hWcsBKmUg_HADtmbH5';
  
  // // 🔄 Nanti aktifkan ini setelah hardcode berhasil
  // const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  // const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  // Validasi URL
  if (!supabaseUrl || !supabaseUrl.startsWith('https://')) {
    console.error('Invalid URL:', supabaseUrl);
    return res.status(500).json({
      error: 'Invalid Supabase URL',
      urlReceived: supabaseUrl,
      urlLength: supabaseUrl?.length || 0
    });
  }

  if (!supabaseKey || supabaseKey.length < 10) {
    console.error('Invalid Key:', supabaseKey);
    return res.status(500).json({
      error: 'Invalid Supabase Key',
      keyLength: supabaseKey?.length || 0
    });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .limit(10);
      
      if (error) {
        console.error('Query error:', error);
        return res.status(500).json({ error: error.message });
      }
      
      return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
      const { email, username, full_name } = req.body;
      
      if (!email || !username) {
        return res.status(400).json({ error: 'Email and username required' });
      }
      
      const { data, error } = await supabase
        .from('users')
        .insert([{ email, username, full_name: full_name || username, status: 'active' }])
        .select();
      
      if (error) {
        console.error('Insert error:', error);
        return res.status(500).json({ error: error.message });
      }
      
      return res.status(201).json(data);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};
