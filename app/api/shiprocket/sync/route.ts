import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAuth, AuthenticatedRequest } from '@/middleware/auth';
import Order from '@/models/Order';
import { shiprocketService } from '@/lib/shiprocket';

/**
 * Sync order statuses from Shiprocket (polling alternative to webhooks)
 * POST /api/shiprocket/sync
 * 
 * This endpoint can be called manually by admins or via a cron job
 * to update order statuses from Shiprocket without using webhooks
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult) return authResult;
    const authReq = req as AuthenticatedRequest;
    
    // Only admin can sync statuses
    if (authReq.user?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { orderId, syncAll } = body;

    await connectDB();

    let ordersToSync: any[] = [];

    if (syncAll) {
      // Sync all orders with Shiprocket shipments
      ordersToSync = await Order.find({
        shiprocketShipmentId: { $exists: true, $ne: null },
        status: { $in: ['confirmed', 'shipped'] } // Only sync active orders
      }).limit(100); // Limit to prevent timeout
    } else if (orderId) {
      // Sync specific order
      const order = await Order.findById(orderId);
      if (!order) {
        return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
      }
      if (!order.shiprocketShipmentId) {
        return NextResponse.json(
          { success: false, message: 'Order does not have a Shiprocket shipment' },
          { status: 400 }
        );
      }
      ordersToSync = [order];
    } else {
      return NextResponse.json(
        { success: false, message: 'orderId or syncAll is required' },
        { status: 400 }
      );
    }

    const results = {
      updated: 0,
      failed: 0,
      skipped: 0,
      details: [] as any[]
    };

    for (const order of ordersToSync) {
      try {
        // Get tracking data from Shiprocket
        let trackingData = null;
        
        if (order.shiprocketAWB) {
          trackingData = await shiprocketService.trackShipment(order.shiprocketAWB);
        } else if (order.shiprocketShipmentId) {
          // Get shipment details if AWB not available
          const shipment = await shiprocketService.getShipment(order.shiprocketShipmentId);
          if (shipment.awb_code) {
            trackingData = await shiprocketService.trackShipment(shipment.awb_code);
            // Update order with AWB if it wasn't set
            if (!order.shiprocketAWB) {
              order.shiprocketAWB = shipment.awb_code;
              order.shiprocketTrackingUrl = `https://shiprocket.co/tracking/${shipment.awb_code}`;
              if (shipment.courier_name) {
                order.shiprocketCourierName = shipment.courier_name;
              }
            }
          }
        }

        if (!trackingData || !trackingData.tracking_data?.shipment_track?.length) {
          results.skipped++;
          results.details.push({
            orderId: order.orderId,
            status: 'skipped',
            reason: 'No tracking data available'
          });
          continue;
        }

        const shipmentTrack = trackingData.tracking_data.shipment_track[0];
        const statusCode = shipmentTrack.shipment_status;
        const statusLabel = shipmentTrack.shipment_status_label;
        const activities = shipmentTrack.shipment_track_activities || [];
        const latestActivity = activities[activities.length - 1];

        const now = new Date();
        let updated = false;

        // Map Shiprocket status codes to order status
        // Status codes: 1=New, 2=In Transit, 3=Out for Delivery, 4=Delivered, 5=Cancelled, etc.
        if (statusCode === 2 || statusCode === 3) {
          // In Transit or Out for Delivery
          if (order.status !== 'shipped') {
            order.status = 'shipped';
            order.trackingInfo = {
              ...order.trackingInfo,
              shipped: {
                status: statusLabel || latestActivity?.status || 'Order shipped',
                timestamp: latestActivity?.date ? new Date(latestActivity.date) : now
              }
            } as any;
            updated = true;
          }
        } else if (statusCode === 4) {
          // Delivered
          if (order.status !== 'delivered') {
            order.status = 'delivered';
            order.trackingInfo = {
              ...order.trackingInfo,
              delivered: {
                status: statusLabel || latestActivity?.status || 'Order delivered',
                timestamp: latestActivity?.date ? new Date(latestActivity.date) : now
              }
            } as any;
            updated = true;
          }
        } else if (statusCode === 5) {
          // Cancelled
          if (order.status !== 'cancelled') {
            order.status = 'cancelled';
            order.trackingInfo = {
              ...order.trackingInfo,
              cancelled: {
                status: statusLabel || latestActivity?.status || 'Order cancelled',
                timestamp: latestActivity?.date ? new Date(latestActivity.date) : now
              }
            } as any;
            updated = true;
          }
        }

        // Update AWB and tracking URL if available
        if (shipmentTrack.awb_code && !order.shiprocketAWB) {
          order.shiprocketAWB = shipmentTrack.awb_code;
          order.shiprocketTrackingUrl = `https://shiprocket.co/tracking/${shipmentTrack.awb_code}`;
          updated = true;
        }

        if (updated) {
          await order.save();
          results.updated++;
          results.details.push({
            orderId: order.orderId,
            status: 'updated',
            newStatus: order.status,
            shiprocketStatus: statusLabel
          });
        } else {
          results.skipped++;
          results.details.push({
            orderId: order.orderId,
            status: 'skipped',
            reason: 'No status change needed'
          });
        }
      } catch (error: any) {
        results.failed++;
        results.details.push({
          orderId: order.orderId,
          status: 'failed',
          error: error.message
        });
        console.error(`Failed to sync order ${order.orderId}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sync completed: ${results.updated} updated, ${results.failed} failed, ${results.skipped} skipped`,
      data: results
    });
  } catch (error: any) {
    console.error('Shiprocket sync error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to sync orders' },
      { status: 500 }
    );
  }
}

