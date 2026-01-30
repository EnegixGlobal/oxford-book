import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedRequest } from '@/middleware/auth';
import { shiprocketService } from '@/lib/shiprocket';

/**
 * Get shipment details by Shiprocket shipment ID
 * GET /api/shiprocket/shipments/[shipmentId]
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ shipmentId: string }> }
) {
  try {
    const authResult = await requireAuth(req);
    if (authResult) return authResult;
    const authReq = req as AuthenticatedRequest;
    
    // Only admin can view shipment details
    if (authReq.user?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { shipmentId } = await context.params;
    const shipmentIdNum = parseInt(shipmentId, 10);

    if (isNaN(shipmentIdNum)) {
      return NextResponse.json(
        { success: false, message: 'Invalid shipment ID' },
        { status: 400 }
      );
    }

    const shipment = await shiprocketService.getShipment(shipmentIdNum);

    return NextResponse.json({
      success: true,
      data: shipment
    });
  } catch (error: any) {
    console.error('Shiprocket get shipment error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to get shipment details' },
      { status: 500 }
    );
  }
}

