// api/users.js - Pake Environment Variables
const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  // 🔥 PAKE ENVIRONMENT VARIABLES (BUKAN HARDCODE)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  // Validasi
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    return res.status(500).json({
      error: 'Missing Supabase credentials',
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey
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
