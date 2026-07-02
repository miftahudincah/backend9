import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { email, password, username, full_name } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email, password, and username required' 
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: full_name || username
        }
      }
    });

    if (authError) throw authError;

    if (!authData.user) {
      return res.status(400).json({ 
        success: false, 
        error: 'Registration failed' 
      });
    }

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        username: username,
        full_name: full_name || username
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Registration failed' 
    });
  }
}
