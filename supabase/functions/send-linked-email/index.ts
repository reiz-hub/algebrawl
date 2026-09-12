// supabase/functions/send-linked-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.10";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Gmail SMTP Credentials
const GMAIL_USER = Deno.env.get("GMAIL_USER") || "rizzabombate@gmail.com";
const GMAIL_PASS = (Deno.env.get("GMAIL_PASS") || "yhha xnca woex glut").replace(/\s+/g, "");

// Resend Fallback (Optional)
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";

// Configure Nodemailer transporter for Gmail SMTP (SSL Port 465)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // SSL
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_PASS,
  },
});

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, username } = await req.json();
    if (!to || typeof to !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'to' email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const playerUsername = username || "Brawler";

    // Neo-brutalist / game themed HTML email
    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Linked Successfully</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #fff9f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fff9f0; padding: 40px 10px;">
          <tr>
            <td align="center">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #ffffff; border: 3px solid #1a1008; border-radius: 16px; box-shadow: 6px 6px 0px #1a1008; overflow: hidden;">
                
                <!-- Header Banner -->
                <tr>
                  <td style="background-color: #f5a623; padding: 24px; text-align: center; border-bottom: 3px solid #1a1008;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 900; color: #1a1008; letter-spacing: 2px;">
                      ⚔️ ALGEBRAWLS
                    </h1>
                    <p style="margin: 4px 0 0 0; font-size: 12px; font-weight: 800; color: #1a1008; letter-spacing: 1px; text-transform: uppercase;">
                      Account Security Notification
                    </p>
                  </td>
                </tr>

                <!-- Content Area -->
                <tr>
                  <td style="padding: 32px 28px;">
                    <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 900; color: #1a1008;">
                      Hey, ${playerUsername}! 🎉
                    </h2>
                    <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 24px; color: #5a4a35;">
                      Your Algebrawls game account has been successfully linked to this Gmail address:
                    </p>

                    <!-- Email Badge -->
                    <div style="background-color: #f0fdf4; border: 2px solid #22c55e; border-radius: 10px; padding: 14px; text-align: center; margin-bottom: 24px;">
                      <span style="font-size: 16px; font-weight: 800; color: #16a34a; word-break: break-all;">
                        ✓ ${to}
                      </span>
                    </div>

                    <!-- Feature Box -->
                    <div style="background-color: #fff9f0; border: 2px solid #1a1008; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
                      <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 900; color: #1a1008; text-transform: uppercase;">
                        What you can do now:
                      </h3>
                      <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 22px; color: #7a6a55;">
                        <li style="margin-bottom: 6px;"><b>Play Anywhere:</b> Log in across any device using either your Username (<b>${playerUsername}</b>) or this Gmail address.</li>
                        <li style="margin-bottom: 6px;"><b>Cloud Protected:</b> Your unlocked levels, trophies, coins, and equipment are backed up safely.</li>
                        <li><b>Ranked Battles:</b> You are eligible for competitive Ranked Matchmaking!</li>
                      </ul>
                    </div>

                    <!-- Security Notice -->
                    <p style="margin: 0; font-size: 12px; line-height: 18px; color: #a1907d;">
                      If you did not link this email or believe this was done by mistake, please reset your password or contact support immediately.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #fffbf2; padding: 16px 24px; border-top: 2px solid #e5d9c4; text-align: center;">
                    <p style="margin: 0; font-size: 11px; font-weight: 700; color: #a1907d;">
                      Algebrawls • Educational Math Brawler
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
    `;

    // 1. Primary: Send via Gmail SMTP
    try {
      console.log(`[send-linked-email] Dispatching email via Gmail SMTP to: ${to}`);
      const info = await transporter.sendMail({
        from: `"Algebrawls" <${GMAIL_USER}>`,
        to: to,
        subject: "🎉 Algebrawls — Email Successfully Linked!",
        html: htmlContent,
      });

      console.log(`[send-linked-email] Email sent successfully via Gmail SMTP! MessageId: ${info.messageId}`);
      return new Response(
        JSON.stringify({ success: true, id: info.messageId, provider: "gmail-smtp" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (smtpError) {
      console.error("[send-linked-email] Gmail SMTP failed, attempting fallback:", smtpError);

      // 2. Fallback: Resend API (if Gmail fails)
      if (RESEND_API_KEY) {
        const resendResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Algebrawls <onboarding@resend.dev>",
            to: [to],
            subject: "🎉 Algebrawls — Email Successfully Linked!",
            html: htmlContent,
          }),
        });

        const resendData = await resendResponse.json();
        if (resendResponse.ok) {
          console.log(`[send-linked-email] Email sent via Resend fallback! ID: ${resendData.id}`);
          return new Response(
            JSON.stringify({ success: true, id: resendData.id, provider: "resend" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      throw smtpError;
    }
  } catch (error: any) {
    console.error("[send-linked-email] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
