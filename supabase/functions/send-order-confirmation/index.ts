import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OrderConfirmationRequest {
  orderId: string;
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

    // Parse request body
    const { orderId }: OrderConfirmationRequest = await req.json();
    console.log('Sending confirmation for order:', orderId);

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Order ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Fetch complete order details
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select(`
        id,
        customer_name,
        customer_address,
        customer_phone,
        fulfillment_type,
        final_delivery_fee,
        status,
        created_at,
        customer_id,
        fulfillment_slot:fulfillment_slots(
          start_time,
          end_time,
          type
        ),
        order_items(
          id,
          quantity,
          product:products(
            species,
            form,
            price_per_kg,
            fisherman_profile:fisherman_profiles(
              pickup_address,
              public_phone_number
            )
          )
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Error fetching order:', orderError);
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get customer email
    const { data: customerData, error: customerError } = await supabaseClient.auth.admin.getUserById(order.customer_id);

    if (customerError || !customerData.user) {
      console.error('Error fetching customer:', customerError);
      return new Response(
        JSON.stringify({ error: 'Customer not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Calculate order total
    const itemsTotal = order.order_items.reduce((sum: number, item: any) => {
      return sum + (item.quantity * item.product.price_per_kg);
    }, 0);
    const deliveryFee = order.fulfillment_type === 'DELIVERY' ? (order.final_delivery_fee || 0) : 0;
    const totalPrice = itemsTotal + deliveryFee;

    // Format date and time
    const fulfillmentDate = new Date(order.fulfillment_slot.start_time);
    const startTime = fulfillmentDate.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });
    const endTime = new Date(order.fulfillment_slot.end_time).toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });
    const dateStr = fulfillmentDate.toLocaleDateString('fi-FI');

    // Get fisherman info
    const fishermanProfile = order.order_items[0]?.product?.fisherman_profile || {};

    // Create email content
    const subject = `Tilauksesi on vahvistettu! (Tilaus #${order.id.slice(0, 8)})`;
    
    const itemsHtml = order.order_items.map((item: any) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.product.species} (${item.product.form})</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.quantity} kg</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.product.price_per_kg.toFixed(2)} €/kg</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;"><strong>${(item.quantity * item.product.price_per_kg).toFixed(2)} €</strong></td>
      </tr>
    `).join('');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Tilaus vahvistettu</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h1 style="color: #000a43; margin: 0;">Tilauksesi on vahvistettu!</h1>
          <p style="margin: 10px 0 0 0; color: #666;">Tilaus #${order.id.slice(0, 8)}</p>
        </div>

        <p>Hei ${order.customer_name},</p>
        
        <p>Kiitos tilauksestasi! Tilauksesi on nyt vahvistettu ja odottaa ${order.fulfillment_type === 'PICKUP' ? 'noutoa' : 'toimitusta'}.</p>

        <div style="background: #fff; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h2 style="color: #000a43; margin-top: 0;">Tilauksen tiedot</h2>
          
          <table style="width: 100%; margin-bottom: 20px;">
            <thead>
              <tr style="background: #f8f9fa;">
                <th style="padding: 12px 8px; text-align: left; border-bottom: 2px solid #dee2e6;">Tuote</th>
                <th style="padding: 12px 8px; text-align: right; border-bottom: 2px solid #dee2e6;">Määrä</th>
                <th style="padding: 12px 8px; text-align: right; border-bottom: 2px solid #dee2e6;">Hinta/kg</th>
                <th style="padding: 12px 8px; text-align: right; border-bottom: 2px solid #dee2e6;">Yhteensä</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              ${order.fulfillment_type === 'DELIVERY' ? `
              <tr>
                <td colspan="3" style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Toimitusmaksu</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${deliveryFee.toFixed(2)} €</td>
              </tr>
              ` : ''}
              <tr style="background: #f8f9fa;">
                <td colspan="3" style="padding: 12px 8px; font-weight: bold; font-size: 16px;">Kokonaissumma</td>
                <td style="padding: 12px 8px; text-align: right; font-weight: bold; font-size: 16px; color: #000a43;">${totalPrice.toFixed(2)} €</td>
              </tr>
            </tbody>
          </table>

          <h3 style="color: #000a43; margin-bottom: 10px;">${order.fulfillment_type === 'PICKUP' ? 'Nouto' : 'Toimitus'}tiedot</h3>
          <p><strong>Päivämäärä:</strong> ${dateStr}</p>
          <p><strong>Aika:</strong> ${startTime} - ${endTime}</p>
          ${order.fulfillment_type === 'PICKUP' ? `
            <p><strong>Noutopaikka:</strong> ${fishermanProfile.pickup_address || 'Tiedot toimitetaan erikseen'}</p>
          ` : `
            <p><strong>Toimitusosoite:</strong> ${order.customer_address}</p>
          `}
          
          ${fishermanProfile.public_phone_number ? `
            <p><strong>Kalastajan puhelin:</strong> ${fishermanProfile.public_phone_number}</p>
          ` : ''}
        </div>

        <div style="background: #e3f2fd; border-left: 4px solid #027bff; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #1565c0;"><strong>Tärkeää:</strong> Maksu suoritetaan paikan päällä ${order.fulfillment_type === 'PICKUP' ? 'noudettaessa' : 'toimituksen yhteydessä'}. Otathan mukaan käteistä tai varmista, että mobiilimaksu on mahdollista.</p>
        </div>

        <p>Jos sinulla on kysyttävää tilauksestasi, ota yhteyttä suoraan kalastajaan${fishermanProfile.public_phone_number ? ` numeroon ${fishermanProfile.public_phone_number}` : ''}.</p>

        <p>Kiitos, että tuet paikallista kalastusta!</p>

        <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
        <p style="text-align: center; color: #666; font-size: 14px;">
          <strong>Kotimaistakalaa</strong><br>
          Tuoretta kalaa suoraan kalastajalta
        </p>
      </body>
      </html>
    `;

    // Send email using Brevo
    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': Deno.env.get('BREVO_API_KEY') ?? '',
      },
      body: JSON.stringify({
        sender: {
          name: 'Kotimaistakalaa',
          email: 'noreply@kotimaistakalaa.fi'
        },
        to: [{
          email: customerData.user.email,
          name: order.customer_name
        }],
        subject: subject,
        htmlContent: emailHtml
      })
    });

    if (!brevoResponse.ok) {
      const errorText = await brevoResponse.text();
      console.error('Brevo email error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to send confirmation email' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Order confirmation email sent successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Order confirmation email sent successfully'
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