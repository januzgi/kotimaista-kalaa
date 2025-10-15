/**
 * Edge Function: send-signup-confirmation
 *
 * Purpose: Sends custom signup confirmation emails to new users via Brevo.
 *
 * Features:
 * - Triggered automatically when new users sign up
 * - Generates secure signup verification links using Supabase Admin API
 * - Sends branded confirmation emails via Brevo
 * - Professional HTML email formatting
 * - Comprehensive error handling and logging
 *
 * Request Body:
 * - email: string - New user's email address
 * - id: string - New user's ID from auth.users
 *
 * Returns:
 * - Success: {success: true, message: string}
 * - Error: {error: string}
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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
    // Parse request body
    const { email, id } = await req.json();
    console.log("Sending signup confirmation for user:", {
      email,
      id,
    });
    if (!email || !id) {
      return new Response(
        JSON.stringify({
          error: "Email and user ID are required",
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
    // Use the SITE_URL environment variable for redirects.
    // This allows you to set different URLs for production, development, and local environments.
    // Fallback to localhost:8080 for local development.
    const siteUrl = Deno.env.get("SITE_URL") ?? "http://localhost:8080";
    // Generate secure signup verification link
    const { data: linkData, error: linkError } =
      await supabaseClient.auth.admin.generateLink({
        type: "signup",
        email: email,
        options: {
          redirectTo: `${siteUrl}/`,
        },
      });
    if (linkError || !linkData.properties?.action_link) {
      console.error("Error generating signup link:", linkError);
      return new Response(
        JSON.stringify({
          error: "Failed to generate verification link",
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
    const confirmationUrl = linkData.properties.action_link;
    console.log("Generated confirmation URL for user:", email);
    // Email HTML template with confirmation URL
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Vahvista rekisteröitymisesi</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f5f5f5; padding: 30px; border-radius: 10px; text-align: center;">
          <h1 style="color: #000a43; margin-bottom: 20px;">🌊 Tervetuloa mukaan!</h1>
          <p style="font-size: 16px; margin-bottom: 30px;">
            Hienoa saada sinut mukaan Kotimaistakalaa.fi-yhteisöön! Viimeistele rekisteröitymisesi ja vahvista sähköpostiosoitteesi alla olevasta napista.
          </p>
          <a href="${confirmationUrl}"
             style="display: inline-block; background-color: #027bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
            Vahvista sähköposti
          </a>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Terveisin,<br>
            Kotimaistakalaa.fi
          </p>
        </div>
      </body>
      </html>
    `;
    // Send email using Brevo
    const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": Deno.env.get("BREVO_API_KEY") ?? "",
      },
      body: JSON.stringify({
        sender: {
          name: "Kotimaistakalaa.fi",
          email: "noreply@kotimaistakalaa.fi",
        },
        to: [
          {
            email: email,
          },
        ],
        subject: "Vahvista rekisteröitymisesi - Kotimaistakalaa.fi",
        htmlContent: emailHtml,
      }),
    });
    if (!brevoResponse.ok) {
      const errorText = await brevoResponse.text();
      console.error("Brevo email error:", errorText);
      return new Response(
        JSON.stringify({
          error: "Failed to send confirmation email",
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
    console.log("Signup confirmation email sent successfully to:", email);
    return new Response(
      JSON.stringify({
        success: true,
        message: "Signup confirmation email sent successfully",
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
    console.error("Unexpected error in send-signup-confirmation:", error);
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
