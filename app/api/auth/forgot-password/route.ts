import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import PasswordResetToken from '@/models/PasswordResetToken';
import { forgotPasswordSchema } from '@/lib/validations';
import { rateLimit } from '@/middleware/rateLimit';
import { sendPasswordResetEmail } from '@/lib/email';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (5 requests per 15 minutes per IP)
    const rateLimitResult = await rateLimit(request, {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
      message: 'Too many password reset requests. Please try again in 15 minutes.',
    });
    if (rateLimitResult) {
      return rateLimitResult; // Rate limit exceeded
    }

    // Parse request body
    const body = await request.json();

    // Validate input data
    const validationResult = forgotPasswordSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    const { email } = validationResult.data;

    // Connect to database
    await connectDB();

    // Find user by email (works for both customer and admin)
    const user = await User.findOne({ email });
    
    // Always return success message to prevent email enumeration
    // Don't reveal whether the email exists or not
    if (!user) {
      return NextResponse.json(
        {
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent.'
        },
        { status: 200 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        {
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent.'
        },
        { status: 200 }
      );
    }

    // Invalidate any existing unused reset tokens for this user
    await PasswordResetToken.updateMany(
      { userId: user._id, used: false },
      { used: true }
    );

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Token expires in 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Create password reset token
    const passwordResetToken = new PasswordResetToken({
      token: resetToken,
      userId: user._id,
      email: user.email,
      expiresAt,
      used: false,
    });
    await passwordResetToken.save();

    // Send password reset email
    try {
      await sendPasswordResetEmail(
        user.email,
        user.name,
        resetToken,
        user.role === 'admin'
      );
    } catch (emailError: any) {
      console.error('Error sending password reset email:', emailError);
      // Delete the token if email fails
      await PasswordResetToken.findByIdAndDelete(passwordResetToken._id);
      
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to send password reset email. Please try again later.'
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

