// services/emailService.ts
import { supabase } from './supabase';

const RESEND_API_KEY = process.env.EXPO_PUBLIC_RESEND_API_KEY || '';

/**
 * Generate game-themed HTML for the email confirmation.
 */
function getLinkedEmailHtml(username: string, email: string): string {
  const player = username || 'Brawler';
  return `
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
                    Hey, ${player}! 🎉
                  </h2>
                  <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 24px; color: #5a4a35;">
                    Your Algebrawls game account has been successfully linked to this Gmail address:
                  </p>

                  <!-- Email Badge -->
                  <div style="background-color: #f0fdf4; border: 2px solid #22c55e; border-radius: 10px; padding: 14px; text-align: center; margin-bottom: 24px;">
                    <span style="font-size: 16px; font-weight: 800; color: #16a34a; word-break: break-all;">
                      ✓ ${email}
                    </span>
                  </div>

                  <!-- Feature Box -->
                  <div style="background-color: #fff9f0; border: 2px solid #1a1008; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
                    <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 900; color: #1a1008; text-transform: uppercase;">
                      What you can do now:
                    </h3>
                    <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 22px; color: #7a6a55;">
                      <li style="margin-bottom: 6px;"><b>Play Anywhere:</b> Log in across any device using either your Username (<b>${player}</b>) or this Gmail address.</li>
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
}

/**
 * Send an email notification to the player when their Gmail is linked.
 * Attempts Supabase Edge Function first, with direct Resend API fallback.
 * Safely catches all errors so mobile gameplay is never interrupted.
 */
export async function sendEmailLinkedNotification(toEmail: string, username: string): Promise<boolean> {
  // 1. Try Supabase Edge Function first (if deployed)
  try {
    const { data, error } = await supabase.functions.invoke('send-linked-email', {
      body: { to: toEmail, username },
    });

    if (!error && data?.success) {
      console.log('[EmailService] Sent via Supabase Edge Function! ID:', data.id);
      return true;
    }
  } catch (_) {
    // Edge function not deployed or network failed, fallback below
  }

  // 2. Direct Resend API Fallback
  if (!RESEND_API_KEY) {
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Algebrawls <onboarding@resend.dev>',
        to: [toEmail],
        subject: '🎉 Algebrawls — Email Successfully Linked!',
        html: getLinkedEmailHtml(username, toEmail),
      }),
    });

    const result = await response.json();
    if (response.ok) {
      console.log('[EmailService] Sent directly via Resend! ID:', result.id);
      return true;
    } else {
      console.warn('[EmailService] Resend API notice:', result.message || result);
      return false;
    }
  } catch (err) {
    console.warn('[EmailService] Error sending email notification:', err);
    return false;
  }
}
