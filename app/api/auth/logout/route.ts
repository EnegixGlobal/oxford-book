import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Session from '@/models/Session';
import { requireAuth } from '@/middleware/auth';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await requireAuth(request);
    if (authResult) {
      // If not authenticated, still try to clear cookies
      const response = NextResponse.json(
        { success: true, message: 'Logged out' },
        { status: 200 }
      );
      response.cookies.delete('sessionId');
      return response;
    }

    // Get sessionId from cookie
    const sessionId = request.cookies.get('sessionId')?.value;

    if (sessionId) {
      await connectDB();
      // Delete session from MongoDB
      await Session.deleteOne({ sessionId });
    }

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        message: 'Logged out successfully'
      },
      { status: 200 }
    );

    // Clear HTTP-only cookie
    response.cookies.delete('sessionId');
    response.cookies.set('sessionId', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/',
    });

    return response;

  } catch (error: any) {
    console.error('Logout error:', error);

    // Even on error, try to clear cookies
    const response = NextResponse.json(
      {
        success: false,
        message: 'Error during logout'
      },
      { status: 500 }
    );
    response.cookies.delete('sessionId');
    return response;
  }
}

