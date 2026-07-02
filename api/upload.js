import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://spwlyrrgowitiacgxjni.supabase.co';
const SUPABASE_KEY = 'sb_publishable_B0GDNWvGNbF98hWcsBKmUg_HADtmbH5';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    // POST - Upload gambar
    if (req.method === 'POST') {
      const { image, filename, userId } = req.body;

      if (!image || !filename) {
        return res.status(400).json({ error: 'Image and filename required' });
      }

      // Decode base64
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      // Upload ke Supabase Storage
      const filePath = `avatars/${Date.now()}-${filename}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, buffer, {
          contentType: 'image/jpeg',
          cacheControl: '3600'
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Update user dengan avatar_url
      if (userId) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ avatar_url: publicUrl })
          .eq('id', userId);

        if (updateError) throw updateError;
      }

      return res.status(200).json({
        success: true,
        url: publicUrl,
        message: 'Image uploaded successfully'
      });
    }

    // DELETE - Hapus gambar
    if (req.method === 'DELETE') {
      const { imageUrl } = req.query;

      if (!imageUrl) {
        return res.status(400).json({ error: 'Image URL required' });
      }

      // Extract filename dari URL
      const fileName = imageUrl.split('/').pop();
      if (!fileName) {
        return res.status(400).json({ error: 'Invalid image URL' });
      }

      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([`avatars/${fileName}`]);

      if (deleteError) throw deleteError;

      return res.status(200).json({
        success: true,
        message: 'Image deleted successfully'
      });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Operation failed' 
    });
  }
}
