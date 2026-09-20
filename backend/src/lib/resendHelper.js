// Resend Email Integration Helper for AdhikarAI
// Handles sending transactional emails (Email OTPs) via Resend REST API.
// Safely falls back to mock/offline logging when RESEND_API_KEY is not configured.

export async function sendEmail({ to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "AdhikarAI <onboarding@resend.dev>";

  // Safe mock / offline behavior when key is absent or in mock mode
  if (!apiKey || process.env.USE_MOCK_RESEND === "true") {
    console.log(`[Resend Mock] To: ${to} | Subject: ${subject}`);
    console.log(`[Resend Mock] Content: ${text || html}`);
    return {
      success: true,
      messageId: `mock-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      mock: true,
    };
  }

  try {
    const payload = {
      from: fromEmail,
      to: Array.isArray(to) ? to : [to],
      subject,
      ...(html ? { html } : {}),
      ...(text ? { text } : {}),
    };

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const errorMessage = errorData.message || res.statusText;
      console.error(`[Resend Error] ${res.status}: ${errorMessage}`);
      throw new Error(`Failed to send email via Resend: ${errorMessage}`);
    }

    const data = await res.json();
    return {
      success: true,
      messageId: data.id,
      mock: false,
    };
  } catch (err) {
    console.error("[Resend Helper Error]", err);
    throw err;
  }
}

/**
 * Sends a 6-digit OTP email for account verification or password reset.
 */
export async function sendOtpEmail({ to, otp, purpose = "SIGNUP", name = "" }) {
  const isReset = purpose === "RESET_PASSWORD";
  const title = isReset ? "Reset Your AdhikarAI Password" : "Verify Your AdhikarAI Account";
  const greeting = name ? `Hello ${name},` : "Hello,";
  const actionText = isReset
    ? "Use the following 6-digit verification code to reset your password:"
    : "Use the following 6-digit verification code to verify your AdhikarAI account:";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F9FA; color: #1F2937; margin: 0; padding: 24px; }
          .container { max-width: 480px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E5E7EB; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.04); }
          .brand { font-size: 20px; font-weight: 800; color: #111827; letter-spacing: -0.5px; margin-bottom: 20px; }
          .brand-badge { display: inline-block; background: #111827; color: #FFFFFF; width: 28px; height: 28px; line-height: 28px; text-align: center; border-radius: 8px; font-size: 14px; margin-right: 8px; }
          .otp-box { margin: 24px 0; background: #F3F4F6; border-radius: 12px; padding: 18px; text-align: center; }
          .otp-code { font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #111827; font-family: monospace; }
          .expiry-note { font-size: 13px; color: #6B7280; margin-top: 8px; }
          .footer { margin-top: 32px; border-top: 1px solid #E5E7EB; padding-top: 16px; font-size: 12px; color: #9CA3AF; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="brand">
            <span class="brand-badge">A</span> AdhikarAI
          </div>
          <h2 style="margin: 0 0 12px; font-size: 18px; font-weight: 700;">${title}</h2>
          <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.5; color: #374151;">${greeting}</p>
          <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.5; color: #374151;">${actionText}</p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
            <div class="expiry-note">This code expires in 5 minutes. Do not share it with anyone.</div>
          </div>
          <p style="margin: 0 0 8px; font-size: 13px; color: #4B5563;">If you did not make this request, you can safely ignore this email.</p>
          <div class="footer">
            AdhikarAI — Voice-First AI Legal Rights Helper for Indian Citizens
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `${greeting}\n\n${actionText}\n\nOTP Code: ${otp}\n\nThis code expires in 5 minutes. Do not share it with anyone.\n\nIf you did not make this request, please ignore this email.`;

  return sendEmail({
    to,
    subject: `[AdhikarAI] ${isReset ? "Password Reset" : "Verification"} Code: ${otp}`,
    html,
    text,
  });
}
