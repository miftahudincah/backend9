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
    const { access_token, new_password } = req.body;

    if (!access_token || !new_password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Access token and new password required' 
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { error: sessionError } = await supabase.auth.setSession({
      access_token,
      refresh_token: ''
    });

    if (sessionError) throw sessionError;

    const { error: updateError } = await supabase.auth.updateUser({
      password: new_password
    });

    if (updateError) throw updateError;

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to reset password' 
    });
  }
}
