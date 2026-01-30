import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedRequest } from '@/middleware/auth';
import { shiprocketService } from '@/lib/shiprocket';

/**
 * Generate manifest for shipments
 * POST /api/shiprocket/manifest
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult) return authResult;
    const authReq = req as AuthenticatedRequest;
    
    // Only admin can generate manifests
    if (authReq.user?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { shipmentIds } = body;

    if (!shipmentIds || !Array.isArray(shipmentIds) || shipmentIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'shipmentIds array is required' },
        { status: 400 }
      );
    }

    // Note: This endpoint may need to be adjusted based on Shiprocket API documentation
    const token = await shiprocketService.getToken();
    const response = await fetch('https://apiv2.shiprocket.in/v1/external/manifests/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        shipment_id: shipmentIds,
      }),
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
    console.error('Shiprocket generate manifest error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to generate manifest' },
      { status: 500 }
    );
  }
}

