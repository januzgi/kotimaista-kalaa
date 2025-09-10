import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SubscriptionData {
  email: string;
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

    // Parse request body
    const subscriptionData: SubscriptionData = await req.json();
    console.log('Subscription data received:', subscriptionData);

    if (!subscriptionData.email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if email already exists
    const { data: existingSubscription, error: checkError } = await supabaseClient
      .from('email_subscriptions')
      .select('email')
      .eq('email', subscriptionData.email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing subscription:', checkError);
      return new Response(
        JSON.stringify({ error: 'Failed to check subscription status' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // If email already exists, still send success (but don't create duplicate)
    let isNewSubscription = !existingSubscription;

    if (isNewSubscription) {
      // Save email to database
      const { error: insertError } = await supabaseClient
        .from('email_subscriptions')
        .insert([{ email: subscriptionData.email }]);

      if (insertError) {
        console.error('Error saving subscription:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to save subscription' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log('Email subscription saved successfully');
    } else {
      console.log('Email already subscribed, skipping database insert');
    }

    // Send welcome email using Brevo
    const subject = 'Tervetuloa Kotimaista kalaa-postituslistalle! 🐟';
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Tervetuloa postituslistalle</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h1 style="color: #000a43; margin: 0;">Tervetuloa Kotimaista kalaa-postituslistalle! 🐟</h1>
        </div>

        <div style="background: #fff; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p>Hei ystävä,</p>
          
          <p>Lämmin kiitos, että liityit postituslistallemme! Tästä hetkestä eteenpäin saat tuoreimmat saalisilmoituksemme suoraan järveltä omaan sähköpostiisi.</p>
          
          <div style="background: #e3f2fd; border-left: 4px solid #027bff; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #1565c0;"><strong>✨ Varmistathan, että viestimme tavoittavat sinut eivätkä eksy roskapostiin lisäämällä meidät yhteystietoihin tai VIP lähettäjiin:</strong></p>
          </div>
          
          <div style="margin: 20px 0;">
            <h3 style="color: #000a43; margin-bottom: 10px;">Gmail</h3>
            <ol style="margin: 0; padding-left: 20px;">
              <li>Avaa tämä viesti Gmailissa.</li>
              <li>Vie kursori lähettäjän nimen päälle viestin yläosassa.</li>
              <li>Valitse "Lisää yhteystietoihin" (Add to contacts).</li>
            </ol>
          </div>
          
          <div style="margin: 20px 0;">
            <h3 style="color: #000a43; margin-bottom: 10px;">Apple Mail</h3>
            <ol style="margin: 0; padding-left: 20px;">
              <li>Avaa tämä viesti Apple Mailissa.</li>
              <li>Napauta lähettäjän nimeä tai sähköpostiosoitetta viestin yläreunassa.</li>
              <li>Valitse "Lisää VIP-lähettäjiin" (Add to VIP).</li>
            </ol>
          </div>
          
          <div style="margin: 20px 0;">
            <h3 style="color: #000a43; margin-bottom: 10px;">Outlook</h3>
            <ol style="margin: 0; padding-left: 20px;">
              <li>Avaa tämä viesti Outlookissa.</li>
              <li>Mene asetuksiin: Mail → Roskaposti (Junk email).</li>
              <li>Lisää osoitteemme <strong>noreply@kotimaistakalaa.fi</strong> kohtaan "Turvalliset lähettäjät" (Safe Senders).</li>
            </ol>
          </div>
          
          <p>Sen jälkeen viestimme näkyvät kirkkaasti ja esteettä, VIP-luettelossa Apple Mailissa ja luotettujen lähettäjien joukossa Gmailissa ja Outlookissa.</p>
          
          <p>Kiitos ja nähdään saaliiden rantauduttua!</p>
        </div>

        <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
        <p style="text-align: center; color: #666; font-size: 14px;">
          <strong>Kotimaistakalaa</strong><br>
          Tuoreita kaloja suoraan järveltä
        </p>
      </body>
      </html>
    `;

    // Send welcome email using Brevo
    try {
      const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': Deno.env.get('BREVO_API_KEY') ?? '',
        },
        body: JSON.stringify({
          sender: {
            name: 'Kotimaista kalaa -tiimi',
            email: 'suorantacoding@gmail.com'
          },
          to: [{
            email: subscriptionData.email,
            name: 'Kalaharrastaja'
          }],
          subject: subject,
          htmlContent: emailHtml
        })
      });

      if (!brevoResponse.ok) {
        const errorDetails = await brevoResponse.text();
        console.error('Failed to send welcome email:', errorDetails);
        return new Response(
          JSON.stringify({ error: 'Failed to send welcome email' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } else {
        console.log('Welcome email sent successfully');
      }
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      return new Response(
        JSON.stringify({ error: 'Failed to send welcome email' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: isNewSubscription ? 'Subscription created and welcome email sent' : 'Welcome email sent to existing subscriber'
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