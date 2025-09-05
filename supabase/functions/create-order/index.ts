import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CartItem {
  productId: string;
  quantity: number;
}

interface OrderData {
  cartItems: CartItem[];
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  fulfillmentType: 'PICKUP' | 'DELIVERY';
  fulfillmentSlotId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify user authentication
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !userData.user) {
      console.error('Authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const userId = userData.user.id;
    console.log('Processing order for user:', userId);

    // Parse request body
    const orderData: OrderData = await req.json();
    console.log('Order data received:', orderData);

    if (!orderData.cartItems || orderData.cartItems.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Cart is empty' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Start transaction by checking inventory first
    const productIds = orderData.cartItems.map(item => item.productId);
    
    // Fetch current product quantities and details
    const { data: products, error: productsError } = await supabaseClient
      .from('products')
      .select(`
        id,
        species,
        form,
        price_per_kg,
        available_quantity,
        fisherman_profile:fisherman_profiles(
          id,
          default_delivery_fee
        )
      `)
      .in('id', productIds);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch products' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!products || products.length !== orderData.cartItems.length) {
      console.error('Some products not found');
      return new Response(
        JSON.stringify({ error: 'Some products not found' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check inventory for each item
    const soldOutItems: string[] = [];
    const validItems: { product: any; requestedQuantity: number }[] = [];

    for (const cartItem of orderData.cartItems) {
      const product = products.find(p => p.id === cartItem.productId);
      if (!product) {
        continue;
      }

      if (product.available_quantity < cartItem.quantity) {
        soldOutItems.push(`${product.species} (${product.form})`);
      } else {
        validItems.push({
          product,
          requestedQuantity: cartItem.quantity
        });
      }
    }

    // If any items are sold out, return error
    if (soldOutItems.length > 0) {
      console.log('Items sold out:', soldOutItems);
      return new Response(
        JSON.stringify({ 
          error: 'Items sold out',
          soldOutItems,
          soldOutProductIds: orderData.cartItems
            .filter(item => {
              const product = products.find(p => p.id === item.productId);
              return product && product.available_quantity < item.quantity;
            })
            .map(item => item.productId)
        }),
        { 
          status: 409, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Calculate delivery fee
    const firstProduct = validItems[0].product;
    const deliveryFee = orderData.fulfillmentType === 'DELIVERY' 
      ? firstProduct.fisherman_profile.default_delivery_fee 
      : 0;

    // All items are available, proceed with transaction
    console.log('All items available, creating order...');

    // Create the order
    const { data: orderResult, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        customer_id: userId,
        customer_name: orderData.customerName,
        customer_phone: orderData.customerPhone,
        customer_address: orderData.customerAddress,
        fulfillment_type: orderData.fulfillmentType,
        fulfillment_slot_id: orderData.fulfillmentSlotId,
        final_delivery_fee: deliveryFee,
        status: 'NEW'
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return new Response(
        JSON.stringify({ error: 'Failed to create order' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Order created:', orderResult.id);

    // Create order items and update product quantities
    const orderItems = validItems.map(item => ({
      order_id: orderResult.id,
      product_id: item.product.id,
      quantity: item.requestedQuantity
    }));

    const { error: orderItemsError } = await supabaseClient
      .from('order_items')
      .insert(orderItems);

    if (orderItemsError) {
      console.error('Error creating order items:', orderItemsError);
      // Try to clean up the order
      await supabaseClient.from('orders').delete().eq('id', orderResult.id);
      return new Response(
        JSON.stringify({ error: 'Failed to create order items' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Update product quantities
    for (const item of validItems) {
      const newQuantity = item.product.available_quantity - item.requestedQuantity;
      const { error: updateError } = await supabaseClient
        .from('products')
        .update({ available_quantity: newQuantity })
        .eq('id', item.product.id);

      if (updateError) {
        console.error('Error updating product quantity:', updateError);
        // This is a critical error - we should rollback but Supabase doesn't support transactions
        // In a production system, you'd want to use stored procedures for this
        return new Response(
          JSON.stringify({ error: 'Failed to update inventory' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    console.log('Order processing completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        orderId: orderResult.id,
        message: 'Order created successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});