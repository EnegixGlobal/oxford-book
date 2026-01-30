import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAuth, AuthenticatedRequest } from '@/middleware/auth';
import Order from '@/models/Order';
import { shiprocketService } from '@/lib/shiprocket';

/**
 * Generate AWB for a shipment
 * POST /api/shiprocket/awb
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult) return authResult;
    const authReq = req as AuthenticatedRequest;
    
    // Only admin can generate AWB
    if (authReq.user?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { orderId, shipmentId } = body;

    if (!orderId && !shipmentId) {
      return NextResponse.json(
        { success: false, message: 'Order ID or Shipment ID is required' },
        { status: 400 }
      );
    }

    await connectDB();
    
    let order;
    let shipmentIdNum: number;

    if (orderId) {
      order = await Order.findById(orderId);
      if (!order) {
        return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
      }
      if (!order.shiprocketShipmentId) {
        return NextResponse.json(
          { success: false, message: 'No shipment ID found for this order' },
          { status: 400 }
        );
      }
      shipmentIdNum = order.shiprocketShipmentId;
    } else {
      shipmentIdNum = parseInt(shipmentId, 10);
      if (isNaN(shipmentIdNum)) {
        return NextResponse.json(
          { success: false, message: 'Invalid shipment ID' },
          { status: 400 }
        );
      }
    }

    // Generate AWB in Shiprocket
    const awbResponse = await shiprocketService.generateAWB(shipmentIdNum);

    // Update order with AWB if order was found
    if (order && !order.shiprocketAWB) {
      // Fetch updated shipment details to get AWB
      const shipment = await shiprocketService.getShipment(shipmentIdNum);
      if (shipment.awb_code) {
        order.shiprocketAWB = shipment.awb_code;
        order.shiprocketTrackingUrl = `https://shiprocket.co/tracking/${shipment.awb_code}`;
        if (shipment.courier_name) {
          order.shiprocketCourierName = shipment.courier_name;
        }
        await order.save();
      }
    }

    return NextResponse.json({
      success: true,
      message: awbResponse.message || 'AWB generated successfully',
      data: awbResponse
    });
  } catch (error: any) {
    console.error('Shiprocket generate AWB error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to generate AWB' },
      { status: 500 }
    );
  }
}

