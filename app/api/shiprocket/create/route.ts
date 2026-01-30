import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAuth, AuthenticatedRequest } from '@/middleware/auth';
import Order from '@/models/Order';
import { shiprocketService } from '@/lib/shiprocket';

/**
 * Create a Shiprocket shipment for an order
 * POST /api/shiprocket/create
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult) return authResult;
    const authReq = req as AuthenticatedRequest;
    
    // Only admin can create shipments
    if (authReq.user?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { orderId, pickupLocation } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, message: 'Order ID is required' }, { status: 400 });
    }

    await connectDB();
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    // Check if shipment already exists
    if (order.shiprocketShipmentId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Shipment already created',
        data: {
          shipmentId: order.shiprocketShipmentId,
          awb: order.shiprocketAWB
        }
      }, { status: 400 });
    }

    // Check if order is paid (for online) or confirmed (for COD)
    if (order.paymentMethod === 'online' && order.paymentStatus !== 'paid') {
      return NextResponse.json({ 
        success: false, 
        message: 'Order payment must be completed before creating shipment' 
      }, { status: 400 });
    }

    // Get pickup location from env or use default
    const defaultPickupLocation = process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary';
    const pickupLoc = pickupLocation || defaultPickupLocation;

    // Prepare shipment data
    const [firstName, ...lastNameParts] = order.shippingAddress.fullName.split(' ');
    const lastName = lastNameParts.join(' ') || firstName;

    const shipmentData = {
      order_id: order.orderId,
      order_date: order.createdAt.toISOString().split('T')[0],
      pickup_location: pickupLoc,
      billing_customer_name: firstName,
      billing_last_name: lastName,
      billing_address: order.shippingAddress.line1,
      billing_address_2: order.shippingAddress.line2 || '',
      billing_city: order.shippingAddress.city,
      billing_state: order.shippingAddress.state,
      billing_country: 'India',
      billing_pincode: order.shippingAddress.postalCode,
      billing_phone: order.shippingAddress.phone,
      shipping_is_billing: true,
      shipping_customer_name: firstName,
      shipping_last_name: lastName,
      shipping_address: order.shippingAddress.line1,
      shipping_address_2: order.shippingAddress.line2 || '',
      shipping_city: order.shippingAddress.city,
      shipping_state: order.shippingAddress.state,
      shipping_country: 'India',
      shipping_pincode: order.shippingAddress.postalCode,
      shipping_phone: order.shippingAddress.phone,
      order_items: order.items.map((item, index) => ({
        name: item.title,
        sku: item.bookId ? String(item.bookId) : `ITEM-${order.orderId}-${index}`,
        units: item.quantity,
        selling_price: item.price,
      })),
      payment_method: (order.paymentMethod === 'cod' ? 'COD' : 'Prepaid') as 'Prepaid' | 'COD',
      sub_total: order.totalAmount,
      weight: 0.5, // Default weight per item, adjust based on your products
    };

    // Create shipment in Shiprocket
    const shipmentResponse = await shiprocketService.createShipment(shipmentData);

    // Update order with Shiprocket data
    order.shiprocketShipmentId = shipmentResponse.shipment_id;
    order.shiprocketAWB = shipmentResponse.awb_code || undefined;
    order.shiprocketCourierName = shipmentResponse.courier_name || undefined;
    if (shipmentResponse.awb_code) {
      order.shiprocketTrackingUrl = `https://shiprocket.co/tracking/${shipmentResponse.awb_code}`;
    }
    
    // Update order status to shipped if AWB is generated
    if (shipmentResponse.awb_code && order.status === 'confirmed') {
      order.status = 'shipped';
      order.trackingInfo = {
        ...order.trackingInfo,
        shipped: {
          status: `Order shipped via ${shipmentResponse.courier_name || 'courier'}`,
          timestamp: new Date()
        }
      } as any;
    }

    await order.save();

    return NextResponse.json({
      success: true,
      message: 'Shipment created successfully',
      data: {
        shipmentId: shipmentResponse.shipment_id,
        awb: shipmentResponse.awb_code,
        courierName: shipmentResponse.courier_name,
        trackingUrl: order.shiprocketTrackingUrl,
        status: shipmentResponse.status,
      }
    });
  } catch (error: any) {
    console.error('Shiprocket create shipment error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create shipment' },
      { status: 500 }
    );
  }
}

