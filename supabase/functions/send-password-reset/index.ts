/**
 * Edge Function: send-password-reset
 *
 * Purpose: Sends password reset emails to users via Brevo with secure recovery links.
 *
 * Features:
 * - Invokable function for frontend password reset requests
 * - Generates secure password recovery links using Supabase Admin API
 * - Sends branded password reset emails via Brevo
 * - Professional HTML email formatting with recovery instructions
 * - Comprehensive error handling and validation
 * - Redirects to custom password change page based on environment
 *
 * Request Body:
 * - email: string - User's email address for password reset
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
    const { email } = await req.json();
    console.log("Processing password reset request for email:", email);
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
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({
          error: "Invalid email format",
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
    const redirectUrl = `${siteUrl}/vaihda-salasana`;
    // Generate secure password recovery link
    const { data: linkData, error: linkError } =
      await supabaseClient.auth.admin.generateLink({
        type: "recovery",
        email: email,
        options: {
          redirectTo: redirectUrl,
        },
      });
    if (linkError || !linkData.properties?.action_link) {
      console.error("Error generating recovery link:", linkError);
      return new Response(
        JSON.stringify({
          error: "Failed to generate password reset link",
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
    console.log("Generated recovery URL for user:", email);
    // Email HTML template with recovery URL
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nollaa salasanasi</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f5f5f5; padding: 30px; border-radius: 10px; text-align: center;">
          <h1 style="color: #000a43; margin-bottom: 20px;">🔑 Nollaa salasanasi</h1>
          <p style="font-size: 16px; margin-bottom: 30px;">
            Saimme pyynnön salasanasi nollaamiseksi. Klikkaa alla olevaa nappia asettaaksesi uuden salasanan. Linkki on voimassa tunnin.
          </p>
          <a href="${confirmationUrl}"
             style="display: inline-block; background-color: #027bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
            Aseta uusi salasana
          </a>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Jos et tehnyt tätä pyyntöä, voit jättää tämän viestin huomiotta.
          </p>
          <p style="font-size: 14px; color: #666; margin-top: 10px;">
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
        subject: "Nollaa salasanasi - Kotimaistakalaa.fi",
        htmlContent: emailHtml,
      }),
    });
    if (!brevoResponse.ok) {
      const errorText = await brevoResponse.text();
      console.error("Brevo email error:", errorText);
      return new Response(
        JSON.stringify({
          error: "Failed to send password reset email",
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
    console.log("Password reset email sent successfully to:", email);
    return new Response(
      JSON.stringify({
        success: true,
        message: "Password reset email sent successfully",
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
    console.error("Unexpected error in send-password-reset:", error);
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
