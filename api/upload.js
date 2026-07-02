import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://spwlyrrgowitiacgxjni.supabase.co';
const SUPABASE_KEY = 'sb_publishable_B0GDNWvGNbF98hWcsBKmUg_HADtmbH5';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image, filename, userId } = req.body;

    if (!image || !filename) {
      return res.status(400).json({ error: 'Image and filename required' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ 
      error: error.message || 'Upload failed' 
    });
  }
}
