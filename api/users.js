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
      
      console.log('🗑️ DELETE request received for ID:', id);
      
      if (!id) {
        return res.status(400).json({ 
          success: false,
          error: 'User ID required' 
        });
      }

      // 1. Cek apakah user ada
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('avatar_url')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('❌ User not found:', fetchError);
        return res.status(404).json({ 
          success: false,
          error: 'User not found' 
        });
      }

      // 2. Hapus avatar dari storage jika ada
      if (userData?.avatar_url) {
        try {
          const fileName = userData.avatar_url.split('/').pop();
          if (fileName) {
            const { error: storageError } = await supabase.storage
              .from('avatars')
              .remove([`avatars/${fileName}`]);
            
            if (storageError) {
              console.warn('⚠️ Failed to delete avatar:', storageError.message);
            } else {
              console.log('✅ Avatar deleted from storage');
            }
          }
        } catch (storageErr) {
          console.warn('⚠️ Storage delete error:', storageErr.message);
        }
      }

      // 3. Hapus user dari database
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('❌ Delete error:', deleteError);
        return res.status(500).json({ 
          success: false,
          error: deleteError.message 
        });
      }

      console.log('✅ User deleted successfully:', id);
      return res.status(200).json({ 
        success: true, 
        message: 'User deleted successfully',
        deletedId: id
      });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message || 'Internal server error' 
    });
  }
}
