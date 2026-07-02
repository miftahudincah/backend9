import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://spwlyrrgowitiacgxjni.supabase.co';
const SUPABASE_KEY = 'sb_publishable_B0GDNWvGNbF98hWcsBKmUg_HADtmbH5';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    // GET semua users
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    // POST user baru
    if (req.method === 'POST') {
      const { email, username, full_name, avatar_url } = req.body || {};
      
      if (!email || !username) {
        return res.status(400).json({ error: 'Email and username required' });
      }
      
      const newUser = {
        email: email.trim(),
        username: username.trim(),
        full_name: full_name?.trim() || username.trim(),
        avatar_url: avatar_url?.trim() || '',
        status: 'active'
      };
      
      const { data, error } = await supabase
        .from('users')
        .insert([newUser])
        .select();
      
      if (error) throw error;
      return res.status(201).json(data);
    }

    // DELETE user
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ error: 'User ID required' });
      }

      // Hapus avatar dari storage dulu
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('avatar_url')
        .eq('id', id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      // Hapus avatar dari storage jika ada
      if (userData?.avatar_url) {
        const fileName = userData.avatar_url.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('avatars')
            .remove([`avatars/${fileName}`]);
        }
      }

      // Hapus user dari database
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      
      return res.status(200).json({ 
        success: true, 
        message: 'User deleted successfully' 
      });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
