import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { requireAdmin, AuthenticatedRequest } from '@/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const authResult = await requireAdmin(request);
    if (authResult) {
      return authResult; // This will be an error response
    }

    const authRequest = request as AuthenticatedRequest;

    // Connect to database
    await connectDB();

    // Get dashboard statistics
    const totalUsers = await User.countDocuments({ role: 'customer' });
    const activeUsers = await User.countDocuments({ role: 'customer', isActive: true });
    const inactiveUsers = await User.countDocuments({ role: 'customer', isActive: false });
    const recentUsers = await User.find({ role: 'customer' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email joinDate isActive');

    return NextResponse.json(
      {
        success: true,
        message: 'Admin dashboard data retrieved successfully',
        data: {
          totalUsers,
          activeUsers,
          inactiveUsers,
          recentUsers: recentUsers.map(user => ({
            id: user._id,
            name: user.name,
            email: user.email,
            joinDate: user.joinDate,
            isActive: user.isActive
          }))
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Admin dashboard error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
