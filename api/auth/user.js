import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authorization token required' 
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: ''
    });

    if (sessionError) throw sessionError;

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', sessionData.user.id)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      throw userError;
    }

    return res.status(200).json({
      success: true,
      user: {
        ...sessionData.user,
        profile: userData || {}
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    return res.status(401).json({ 
      success: false, 
      error: error.message || 'Unauthorized' 
    });
  }
}
