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
    const { user_id, id, status, limit = 20, page = 1 } = req.query;

    // GET - Load orders
    if (req.method === 'GET') {
      let query = supabase
        .from('orders')
        .select(`
          *,
          user:users(id, full_name, email),
          items:order_items(
            *,
            product:products(id, name, price, images)
          )
        `)
        .order('created_at', { ascending: false });

      if (user_id) {
        query = query.eq('user_id', user_id);
      }

      if (status) {
        query = query.eq('status', status);
      }

      if (id) {
        const { data, error } = await query.eq('id', id).single();
        
        if (error) {
          if (error.code === 'PGRST116') {
            return res.status(404).json({ 
              success: false, 
              error: 'Order not found' 
            });
          }
          throw error;
        }
        
        return res.status(200).json({ success: true, data });
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

    // POST - Buat order baru
    if (req.method === 'POST') {
      const { 
        user_id, items, shipping_address, payment_method, 
        notes, shipping_cost = 0, discount = 0 
      } = req.body;
      
      if (!user_id || !items || items.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'user_id and items required' 
        });
      }

      let subtotal = 0;
      for (const item of items) {
        const { data: product, error } = await supabase
          .from('products')
          .select('price, stock')
          .eq('id', item.product_id)
          .single();
        
        if (error) throw error;
        
        if (!product) {
          return res.status(404).json({ 
            success: false, 
            error: `Product ${item.product_id} not found` 
          });
        }
        
        if (product.stock < item.quantity) {
          return res.status(400).json({ 
            success: false, 
            error: `Insufficient stock for product ${item.product_id}` 
          });
        }
        
        subtotal += product.price * item.quantity;
        item.price = product.price;
      }

      const total_amount = subtotal + shipping_cost - discount;

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id,
          total_amount,
          shipping_cost,
          discount,
          shipping_address: shipping_address || '',
          payment_method: payment_method || 'pending',
          notes: notes || '',
          status: 'pending'
        }])
        .select();
      
      if (orderError) throw orderError;

      const order = orderData[0];

      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) throw itemsError;

      for (const item of items) {
        const { data: product } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.product_id)
          .single();
        
        if (product) {
          await supabase
            .from('products')
            .update({ 
              stock: product.stock - item.quantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.product_id);
        }
      }

      if (req.body.clear_cart !== false) {
        await supabase
          .from('carts')
          .delete()
          .eq('user_id', user_id);
      }

      return res.status(201).json({ 
        success: true, 
        data: order,
        message: 'Order created successfully' 
      });
    }

    // PUT - Update status order
    if (req.method === 'PUT') {
      const { id } = req.query;
      const { status, tracking_number, shipping_address } = req.body;
      
      if (!id) {
        return res.status(400).json({ 
          success: false, 
          error: 'Order ID required' 
        });
      }

      const updates = {
        updated_at: new Date().toISOString()
      };

      if (status) updates.status = status;
      if (tracking_number) updates.tracking_number = tracking_number;
      if (shipping_address) updates.shipping_address = shipping_address;

      if (status === 'shipped') {
        updates.shipped_at = new Date().toISOString();
      }

      if (status === 'delivered') {
        updates.delivered_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Order not found' 
        });
      }
      
      return res.status(200).json({ 
        success: true, 
        data,
        message: `Order status updated to ${status}` 
      });
    }

    // DELETE - Hapus order (hanya jika pending)
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ 
          success: false, 
          error: 'Order ID required' 
        });
      }

      const { data: order, error: checkError } = await supabase
        .from('orders')
        .select('status')
        .eq('id', id)
        .single();
      
      if (checkError) throw checkError;
      
      if (!order) {
        return res.status(404).json({ 
          success: false, 
          error: 'Order not found' 
        });
      }

      if (order.status !== 'pending') {
        return res.status(400).json({ 
          success: false, 
          error: 'Can only delete pending orders' 
        });
      }

      await supabase
        .from('order_items')
        .delete()
        .eq('order_id', id);

      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return res.status(200).json({ 
        success: true, 
        message: 'Order deleted successfully' 
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
