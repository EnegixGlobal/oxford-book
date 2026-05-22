import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAuth, AuthenticatedRequest } from '@/middleware/auth';
import Order from '@/models/Order';
import { shiprocketService } from '@/lib/shiprocket';

// Create a new order from cart payload before payment
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult) return authResult;
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;

    const body = await req.json();
    const { items, shippingAddress, paymentMethod = 'online' } = body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: 'Items are required' }, { status: 400 });
    }
    if (!shippingAddress || !shippingAddress.fullName) {
      return NextResponse.json({ success: false, message: 'Shipping address required' }, { status: 400 });
    }
    if (paymentMethod && !['online', 'cod'].includes(paymentMethod)) {
      return NextResponse.json({ success: false, message: 'Invalid payment method' }, { status: 400 });
    }

    await connectDB();

    // Derive totals
    const orderItems = items.map((it: any) => ({
      bookId: it.bookMongoId || null,
      title: it.title,
      price: it.price,
      quantity: it.quantity,
      subtotal: (it.price || 0) * (it.quantity || 0),
      coverImage: it.coverImage
    }));
    const totalAmount = orderItems.reduce((sum: number, it: any) => sum + it.subtotal, 0);

    // Generate orderId manually so we can also set merchantTransactionId before first insert
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    const orderId = `ORD-${Date.now()}-${rand}`;

    const isCOD = paymentMethod === 'cod';
    
    const order = await Order.create({
      userId,
      orderId,
      merchantTransactionId: orderId,
      items: orderItems,
      totalAmount,
      paymentStatus: isCOD ? 'pending' : 'pending', // COD stays pending until delivery
      paymentMethod: isCOD ? 'cod' : 'online',
      status: isCOD ? 'confirmed' : 'created', // COD orders are confirmed immediately
      shippingAddress,
      trackingInfo: {
        orderPlaced: { status: isCOD ? 'Order placed (Cash on Delivery)' : 'Order placed (pending payment)', timestamp: new Date() },
        ...(isCOD ? { confirmed: { status: 'Order confirmed - Cash on Delivery', timestamp: new Date() } } : {})
      }
    });

    // Automatically create Shiprocket shipment for COD orders if enabled
    const autoCreateShipment = process.env.SHIPROCKET_AUTO_CREATE !== 'false';
    const hasShiprocketCredentials = process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD;
    
    if (isCOD && autoCreateShipment && hasShiprocketCredentials && !order.shiprocketShipmentId) {
      try {
        // Try to get primary pickup location from Shiprocket, fallback to env or default
        let pickupLocation: string = process.env.SHIPROCKET_PICKUP_LOCATION || '';
        if (!pickupLocation) {
          try {
            const primaryLocation = await shiprocketService.getPrimaryPickupLocation();
            if (primaryLocation) {
              pickupLocation = primaryLocation;
              console.log('[ORDER][CREATE] Fetched primary pickup location from Shiprocket:', pickupLocation);
            }
          } catch (err) {
            console.warn('[ORDER][CREATE] Could not fetch pickup location, using default');
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
          payment_method: 'COD' as const,
          sub_total: order.totalAmount,
          weight: Math.max(0.5, order.items.reduce((sum, item) => sum + item.quantity, 0) * 0.5),
          length: 25,
          breadth: 20,
          height: Math.max(2, order.items.reduce((sum, item) => sum + item.quantity, 0) * 2),
        };

        console.log('[ORDER][CREATE] Creating Shiprocket shipment for COD order:', order.orderId);
        const shipmentResponse = await shiprocketService.createShipment(shipmentData);
        console.log('[ORDER][CREATE] Shiprocket shipment created successfully:', {
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
        console.log('[ORDER][CREATE] Order updated with Shiprocket shipment data');
      } catch (shipmentError: any) {
        // Log error but don't fail order creation
        console.error('[ORDER][CREATE] Shiprocket shipment creation failed for COD order:', shipmentError);
        // Order is still created, shipment can be created manually later
      }
    }

    return NextResponse.json({ success: true, message: 'Order created', data: { orderId: order.orderId, id: order._id, totalAmount } });
  } catch (e) {
    console.error('Order create error:', e);
    return NextResponse.json({ success: false, message: 'Failed to create order' }, { status: 500 });
  }
}