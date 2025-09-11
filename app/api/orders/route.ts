import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAuth, AuthenticatedRequest } from '@/middleware/auth';
import Order from '@/models/Order';

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

  const orders = await Order.find({ userId }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ success: true, orders }, { status: 200 });

  } catch (error: any) {
    console.error('Orders fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
