/**
 * Edge Function: create-order
 *
 * Purpose: Creates a new order from cart items with inventory validation and notifications.
 *
 * Features:
 * - User authentication verification
 * - Real-time inventory checking to prevent overselling
 * - Atomic order creation with cart items
 * - Inventory quantity updates
 * - Email notifications to fishermen about new orders
 * - Sold-out item handling with detailed error responses
 * - Transaction-like error handling with rollback attempts
 *
 * Request Body:
 * - cartItems: Array of {productId, quantity} objects
 * - customerName: Customer's full name
 * - customerPhone: Customer's phone number
 * - customerAddress?: Delivery address (required for delivery orders)
 * - fulfillmentType: 'PICKUP' or 'DELIVERY'
 * - fulfillmentSlotId: Selected time slot ID or NULL
 *
 * Returns:
 * - Success: {success: true, orderId: string, message: string}
 * - Sold out: {error: 'Items sold out', soldOutItems: string[], soldOutProductIds: string[]}
 * - Other errors: {error: string}
 */ import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }
  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    // Verify user authentication
    const { data: userData, error: userError } =
      await supabaseClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userError || !userData.user) {
      console.error("Authentication failed:", userError);
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    const userId = userData.user.id;
    console.log("Processing order for user:", userId);
    // Parse request body
    const orderData = await req.json();
    console.log("Order data received:", orderData);
    if (!orderData.cartItems || orderData.cartItems.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Cart is empty",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    // Start transaction by checking inventory first
    const productIds = orderData.cartItems.map((item) => item.productId);
    // Fetch current product quantities and details
    const { data: products, error: productsError } = await supabaseClient
      .from("products")
      .select(
        `
        id,
        species,
        form,
        price_per_kg,
        available_quantity,
        fisherman_profile:fisherman_profiles(
          id,
          default_delivery_fee,
          user_id
        )
      `
      )
      .in("id", productIds);
    if (productsError) {
      console.error("Error fetching products:", productsError);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch products",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    if (!products || products.length !== orderData.cartItems.length) {
      console.error("Some products not found");
      return new Response(
        JSON.stringify({
          error: "Some products not found",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    // Check inventory for each item
    const soldOutItems = [];
    const validItems = [];
    for (const cartItem of orderData.cartItems) {
      const product = products.find((p) => p.id === cartItem.productId);
      if (!product) {
        continue;
      }
      if (product.available_quantity < cartItem.quantity) {
        soldOutItems.push(`${product.species} (${product.form})`);
      } else {
        validItems.push({
          product,
          requestedQuantity: cartItem.quantity,
        });
      }
    }
    // If any items are sold out, return error
    if (soldOutItems.length > 0) {
      console.log("Items sold out:", soldOutItems);
      const soldOutProductIds = orderData.cartItems
        .filter((item) => {
          const product = products.find((p) => p.id === item.productId);
          return product && product.available_quantity < item.quantity;
        })
        .map((item) => item.productId);
      return new Response(
        JSON.stringify({
          error: "Items sold out",
          soldOutItems,
          soldOutProductIds,
        }),
        {
          status: 409,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    // Calculate delivery fee
    const firstProduct = validItems[0].product;
    const deliveryFee =
      orderData.fulfillmentType === "DELIVERY"
        ? firstProduct.fisherman_profile.default_delivery_fee
        : 0;
    // All items are available, proceed with transaction
    console.log("All items available, creating order...");
    // Create the order
    const { data: orderResult, error: orderError } = await supabaseClient
      .from("orders")
      .insert({
        customer_id: userId,
        customer_name: orderData.customerName,
        customer_phone: orderData.customerPhone,
        customer_address: orderData.customerAddress,
        fulfillment_type: orderData.fulfillmentType,
        fulfillment_slot_id: orderData.fulfillmentSlotId,
        final_delivery_fee: deliveryFee,
        fisherman_profile_id: firstProduct.fisherman_profile.id,
        status: "NEW",
      })
      .select()
      .single();
    if (orderError) {
      console.error("Error creating order:", orderError);
      return new Response(
        JSON.stringify({
          error: "Failed to create order",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    console.log("Order created:", orderResult.id);
    // Create order items
    const orderItems = validItems.map((item) => ({
      order_id: orderResult.id,
      product_id: item.product.id,
      quantity: item.requestedQuantity,
    }));
    const { error: orderItemsError } = await supabaseClient
      .from("order_items")
      .insert(orderItems);
    if (orderItemsError) {
      console.error("Error creating order items:", orderItemsError);
      await supabaseClient.from("orders").delete().eq("id", orderResult.id);
      return new Response(
        JSON.stringify({
          error: "Failed to create order items",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    // Update product quantities
    for (const item of validItems) {
      const newQuantity =
        item.product.available_quantity - item.requestedQuantity;
      const { error: updateError } = await supabaseClient
        .from("products")
        .update({
          available_quantity: newQuantity,
        })
        .eq("id", item.product.id);
      if (updateError) {
        console.error("Error updating product quantity:", updateError);
        return new Response(
          JSON.stringify({
            error: "Failed to update inventory",
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }
    }
    console.log("Order processing completed successfully");
    // ✨ --- Start of updated email logic --- ✨
    try {
      // Get fisherman email
      const { data: fishermanUser, error: fishermanError } =
        await supabaseClient.auth.admin.getUserById(
          firstProduct.fisherman_profile.user_id
        );
      if (!fishermanError && fishermanUser.user) {
        const itemsList = validItems
          .map(
            (item) =>
              `${item.product.species} (${item.product.form}) - ${item.requestedQuantity} kg`
          )
          .join("\n");
        let fulfillmentDetailsHtml = "";
        if (orderData.fulfillmentSlotId) {
          const { data: slotData, error: slotError } = await supabaseClient
            .from("fulfillment_slots")
            .select("start_time, end_time")
            .eq("id", orderData.fulfillmentSlotId)
            .single();
          if (!slotError && slotData) {
            const startTime = new Date(slotData.start_time).toLocaleTimeString(
              "fi-FI",
              {
                hour: "2-digit",
                minute: "2-digit",
              }
            );
            const endTime = new Date(slotData.end_time).toLocaleTimeString(
              "fi-FI",
              {
                hour: "2-digit",
                minute: "2-digit",
              }
            );
            const startDate = new Date(slotData.start_time).toLocaleDateString(
              "fi-FI"
            );
            fulfillmentDetailsHtml = `<p><strong>Toimitusaika:</strong> ${startDate} klo ${startTime} - ${endTime}</p>`;
          }
        } else {
          fulfillmentDetailsHtml = `<p><strong>Toimitusaika:</strong> <span style="color: #dc3545; font-weight: bold;">Sovittava erikseen asiakkaan kanssa.</span></p>`;
        }
        const subject = `Uusi tilaus saapunut! (Tilaus #${orderResult.id.slice(
          0,
          8
        )})`;

        const siteUrl =
          Deno.env.get("SITE_URL") ?? "https://kotimaistakalaa.fi";
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Uusi tilaus</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h1 style="color: #000a43; margin: 0;">Uusi tilaus saapunut!</h1>
              <p style="margin: 10px 0 0 0; color: #666;">Tilaus #${orderResult.id.slice(
                0,
                8
              )}</p>
            </div>
            <div style="background: #fff; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h2 style="color: #000a43; margin-top: 0;">Asiakkaan tiedot</h2>
              <p><strong>Nimi:</strong> ${orderData.customerName}</p>
              <p><strong>Puhelin:</strong> ${orderData.customerPhone}</p>
              ${
                orderData.customerAddress
                  ? `<p><strong>Osoite:</strong> ${orderData.customerAddress}</p>`
                  : ""
              }
              <h3 style="color: #000a43;">Tilatut tuotteet</h3>
              <pre style="background: #f8f9fa; padding: 15px; border-radius: 4px; white-space: pre-wrap;">${itemsList}</pre>
              <p><strong>Toimitustapa:</strong> ${
                orderData.fulfillmentType === "PICKUP"
                  ? "Nouto"
                  : "Kotiinkuljetus"
              }</p>
              ${
                deliveryFee > 0
                  ? `<p><strong>Toimitusmaksu:</strong> ${deliveryFee.toFixed(
                      2
                    )} €</p>`
                  : ""
              }
              ${fulfillmentDetailsHtml}
            </div>
            <div style="background: #e3f2fd; border-left: 4px solid #027bff; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #1565c0;"><strong>Toimenpide:</strong> Kirjaudu ylläpitoon vahvistaaksesi tilauksen ja lähettääksesi asiakkaalle lopulliset tiedot.</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${siteUrl}/yllapito" 
                 style="background: #027bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Siirry ylläpitoon
              </a>
            </div>
            <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
            <p style="text-align: center; color: #666; font-size: 14px;">
              <strong>© Kotimaista kalaa</strong><br>
              <i>Tuoretta kalaa suoraan kalastajalta</i>
            </p>
          </body>
          </html>
        `;
        const brevoResponse = await fetch(
          "https://api.brevo.com/v3/smtp/email",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "api-key": Deno.env.get("BREVO_API_KEY") ?? "",
            },
            body: JSON.stringify({
              sender: {
                name: "Kotimaista kalaa -järjestelmä",
                email: "suorantacoding@gmail.com",
              },
              to: [
                {
                  email: fishermanUser.user.email,
                  name:
                    fishermanUser.user.user_metadata?.full_name || "Kalastaja",
                },
              ],
              subject: subject,
              htmlContent: emailHtml,
            }),
          }
        );
        if (!brevoResponse.ok) {
          console.error("Failed to send fisherman notification email");
        } else {
          console.log("Fisherman notification email sent successfully");
        }
      }
    } catch (emailError) {
      console.error("Error sending fisherman notification email:", emailError);
    }
    // ✨ --- End of updated email logic --- ✨
    return new Response(
      JSON.stringify({
        success: true,
        orderId: orderResult.id,
        message: "Order created successfully",
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
