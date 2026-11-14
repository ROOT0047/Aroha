import nodemailer from "nodemailer";
import { env } from "../config/env";

let transporter: any = null;

function getTransporter(): any {
  if (transporter) return transporter;

  if (env.SMTP_HOST && env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  } else {
    // Development console transport when SMTP is not configured
    transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: "unix",
      buffer: true,
    });
  }

  return transporter;
}

const baseEmailStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background-color: #09090b;
  color: #f4f4f5;
  margin: 0;
  padding: 40px 16px;
`;

const containerStyle = `
  max-width: 540px;
  margin: 0 auto;
  background-color: #121215;
  border: 1px solid #27272a;
  border-radius: 16px;
  padding: 36px 32px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
`;

const headerStyle = `
  text-align: center;
  margin-bottom: 28px;
`;

const logoStyle = `
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.28em;
  color: #ffffff;
  text-transform: uppercase;
  margin: 0;
`;

const footerStyle = `
  margin-top: 36px;
  padding-top: 20px;
  border-top: 1px solid #27272a;
  font-size: 12px;
  color: #71717a;
  text-align: center;
  line-height: 1.5;
`;

export async function sendOtpEmail(params: {
  to: string;
  otp: string;
  displayName?: string;
}): Promise<void> {
  const mailer = getTransporter();
  const greeting = params.displayName ? `Hi ${params.displayName},` : "Hello,";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AROHA Email Verification Code</title>
</head>
<body style="${baseEmailStyle}">
  <div style="${containerStyle}">
    <div style="${headerStyle}">
      <h1 style="${logoStyle}">AROHA</h1>
      <p style="font-size: 13px; color: #a1a1aa; margin-top: 6px; letter-spacing: 0.05em;">PERSONAL EVOLUTION SYSTEM</p>
    </div>

    <h2 style="font-size: 20px; font-weight: 600; color: #ffffff; margin-bottom: 12px;">Confirm Your Email Address</h2>
    <p style="font-size: 14px; line-height: 1.6; color: #d4d4d8;">${greeting}</p>
    <p style="font-size: 14px; line-height: 1.6; color: #d4d4d8;">
      Thank you for creating an account on AROHA. Use the 6-digit verification code below to verify your email address and activate your account:
    </p>

    <div style="margin: 28px 0; text-align: center;">
      <div style="display: inline-block; background-color: #18181b; border: 2px solid #7c3aed; border-radius: 12px; padding: 18px 36px; letter-spacing: 0.35em; font-size: 32px; font-weight: 700; color: #a78bfa; font-family: monospace;">
        ${params.otp}
      </div>
    </div>

    <div style="background-color: #18181b; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 12px 16px; margin: 20px 0;">
      <p style="margin: 0; font-size: 13px; color: #fbbf24; line-height: 1.5;">
        <strong>Security Notice:</strong> This code expires in <strong>10 minutes</strong> and can only be used once. Never share this code with anyone. AROHA will never ask for your code.
      </p>
    </div>

    <p style="font-size: 13px; color: #a1a1aa; line-height: 1.5;">
      If you did not request this verification code, you can safely ignore this email.
    </p>

    <div style="${footerStyle}">
      <p style="margin: 0 0 6px;">&copy; ${new Date().getFullYear()} AROHA. Master your habits. Master yourself.</p>
      <p style="margin: 0;">Sent securely by AROHA Authentication Service.</p>
    </div>
  </div>
</body>
</html>
  `;

  const info = await mailer.sendMail({
    from: env.SMTP_FROM,
    to: params.to,
    subject: `Your AROHA Verification Code: ${params.otp}`,
    text: `${greeting}\n\nYour AROHA 6-digit verification code is: ${params.otp}\n\nThis code expires in 10 minutes. If you did not request this, please ignore this email.\n\n- The AROHA Team`,
    html,
  });

  if (!env.SMTP_HOST || !env.SMTP_USER) {
    console.log(`\n======================================================`);
    console.log(`[DEV EMAIL] Email Verification OTP for ${params.to}`);
    console.log(`[DEV EMAIL] 6-Digit Code: >>> ${params.otp} <<<`);
    console.log(`======================================================\n`);
  }
}

export async function sendPasswordResetEmail(params: {
  to: string;
  resetUrl: string;
  displayName?: string;
}): Promise<void> {
  const mailer = getTransporter();
  const greeting = params.displayName ? `Hi ${params.displayName},` : "Hello,";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your AROHA Password</title>
</head>
<body style="${baseEmailStyle}">
  <div style="${containerStyle}">
    <div style="${headerStyle}">
      <h1 style="${logoStyle}">AROHA</h1>
      <p style="font-size: 13px; color: #a1a1aa; margin-top: 6px; letter-spacing: 0.05em;">PERSONAL EVOLUTION SYSTEM</p>
    </div>

    <h2 style="font-size: 20px; font-weight: 600; color: #ffffff; margin-bottom: 12px;">Reset Your Password</h2>
    <p style="font-size: 14px; line-height: 1.6; color: #d4d4d8;">${greeting}</p>
    <p style="font-size: 14px; line-height: 1.6; color: #d4d4d8;">
      We received a request to reset your password for your AROHA account. Click the button below to choose a new password:
    </p>

    <div style="margin: 32px 0; text-align: center;">
      <a href="${params.resetUrl}" style="display: inline-block; background-color: #7c3aed; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px; letter-spacing: 0.02em; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.4);">
        Reset Password
      </a>
    </div>

    <div style="background-color: #18181b; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 12px 16px; margin: 20px 0;">
      <p style="margin: 0; font-size: 13px; color: #fbbf24; line-height: 1.5;">
        <strong>Notice:</strong> This password reset link is valid for <strong>20 minutes</strong> and can only be used once.
      </p>
    </div>

    <p style="font-size: 13px; color: #a1a1aa; line-height: 1.5;">
      If the button above does not work, copy and paste this link into your browser:
    </p>
    <p style="font-size: 12px; color: #a78bfa; word-break: break-all; background-color: #18181b; padding: 10px 12px; border-radius: 6px; border: 1px solid #27272a;">
      <a href="${params.resetUrl}" style="color: #a78bfa; text-decoration: underline;">${params.resetUrl}</a>
    </p>

    <p style="font-size: 13px; color: #a1a1aa; line-height: 1.5; margin-top: 20px;">
      If you did not request a password reset, no further action is required. Your password will remain unchanged.
    </p>

    <div style="${footerStyle}">
      <p style="margin: 0 0 6px;">&copy; ${new Date().getFullYear()} AROHA. Master your habits. Master yourself.</p>
      <p style="margin: 0;">Sent securely by AROHA Authentication Service.</p>
    </div>
  </div>
</body>
</html>
  `;

  await mailer.sendMail({
    from: env.SMTP_FROM,
    to: params.to,
    subject: "Reset Your AROHA Password",
    text: `${greeting}\n\nWe received a request to reset your password. Use the link below:\n\n${params.resetUrl}\n\nThis link is valid for 20 minutes. If you did not request this, you can safely ignore this email.\n\n- The AROHA Team`,
    html,
  });

  if (!env.SMTP_HOST || !env.SMTP_USER) {
    console.log(`\n======================================================`);
    console.log(`[DEV EMAIL] Password Reset Link for ${params.to}`);
    console.log(`[DEV EMAIL] URL: >>> ${params.resetUrl} <<<`);
    console.log(`======================================================\n`);
  }
}

export async function sendPasswordChangedEmail(params: {
  to: string;
  displayName?: string;
}): Promise<void> {
  const mailer = getTransporter();
  const greeting = params.displayName ? `Hi ${params.displayName},` : "Hello,";
  const timestamp = new Date().toUTCString();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your AROHA Password Has Changed</title>
</head>
<body style="${baseEmailStyle}">
  <div style="${containerStyle}">
    <div style="${headerStyle}">
      <h1 style="${logoStyle}">AROHA</h1>
      <p style="font-size: 13px; color: #a1a1aa; margin-top: 6px; letter-spacing: 0.05em;">PERSONAL EVOLUTION SYSTEM</p>
    </div>

    <div style="text-align: center; margin-bottom: 20px;">
      <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 50%; background-color: rgba(34, 197, 94, 0.15); border: 1px solid #22c55e; color: #22c55e; font-size: 22px;">
        ✓
      </div>
    </div>

    <h2 style="font-size: 20px; font-weight: 600; color: #ffffff; margin-bottom: 12px; text-align: center;">Password Changed Successfully</h2>
    <p style="font-size: 14px; line-height: 1.6; color: #d4d4d8;">${greeting}</p>
    <p style="font-size: 14px; line-height: 1.6; color: #d4d4d8;">
      This email is confirmation that the password for your AROHA account (<strong>${params.to}</strong>) was changed on:
    </p>

    <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 12px 16px; margin: 16px 0; text-align: center; font-size: 13px; color: #e4e4e7; font-family: monospace;">
      ${timestamp}
    </div>

    <div style="background-color: #18181b; border-left: 4px solid #ef4444; border-radius: 6px; padding: 12px 16px; margin: 24px 0;">
      <p style="margin: 0; font-size: 13px; color: #f87171; line-height: 1.5;">
        <strong>Didn't make this change?</strong> If you did not authorize this change, please immediately reset your password using the "Forgot Password" feature or contact support to lock your account.
      </p>
    </div>

    <div style="${footerStyle}">
      <p style="margin: 0 0 6px;">&copy; ${new Date().getFullYear()} AROHA. Master your habits. Master yourself.</p>
      <p style="margin: 0;">Sent securely by AROHA Authentication Service.</p>
    </div>
  </div>
</body>
</html>
  `;

  await mailer.sendMail({
    from: env.SMTP_FROM,
    to: params.to,
    subject: "Security Alert: Your AROHA Password Has Been Changed",
    text: `${greeting}\n\nYour AROHA account password was changed on ${timestamp}.\n\nIf you did not authorize this change, please reset your password immediately.\n\n- The AROHA Team`,
    html,
  });

  if (!env.SMTP_HOST || !env.SMTP_USER) {
    console.log(`\n======================================================`);
    console.log(`[DEV EMAIL] Password Changed Confirmation for ${params.to} at ${timestamp}`);
    console.log(`======================================================\n`);
  }
}
