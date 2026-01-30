import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedRequest } from '@/middleware/auth';
import { shiprocketService } from '@/lib/shiprocket';

/**
 * Get pickup locations from Shiprocket
 * GET /api/shiprocket/pickup
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult) return authResult;
    const authReq = req as AuthenticatedRequest;
    
    // Only admin can view pickup locations
    if (authReq.user?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    // Note: This endpoint may need to be adjusted based on Shiprocket API documentation
    // The actual endpoint for pickup locations might be different
    const token = await shiprocketService.getToken();
    const response = await fetch('https://apiv2.shiprocket.in/v1/external/settings/company/pickup', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Shiprocket API error: ${error}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: data
    });
  } catch (error: any) {
    console.error('Shiprocket get pickup locations error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to get pickup locations' },
      { status: 500 }
    );
  }
}

