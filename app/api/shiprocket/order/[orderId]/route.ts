import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAuth, AuthenticatedRequest } from '@/middleware/auth';
import Order from '@/models/Order';
import { shiprocketService } from '@/lib/shiprocket';

/**
 * Get Shiprocket shipment details by order ID
 * GET /api/shiprocket/order/[orderId]
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const authResult = await requireAuth(req);
    if (authResult) return authResult;
    const authReq = req as AuthenticatedRequest;
    
    const { orderId } = await context.params;

    await connectDB();
    const order = await Order.findById(orderId);

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    // Users can only view their own orders, admins can view all
    if (authReq.user?.role !== 'admin' && String(order.userId) !== authReq.user?.id) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    // If shipment exists, fetch tracking data and optionally sync status
    let trackingData = null;
    let statusSynced = false;
    
    const syncStatus = req.nextUrl.searchParams.get('sync') === 'true';
    
    if (order.shiprocketShipmentId || order.shiprocketAWB) {
      try {
        if (order.shiprocketAWB) {
          trackingData = await shiprocketService.trackShipment(order.shiprocketAWB);
        } else if (order.shiprocketShipmentId) {
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
              await order.save();
            }
          }
        }

        // Optionally sync status from Shiprocket
        if (syncStatus && trackingData?.tracking_data?.shipment_track?.length) {
          const shipmentTrack = trackingData.tracking_data.shipment_track[0];
          const statusCode = shipmentTrack.shipment_status;
          const statusLabel = shipmentTrack.shipment_status_label;
          const activities = shipmentTrack.shipment_track_activities || [];
          const latestActivity = activities[activities.length - 1];
          const now = new Date();

          if (statusCode === 2 || statusCode === 3) {
            if (order.status !== 'shipped') {
              order.status = 'shipped';
              order.trackingInfo = {
                ...order.trackingInfo,
                shipped: {
                  status: statusLabel || latestActivity?.status || 'Order shipped',
                  timestamp: latestActivity?.date ? new Date(latestActivity.date) : now
                }
              } as any;
              statusSynced = true;
            }
          } else if (statusCode === 4) {
            if (order.status !== 'delivered') {
              order.status = 'delivered';
              order.trackingInfo = {
                ...order.trackingInfo,
                delivered: {
                  status: statusLabel || latestActivity?.status || 'Order delivered',
                  timestamp: latestActivity?.date ? new Date(latestActivity.date) : now
                }
              } as any;
              statusSynced = true;
            }
          } else if (statusCode === 5) {
            if (order.status !== 'cancelled') {
              order.status = 'cancelled';
              order.trackingInfo = {
                ...order.trackingInfo,
                cancelled: {
                  status: statusLabel || latestActivity?.status || 'Order cancelled',
                  timestamp: latestActivity?.date ? new Date(latestActivity.date) : now
                }
              } as any;
              statusSynced = true;
            }
          }

          if (statusSynced) {
            await order.save();
          }
        }
      } catch (error) {
        console.error('Failed to fetch tracking data:', error);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        order: {
          _id: order._id,
          orderId: order.orderId,
          status: order.status,
          paymentStatus: order.paymentStatus,
          shiprocketShipmentId: order.shiprocketShipmentId,
          shiprocketAWB: order.shiprocketAWB,
          shiprocketTrackingUrl: order.shiprocketTrackingUrl,
          shiprocketCourierName: order.shiprocketCourierName,
          trackingInfo: order.trackingInfo,
        },
        tracking: trackingData,
        statusSynced
      }
    });
  } catch (error: any) {
    console.error('Shiprocket get order error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to get order details' },
      { status: 500 }
    );
  }
}

