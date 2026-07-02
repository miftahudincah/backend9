import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    const { action } = req.query;

    // ============= REGISTER =============
    if (req.method === 'POST' && action === 'register') {
      const { email, password, username, full_name } = req.body;
      if (!email || !password || !username) {
        return res.status(400).json({ success: false, error: 'Email, password, and username required' });
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email, password,
        options: { data: { username, full_name: full_name || username } }
      });

      if (authError) throw authError;
      if (!authData.user) {
        return res.status(400).json({ success: false, error: 'Registration failed' });
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
    }

    // ============= LOGIN =============
    if (req.method === 'POST' && action === 'login') {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password required' });
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        user: data.user,
        session: data.session
      });
    }

    // ============= LOGOUT =============
    if (req.method === 'POST' && action === 'logout') {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    }

    // ============= FORGOT PASSWORD =============
    if (req.method === 'POST' && action === 'forgot-password') {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, error: 'Email required' });
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://backend9.vercel.app/reset-password'
      });

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Reset password email sent successfully'
      });
    }

    // ============= RESET PASSWORD =============
    if (req.method === 'POST' && action === 'reset-password') {
      const { access_token, new_password } = req.body;
      if (!access_token || !new_password) {
        return res.status(400).json({ success: false, error: 'Access token and new password required' });
      }

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
    }

    // ============= GET USER =============
    if (req.method === 'GET' && action === 'user') {
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(' ')[1];

      if (!token) {
        return res.status(401).json({ success: false, error: 'Authorization token required' });
      }

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
    }

    return res.status(400).json({ success: false, error: 'Invalid action' });

  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}
