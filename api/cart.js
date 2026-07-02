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
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'user_id required' 
      });
    }

    // GET - Lihat keranjang user
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('carts')
        .select(`
          *,
          product:products(
            id, name, price, images, stock, status,
            seller:users(id, full_name)
          )
        `)
        .eq('user_id', user_id)
        .eq('product.status', 'active');
      
      if (error) throw error;
      
      const total = data?.reduce((sum, item) => {
        return sum + (item.product?.price || 0) * item.quantity;
      }, 0) || 0;
      
      return res.status(200).json({
        success: true,
        data: data || [],
        total: total,
        total_items: data?.length || 0
      });
    }

    // POST - Tambah ke keranjang
    if (req.method === 'POST') {
      const { product_id, quantity = 1 } = req.body;
      
      if (!product_id) {
        return res.status(400).json({ 
          success: false, 
          error: 'product_id required' 
        });
      }

      const { data: existing, error: checkError } = await supabase
        .from('carts')
        .select('*')
        .eq('user_id', user_id)
        .eq('product_id', product_id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      let result;

      if (existing) {
        const newQuantity = existing.quantity + quantity;
        const { data, error } = await supabase
          .from('carts')
          .update({ quantity: newQuantity })
          .eq('id', existing.id)
          .select();
        
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('carts')
          .insert([{ user_id, product_id, quantity }])
          .select();
        
        if (error) throw error;
        result = data;
      }
      
      return res.status(201).json({ 
        success: true, 
        data: result,
        message: 'Product added to cart' 
      });
    }

    // PUT - Update quantity
    if (req.method === 'PUT') {
      const { id } = req.query;
      const { quantity } = req.body;
      
      if (!quantity || quantity < 1) {
        return res.status(400).json({ 
          success: false, 
          error: 'Quantity must be at least 1' 
        });
      }
      
      const { data, error } = await supabase
        .from('carts')
        .update({ quantity })
        .eq('id', id)
        .eq('user_id', user_id)
        .select();
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Cart item not found' 
        });
      }
      
      return res.status(200).json({ success: true, data });
    }

    // DELETE - Hapus dari keranjang
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ 
          success: false, 
          error: 'Cart item id required' 
        });
      }
      
      const { error } = await supabase
        .from('carts')
        .delete()
        .eq('id', id)
        .eq('user_id', user_id);
      
      if (error) throw error;
      
      return res.status(200).json({ 
        success: true, 
        message: 'Item removed from cart' 
      });
    }

    // DELETE - Hapus semua keranjang
    if (req.method === 'DELETE' && req.query.clear === 'true') {
      const { error } = await supabase
        .from('carts')
        .delete()
        .eq('user_id', user_id);
      
      if (error) throw error;
      
      return res.status(200).json({ 
        success: true, 
        message: 'Cart cleared successfully' 
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
