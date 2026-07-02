// api/users.js - Versi Debug
const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  // Log untuk debugging
  console.log('API called!');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  // Cek environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('Supabase URL exists?', !!supabaseUrl);
  console.log('Supabase Key exists?', !!supabaseKey);
  
  // Kalau env gak ada, return error jelas
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({
      error: 'Missing environment variables',
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey
    });
  }

  try {
    // Inisialisasi Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // GET semua users
    if (req.method === 'GET') {
      console.log('Fetching users...');
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .limit(10); // Batasi biar gak overload
      
      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ 
          error: 'Supabase query failed',
          details: error.message 
        });
      }
      
      console.log('Users fetched:', data?.length || 0);
      return res.status(200).json(data || []);
    }

    // POST insert user baru
    if (req.method === 'POST') {
      const { email, username, full_name } = req.body;
      
      if (!email || !username) {
        return res.status(400).json({ 
          error: 'Email and username are required' 
        });
      }
      
      const { data, error } = await supabase
        .from('users')
        .insert([{ 
          email, 
          username, 
          full_name: full_name || username,
          status: 'active' 
        }])
        .select();
      
      if (error) {
        console.error('Insert error:', error);
        return res.status(500).json({ 
          error: 'Failed to insert user',
          details: error.message 
        });
      }
      
      return res.status(201).json(data);
    }

    // Method not allowed
    res.status(405).json({ 
      error: 'Method not allowed',
      allowed: ['GET', 'POST']
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
