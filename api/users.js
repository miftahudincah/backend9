import { createClient } from '@supabase/supabase-js';

// Hardcode dulu untuk testing
const SUPABASE_URL = 'https://spwlyrrgowitiacgxjni.supabase.co';
const SUPABASE_KEY = 'sb_publishable_B0GDNWvGNbF98hWcsBKmUg_HADtmbH5';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    if (req.method === 'GET') {
      console.log('📥 Fetching users...');
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('❌ Query error:', error);
        return res.status(500).json({ 
          error: error.message,
          details: error.details
        });
      }
      
      console.log('✅ Users fetched:', data?.length || 0);
      return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
      console.log('📝 Creating user...');
      const { email, username, full_name, avatar_url } = req.body || {};
      
      if (!email || !username) {
        return res.status(400).json({ 
          error: 'Email and username required'
        });
      }
      
      const newUser = {
        email: email.trim(),
        username: username.trim(),
        full_name: full_name?.trim() || username.trim(),
        avatar_url: avatar_url?.trim() || '',
        status: 'active'
      };
      
      console.log('📝 New user data:', newUser);
      
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
      message: error.message || 'Unknown error'
    });
  }
}
