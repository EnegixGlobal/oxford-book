import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { requireAuth, AuthenticatedRequest } from '@/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(request);
    if (authResult) {
      return authResult; // This will be an error response
    }

    const authRequest = request as AuthenticatedRequest;
    const userId = authRequest.user!.id;

    // Connect to database
    await connectDB();

    // Get user profile
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          address: user.address,
          joinDate: user.joinDate,
          isActive: user.isActive
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Profile fetch error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(request);
    if (authResult) {
      return authResult; // This will be an error response
    }

    const authRequest = request as AuthenticatedRequest;
    const userId = authRequest.user!.id;

    const body = await request.json();
    const { name, email, phone, address } = body;

    // Validate input
    if (!name || !email) {
      return NextResponse.json(
        {
          success: false,
          message: 'Name and email are required'
        },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Check if email is already taken by another user
    if (email !== authRequest.user!.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            message: 'Email is already taken'
          },
          { status: 400 }
        );
      }
    }

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        name,
        email,
        phone,
        address
      },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Profile updated successfully',
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          phone: updatedUser.phone,
          address: updatedUser.address,
          joinDate: updatedUser.joinDate,
          isActive: updatedUser.isActive
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
