import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { requireAuth, AuthenticatedRequest } from '@/middleware/auth';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(request);
    if (authResult) {
      return authResult; // This will be an error response
    }

    const authRequest = request as AuthenticatedRequest;
    const userId = authRequest.user!.id;

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          message: 'Current password and new password are required'
        },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: 'New password must be at least 6 characters long'
        },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Get user with password
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found'
        },
        { status: 404 }
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Current password is incorrect'
        },
        { status: 400 }
      );
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Password changed successfully'
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error'
      },
      { status: 500 }
    );
  }
}