import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import { requireAuth, AuthenticatedRequest } from '@/middleware/auth';
import Order from '@/models/Order';
import { shiprocketService } from '@/lib/shiprocket';

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult) return authResult;
    const authReq = req as AuthenticatedRequest;
    const user = authReq.user!;

    const {
      orderMongoId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = await req.json();

    if (!orderMongoId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { success: false, message: 'Missing Razorpay verification fields' },
        { status: 400 }
      );
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json(
        { success: false, message: 'Razorpay secret not configured' },
        { status: 500 }
      );
    }

    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return NextResponse.json(
        { success: false, message: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    await connectDB();
    const order = await Order.findById(orderMongoId);
    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    if (String(order.userId) !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      );
    }

    if (order.paymentStatus === 'paid') {
      return NextResponse.json({
        success: true,
        message: 'Already verified',
        data: { order },
      });
    }

    // Ensure the Razorpay order id matches what we stored
    if (order.paymentOrderId && order.paymentOrderId !== razorpayOrderId) {
      return NextResponse.json(
        { success: false, message: 'Order mismatch' },
        { status: 400 }
      );
    }

    const now = new Date();
    order.paymentStatus = 'paid';
    order.status = 'confirmed';
    order.paymentCompletedAt = now;
    order.paymentGatewayTxnId = razorpayPaymentId;
    order.trackingInfo = {
      ...(order.trackingInfo || {}),
      orderPlaced:
        order.trackingInfo?.orderPlaced ||
        ({ status: 'Order placed successfully', timestamp: now } as any),
      confirmed: { status: 'Payment confirmed', timestamp: now } as any,
    } as any;

    await order.save();

    // Automatically create Shiprocket shipment if enabled and credentials are configured
    const autoCreateShipment = process.env.SHIPROCKET_AUTO_CREATE === 'true';
    const hasShiprocketCredentials = process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD;
    
    console.log('[RAZORPAY][VERIFY] Shiprocket check:', {
      autoCreateShipment,
      hasShiprocketCredentials: !!hasShiprocketCredentials,
      existingShipmentId: order.shiprocketShipmentId,
      willCreate: autoCreateShipment && hasShiprocketCredentials && !order.shiprocketShipmentId
    });
    
    if (autoCreateShipment && hasShiprocketCredentials && !order.shiprocketShipmentId) {
      try {
        // Try to get primary pickup location from Shiprocket, fallback to env or default
        let pickupLocation: string = process.env.SHIPROCKET_PICKUP_LOCATION || '';
        if (!pickupLocation) {
          try {
            const primaryLocation = await shiprocketService.getPrimaryPickupLocation();
            if (primaryLocation) {
              pickupLocation = primaryLocation;
              console.log('[RAZORPAY][VERIFY] Fetched primary pickup location from Shiprocket:', pickupLocation);
            }
          } catch (err) {
            console.warn('[RAZORPAY][VERIFY] Could not fetch pickup location, using default');
          }
        }
        pickupLocation = pickupLocation || 'Primary';
        
        const [firstName, ...lastNameParts] = order.shippingAddress.fullName.split(' ');
        const lastName = lastNameParts.join(' ') || firstName;

        const shipmentData = {
          order_id: order.orderId,
          order_date: order.createdAt.toISOString().split('T')[0],
          pickup_location: pickupLocation,
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
          weight: Math.max(0.5, order.items.reduce((sum, item) => sum + item.quantity, 0) * 0.5), // Weight: 0.5kg per item, minimum 0.5kg
          length: 25, // Default length in cm
          breadth: 20, // Default breadth in cm
          height: Math.max(2, order.items.reduce((sum, item) => sum + item.quantity, 0) * 2), // Height: 2cm per item, minimum 2cm
        };

        console.log('[RAZORPAY][VERIFY] Creating Shiprocket shipment for order:', order.orderId);
        const shipmentResponse = await shiprocketService.createShipment(shipmentData);
        console.log('[RAZORPAY][VERIFY] Shiprocket shipment created successfully:', {
          shipment_id: shipmentResponse.shipment_id,
          awb_code: shipmentResponse.awb_code,
          courier_name: shipmentResponse.courier_name
        });
        
        // Update order with Shiprocket data
        order.shiprocketShipmentId = shipmentResponse.shipment_id;
        order.shiprocketAWB = shipmentResponse.awb_code || undefined;
        order.shiprocketCourierName = shipmentResponse.courier_name || undefined;
        if (shipmentResponse.awb_code) {
          order.shiprocketTrackingUrl = `https://shiprocket.co/tracking/${shipmentResponse.awb_code}`;
          // Update status to shipped if AWB is generated
          if (order.status === 'confirmed') {
            order.status = 'shipped';
            order.trackingInfo = {
              ...order.trackingInfo,
              shipped: {
                status: `Order shipped via ${shipmentResponse.courier_name || 'courier'}`,
                timestamp: new Date()
              }
            } as any;
          }
        }
        await order.save();
        console.log('[RAZORPAY][VERIFY] Order updated with Shiprocket shipment data');
      } catch (shipmentError: any) {
        // Log error but don't fail payment verification
        console.error('[RAZORPAY][VERIFY] Shiprocket shipment creation failed:', {
          error: shipmentError.message,
          stack: shipmentError.stack,
          orderId: order.orderId
        });
        // Payment is still verified, shipment can be created manually later
      }
    } else if (!autoCreateShipment) {
      console.log('[RAZORPAY][VERIFY] Shiprocket auto-create is disabled (SHIPROCKET_AUTO_CREATE !== "true")');
    } else if (!hasShiprocketCredentials) {
      console.log('[RAZORPAY][VERIFY] Shiprocket credentials not configured');
    } else if (order.shiprocketShipmentId) {
      console.log('[RAZORPAY][VERIFY] Order already has Shiprocket shipment:', order.shiprocketShipmentId);
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified',
      data: { order },
    });
  } catch (e) {
    console.error('[RAZORPAY][VERIFY] Error', e);
    return NextResponse.json(
      { success: false, message: 'Verification failed' },
      { status: 500 }
    );
  }
}


