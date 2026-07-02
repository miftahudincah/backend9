const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || 'https://spwlyrrgowitiacgxjni.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || 'sb_publishable_B0GDNWvGNbF98hWcsBKmUg_HADtmbH5';

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({
      error: 'Missing Supabase credentials',
      details: {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey
      }
    });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('Query error:', error);
        return res.status(500).json({ error: error.message });
      }
      
      return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
      const { email, username, full_name, avatar_url } = req.body;
      
      if (!email || !username) {
        return res.status(400).json({ error: 'Email and username required' });
      }
      
      // Generate UUID untuk id
      const newUser = {
        id: uuidv4(), // ← Generate UUID otomatis
        email,
        username,
        full_name: full_name || username,
        avatar_url: avatar_url || '',
        status: 'active'
      };
      
      console.log('📝 Creating user:', newUser);
      
      const { data, error } = await supabase
        .from('users')
        .insert([newUser])
        .select();
      
      if (error) {
        console.error('❌ Insert error:', error);
        return res.status(500).json({ 
          error: error.message,
          details: error.details,
          hint: error.hint
        });
      }
      
      console.log('✅ User created:', data);
      return res.status(201).json(data);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};
