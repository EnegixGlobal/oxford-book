import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Get SMTP configuration from environment variables
    // Gmail SMTP settings: smtp.gmail.com, port 587 (TLS) or 465 (SSL)
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER || 'info@oxfordbookhouse.in';
    const smtpPassword = process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD;
    const recipientEmail = process.env.RECIPIENT_EMAIL || 'info@oxfordbookhouse.in';

    if (!smtpUser || !smtpPassword) {
      console.error('SMTP credentials not configured');
      return NextResponse.json(
        { success: false, message: 'Email service not configured' },
        { status: 500 }
      );
    }

    // Create transporter with Vercel-optimized settings
    // const transporter = nodemailer.createTransport({
    //   host: smtpHost,
    //   port: smtpPort,
    //   secure: smtpPort === 465, // true for 465, false for other ports
    //   auth: {
    //     user: smtpUser,
    //     pass: smtpPassword,
    //   },

    //   connectionTimeout: 10000, // 10 seconds
    //   greetingTimeout: 10000,
    //   socketTimeout: 10000,

    //   pool: false, 
    //   maxConnections: 1,
    //   maxMessages: 1,
    //   tls: {
    //     ciphers: 'SSLv3',
    //     rejectUnauthorized: false, // For development, set to true in production with proper certificates
    //   },
    // });

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true only for 465
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },

      // Serverless-safe timeouts
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,

      // Disable pooling for Vercel
      pool: false,
      maxConnections: 1,
      maxMessages: 1,

      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
    } as SMTPTransport.Options);



    // Email content
    const mailOptions = {
      from: `"Oxford Book House" <${smtpUser}>`,
      to: recipientEmail,
      replyTo: email,
      subject: `Contact Form: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7c3aed;">New Contact Form Submission</h2>
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Subject:</strong> ${subject}</p>
          </div>
          <div style="background-color: #ffffff; padding: 20px; border-left: 4px solid #7c3aed; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">Message:</h3>
            <p style="color: #4b5563; white-space: pre-wrap;">${message}</p>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 12px;">
            This email was sent from the Oxford Book House contact form.<br>
            You can reply directly to this email to respond to ${name}.
          </p>
        </div>
      `,
      text: `
New Contact Form Submission

Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}

---
This email was sent from the Oxford Book House contact form.
You can reply directly to this email to respond to ${name}.
      `,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent successfully:', info.messageId);

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully! We\'ll get back to you soon.',
    });
  } catch (error: any) {
    console.error('Error sending email:', error);

    // Provide more specific error messages
    if (error.code === 'EAUTH') {
      return NextResponse.json(
        { success: false, message: 'Email authentication failed. Please check your SMTP credentials.' },
        { status: 500 }
      );
    }

    if (error.code === 'ECONNECTION') {
      return NextResponse.json(
        { success: false, message: 'Could not connect to email server. Please check your SMTP settings.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to send message. Please try again later.' },
      { status: 500 }
    );
  }
}

