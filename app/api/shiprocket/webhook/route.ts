import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';

/**
 * Shiprocket webhook handler for shipment status updates
 * POST /api/shiprocket/webhook
 * 
 * This endpoint receives webhooks from Shiprocket when shipment status changes
 * Configure this URL in Shiprocket dashboard: Settings > Webhooks
 */
export async function POST(req: NextRequest) {
  try {
    // Verify webhook secret if configured
    const webhookSecret = process.env.SHIPROCKET_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers.get('x-shiprocket-signature');
      // Add signature verification logic here if needed
    }

    const body = await req.json();
    
    // Shiprocket webhook payload structure may vary
    // Common fields: order_id, shipment_id, awb_code, status, etc.
    const { order_id, shipment_id, awb_code, status, status_code } = body;

    if (!order_id && !shipment_id) {
      return NextResponse.json(
        { success: false, message: 'Missing order_id or shipment_id' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find order by Shiprocket order_id or shipment_id
    let order;
    if (order_id) {
      order = await Order.findOne({ orderId: order_id });
    }
    if (!order && shipment_id) {
      order = await Order.findOne({ shiprocketShipmentId: shipment_id });
    }

    if (!order) {
      console.warn(`Shiprocket webhook: Order not found for order_id: ${order_id}, shipment_id: ${shipment_id}`);
      return NextResponse.json({ success: true, message: 'Order not found, webhook ignored' });
    }

    // Update order based on Shiprocket status
    const now = new Date();
    
    // Update Shiprocket fields if provided
    if (shipment_id && !order.shiprocketShipmentId) {
      order.shiprocketShipmentId = shipment_id;
    }
    if (awb_code && !order.shiprocketAWB) {
      order.shiprocketAWB = awb_code;
      order.shiprocketTrackingUrl = `https://shiprocket.co/tracking/${awb_code}`;
    }

    // Map Shiprocket status codes to order status
    // Status codes: 1=New, 2=In Transit, 3=Out for Delivery, 4=Delivered, 5=Cancelled, etc.
    if (status_code !== undefined) {
      if (status_code === 2 || status_code === 3) {
        // In Transit or Out for Delivery
        if (order.status !== 'shipped') {
          order.status = 'shipped';
          order.trackingInfo = {
            ...order.trackingInfo,
            shipped: {
              status: status || 'Order shipped',
              timestamp: now
            }
          } as any;
        }
      } else if (status_code === 4) {
        // Delivered
        if (order.status !== 'delivered') {
          order.status = 'delivered';
          order.trackingInfo = {
            ...order.trackingInfo,
            delivered: {
              status: status || 'Order delivered',
              timestamp: now
            }
          } as any;
        }
      } else if (status_code === 5) {
        // Cancelled
        if (order.status !== 'cancelled') {
          order.status = 'cancelled';
          order.trackingInfo = {
            ...order.trackingInfo,
            cancelled: {
              status: status || 'Order cancelled',
              timestamp: now
            }
          } as any;
        }
      }
    }

    await order.save();

    return NextResponse.json({ success: true, message: 'Webhook processed successfully' });
  } catch (error: any) {
    console.error('Shiprocket webhook error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

