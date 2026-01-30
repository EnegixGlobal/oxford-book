import { NextRequest, NextResponse } from 'next/server';
import { shiprocketService } from '@/lib/shiprocket';

/**
 * Track a Shiprocket shipment
 * GET /api/shiprocket/track?awb=AWB_CODE or ?orderId=ORDER_ID
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const awb = searchParams.get('awb');
    const orderId = searchParams.get('orderId');

    if (!awb && !orderId) {
      return NextResponse.json(
        { success: false, message: 'AWB code or Order ID is required' },
        { status: 400 }
      );
    }

    let trackingData;
    if (awb) {
      trackingData = await shiprocketService.trackShipment(awb);
    } else if (orderId) {
      trackingData = await shiprocketService.trackByOrderId(orderId);
    }

    return NextResponse.json({
      success: true,
      data: trackingData
    });
  } catch (error: any) {
    console.error('Shiprocket track error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to track shipment' },
      { status: 500 }
    );
  }
}

