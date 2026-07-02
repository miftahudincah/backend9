import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    // GET - Load semua produk
    if (req.method === 'GET') {
      const { category, search, limit = 20, page = 1 } = req.query;
      
      let query = supabase
        .from('products')
        .select('*, seller:users(id, full_name, email)')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      
      if (error) throw error;
      
      return res.status(200).json({
        success: true,
        data: data || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || 0
        }
      });
    }

    // GET by ID - Detail produk
    if (req.method === 'GET' && req.query.id) {
      const { id } = req.query;
      
      const { data, error } = await supabase
        .from('products')
        .select('*, seller:users(id, full_name, email)')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return res.status(200).json({ success: true, data });
    }

    // POST - Tambah produk
    if (req.method === 'POST') {
      const { 
        name, description, price, stock, category, 
        images, seller_id, weight, dimensions 
      } = req.body;
      
      if (!name || !price || !seller_id) {
        return res.status(400).json({ 
          success: false, 
          error: 'Name, price, and seller_id required' 
        });
      }
      
      const { data, error } = await supabase
        .from('products')
        .insert([{ 
          name, 
          description: description || '', 
          price: parseFloat(price), 
          stock: stock || 0, 
          category: category || 'uncategorized',
          images: images || [],
          seller_id,
          weight: weight || 0,
          dimensions: dimensions || {},
          status: 'active'
        }])
        .select();
      
      if (error) throw error;
      return res.status(201).json({ success: true, data });
    }

    // PUT - Update produk
    if (req.method === 'PUT') {
      const { id } = req.query;
      const updates = req.body;
      
      delete updates.id;
      delete updates.created_at;
      delete updates.seller;
      
      const { data, error } = await supabase
        .from('products')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Product not found' 
        });
      }
      
      return res.status(200).json({ success: true, data });
    }

    // DELETE - Hapus produk (soft delete)
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      const { data, error } = await supabase
        .from('products')
        .update({ 
          status: 'inactive', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Product not found' 
        });
      }
      
      return res.status(200).json({ 
        success: true, 
        message: 'Product deleted successfully',
        data 
      });
    }

    res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
}
