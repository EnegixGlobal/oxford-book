import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
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

    // For now, return sample data since we don't have an Order model yet
    // In a real application, you would fetch orders from the database
    const sampleOrders = [
      {
        id: 'ORD-001',
        date: '2024-01-15',
        status: 'delivered',
        total: 45.99,
        items: [
          { id: '1', title: 'Atomic Habits', quantity: 1, price: 25.99 },
          { id: '2', title: 'The Midnight Library', quantity: 1, price: 20.00 }
        ]
      },
      {
        id: 'ORD-002',
        date: '2024-01-10',
        status: 'shipped',
        total: 32.50,
        items: [
          { id: '3', title: 'Sapiens', quantity: 1, price: 32.50 }
        ]
      }
    ];

    return NextResponse.json(
      {
        success: true,
        orders: sampleOrders
      },
      { status: 200 }
    );

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
