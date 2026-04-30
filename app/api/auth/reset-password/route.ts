import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import PasswordResetToken from '@/models/PasswordResetToken';
import { resetPasswordSchema } from '@/lib/validations';
import { rateLimit } from '@/middleware/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (5 requests per 15 minutes per IP)
    const rateLimitResult = await rateLimit(request, {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
      message: 'Too many password reset attempts. Please try again in 15 minutes.',
    });
    if (rateLimitResult) {
      return rateLimitResult; // Rate limit exceeded
    }

    // Parse request body
    const body = await request.json();

    // Validate input data
    const validationResult = resetPasswordSchema.safeParse(body);
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

    const { token, password } = validationResult.data;

    // Connect to database
    await connectDB();

    // Find the reset token
    const resetToken = await PasswordResetToken.findOne({
      token,
      used: false,
      expiresAt: { $gt: new Date() } // Token must not be expired
    });

    if (!resetToken) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid or expired reset token. Please request a new password reset.'
        },
        { status: 400 }
      );
    }

    // Find the user
    const user = await User.findById(resetToken.userId).select('+password');
    if (!user) {
      // Mark token as used even if user not found (security)
      resetToken.used = true;
      await resetToken.save();
      
      return NextResponse.json(
        {
          success: false,
          message: 'User not found'
        },
        { status: 404 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: 'Account is deactivated. Please contact support.'
        },
        { status: 400 }
      );
    }

    // Update user password
    user.password = password;
    await user.save();

    // Mark token as used
    resetToken.used = true;
    await resetToken.save();

    // Invalidate all other unused reset tokens for this user
    await PasswordResetToken.updateMany(
      { userId: user._id, used: false, _id: { $ne: resetToken._id } },
      { used: true }
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Password has been reset successfully. You can now login with your new password.'
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

