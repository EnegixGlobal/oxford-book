import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAuth, AuthenticatedRequest } from '@/middleware/auth';
import Order from '@/models/Order';
import { shiprocketService } from '@/lib/shiprocket';

/**
 * Cancel a Shiprocket shipment
 * POST /api/shiprocket/cancel
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult) return authResult;
    const authReq = req as AuthenticatedRequest;
    
    // Only admin can cancel shipments
    if (authReq.user?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { orderId, awb } = body;

    if (!orderId && !awb) {
      return NextResponse.json(
        { success: false, message: 'Order ID or AWB code is required' },
        { status: 400 }
      );
    }

    await connectDB();
    
    let order;
    if (orderId) {
      order = await Order.findById(orderId);
      if (!order) {
        return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
      }
      if (!order.shiprocketAWB) {
        return NextResponse.json(
          { success: false, message: 'No AWB code found for this order' },
          { status: 400 }
        );
      }
    }

    const awbCode = awb || order?.shiprocketAWB;
    if (!awbCode) {
      return NextResponse.json(
        { success: false, message: 'AWB code is required' },
        { status: 400 }
      );
    }

    // Cancel shipment in Shiprocket
    const cancelResponse = await shiprocketService.cancelShipment(awbCode);

    // Update order status if order was found
    if (order) {
      order.status = 'cancelled';
      order.trackingInfo = {
        ...order.trackingInfo,
        cancelled: {
          status: 'Shipment cancelled',
          timestamp: new Date()
        }
      } as any;
      await order.save();
    }

    return NextResponse.json({
      success: true,
      message: cancelResponse.message || 'Shipment cancelled successfully',
      data: cancelResponse
    });
  } catch (error: any) {
    console.error('Shiprocket cancel error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to cancel shipment' },
      { status: 500 }
    );
  }
}

