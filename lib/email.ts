import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

/**
 * Get configured nodemailer transporter
 */
function getTransporter() {
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER || 'info@oxfordbookhouse.in';
  const smtpPassword = process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD;

  if (!smtpUser || !smtpPassword) {
    throw new Error('SMTP credentials not configured');
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    pool: false,
    maxConnections: 1,
    maxMessages: 1,
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  } as SMTPTransport.Options);
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetToken: string,
  isAdmin: boolean = false
): Promise<void> {
  try {
    const transporter = getTransporter();
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER || 'info@oxfordbookhouse.in';
    
    // Get base URL from environment or use default
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}${isAdmin ? '&admin=true' : ''}`;
    
    // Token expires in 1 hour
    const expiresIn = '1 hour';

    const mailOptions = {
      from: `"Oxford Book House" <${smtpUser}>`,
      to: email,
      subject: 'Password Reset Request - Oxford Book House',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Password Reset Request</h1>
          </div>
          
          <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Hello ${name},
            </p>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              We received a request to reset your password for your ${isAdmin ? 'admin' : 'customer'} account at Oxford Book House.
            </p>
            
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #7c3aed;">
              <p style="color: #374151; font-size: 14px; margin: 0 0 10px 0;">
                <strong>Click the button below to reset your password:</strong>
              </p>
              <div style="text-align: center; margin: 20px 0;">
                <a href="${resetUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Reset Password
                </a>
              </div>
              <p style="color: #6b7280; font-size: 12px; margin: 15px 0 0 0; text-align: center;">
                Or copy and paste this link into your browser:<br>
                <a href="${resetUrl}" style="color: #7c3aed; word-break: break-all;">${resetUrl}</a>
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              <strong>Important:</strong> This link will expire in ${expiresIn}. If you didn't request a password reset, please ignore this email or contact support if you have concerns.
            </p>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 30px;">
              For security reasons, never share this link with anyone. Our team will never ask for your password reset link.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0;">
              This is an automated email from Oxford Book House.<br>
              If you have any questions, please contact us at <a href="mailto:${smtpUser}" style="color: #7c3aed;">${smtpUser}</a>
            </p>
          </div>
        </div>
      `,
      text: `
Password Reset Request - Oxford Book House

Hello ${name},

We received a request to reset your password for your ${isAdmin ? 'admin' : 'customer'} account at Oxford Book House.

Click the link below to reset your password:
${resetUrl}

This link will expire in ${expiresIn}. If you didn't request a password reset, please ignore this email or contact support if you have concerns.

For security reasons, never share this link with anyone. Our team will never ask for your password reset link.

---
This is an automated email from Oxford Book House.
If you have any questions, please contact us at ${smtpUser}
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error: any) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
}

