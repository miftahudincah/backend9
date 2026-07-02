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
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email required' 
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://backend9.vercel.app/reset-password'
    });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: 'Reset password email sent successfully'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to send reset email' 
    });
  }
}
