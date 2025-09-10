/**
 * Edge Function: send-new-catch-notifications
 *
 * Purpose: Sends email notifications to all subscribers when new fish catch is added.
 *
 * Features:
 * - Fetches all email subscribers from database
 * - Sends batch notifications using Brevo SMTP
 * - HTML and text email content
 * - Error handling for individual email failures
 * - Success/failure reporting
 *
 * Triggered automatically when fishermen add new catch to inventory.
 *
 * Returns:
 * - Success: {message: string, successful: number, failed: number, details: array}
 * - Error: {error: string}
 */ import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
const handler = async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }
  try {
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    if (!brevoApiKey) {
      console.error("BREVO_API_KEY not found");
      throw new Error("Email service not configured");
    }
    // Import Supabase client
    const { createClient } = await import(
      "https://esm.sh/@supabase/supabase-js@2.57.0"
    );
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    // Get all email subscribers
    const { data: subscribers, error: subscribersError } = await supabase
      .from("email_subscriptions")
      .select("email");
    if (subscribersError) {
      console.error("Error fetching subscribers:", subscribersError);
      throw new Error("Failed to fetch email subscribers");
    }
    if (!subscribers || subscribers.length === 0) {
      console.log("No email subscribers found");
      return new Response(
        JSON.stringify({
          message: "No subscribers to notify",
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
    console.log(`Found ${subscribers.length} subscribers to notify`);
    // Email content
    const subject = "Uutta kalaa saatavilla! - Kotimaistakalaa.fi";
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Uutta kalaa saatavilla!</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f5f5f5; padding: 30px; border-radius: 10px; text-align: center;">
          <h1 style="color: #000a43; margin-bottom: 20px;">🐟 Uutta kalaa saatavilla!</h1>
          <p style="font-size: 16px; margin-bottom: 30px;">
            Hei, kalastaja on juuri lisännyt uutta saalista myyntiin. Katso saatavilla olevat kalat ja tee tilauksesi!
          </p>
          <a href="https://kotimaistakalaa.fi/saatavilla" 
             style="display: inline-block; background-color: #027bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
            Katso saatavilla olevat kalat
          </a>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Terveisin,<br>
            Kotimaistakalaa.fi
          </p>
        </div>
      </body>
      </html>
    `;
    const textContent = `
      Uutta kalaa saatavilla!
      
      Hei, kalastaja on juuri lisännyt uutta saalista myyntiin. Katso saatavilla olevat kalat ja tee tilauksesi!
      
      Siirry sivulle: https://kotimaistakalaa.fi/saatavilla
      
      Terveisin,
      Kotimaistakalaa.fi
    `;
    // Send emails to all subscribers
    const emailPromises = subscribers.map(async (subscriber) => {
      try {
        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": brevoApiKey,
          },
          body: JSON.stringify({
            sender: {
              name: "Kotimaistakalaa.fi",
              email: "noreply@kotimaistakalaa.fi",
            },
            to: [
              {
                email: subscriber.email,
              },
            ],
            subject: subject,
            htmlContent: htmlContent,
            textContent: textContent,
          }),
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `Failed to send email to ${subscriber.email}:`,
            errorText
          );
          return {
            email: subscriber.email,
            success: false,
            error: errorText,
          };
        }
        console.log(`Email sent successfully to ${subscriber.email}`);
        return {
          email: subscriber.email,
          success: true,
        };
      } catch (error) {
        console.error(`Error sending email to ${subscriber.email}:`, error);
        return {
          email: subscriber.email,
          success: false,
          error: error.message,
        };
      }
    });
    const results = await Promise.all(emailPromises);
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    console.log(
      `Email notifications complete: ${successful} successful, ${failed} failed`
    );
    return new Response(
      JSON.stringify({
        message: "Email notifications sent",
        successful,
        failed,
        details: results,
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
    console.error("Error in send-new-catch-notifications function:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
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
};
serve(handler);
