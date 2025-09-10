import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
Deno.serve(async (req) => {
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
    const { email } = await req.json();
    if (!email) {
      return new Response(
        JSON.stringify({
          error: "Email is required",
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
    // Use .maybeSingle() which is cleaner for checking existence.
    // It returns { data: null } if not found, instead of an error.
    const { data: existingSubscription, error: checkError } =
      await supabaseClient
        .from("email_subscriptions")
        .select("email")
        .eq("email", email)
        .maybeSingle();
    if (checkError) {
      throw checkError;
    }
    // If the user is NOT new, we can return a success message early.
    if (existingSubscription) {
      console.log("Email already subscribed, skipping actions.");
      return new Response(
        JSON.stringify({
          success: true,
          message: "Already subscribed",
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    // --- If we reach this point, the user is NEW ---
    // 1. Save the new email to the database
    const { error: insertError } = await supabaseClient
      .from("email_subscriptions")
      .insert([
        {
          email: email,
        },
      ]);
    if (insertError) {
      throw insertError;
    }
    console.log("Email subscription saved successfully");
    // 2. Send the welcome email
    try {
      const subject = "Tervetuloa Kotimaista kalaa-postituslistalle! 🐟";
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
          <strong>© Kotimaista kalaa</strong><br>
          <i>Tuoretta kalaa suoraan kalastajalta</i>
        </p>
      </body>
      </html>
    `;
      const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": Deno.env.get("BREVO_API_KEY") ?? "",
        },
        body: JSON.stringify({
          sender: {
            name: "Kotimaista kalaa -tiimi",
            email: "suorantacoding@gmail.com",
          },
          to: [
            {
              email: email,
            },
          ],
          subject: subject,
          htmlContent: emailHtml,
        }),
      });
      if (!brevoResponse.ok) {
        const errorDetails = await brevoResponse.text();
        console.error("Failed to send welcome email:", errorDetails);
        // Don't fail the whole request, just log the error
      } else {
        console.log("Welcome email sent successfully");
      }
    } catch (emailError) {
      console.error("Error sending welcome email:", emailError);
      // Also don't fail the request if the email part fails
    }
    return new Response(
      JSON.stringify({
        success: true,
        message: "Subscription created and welcome email sent",
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
