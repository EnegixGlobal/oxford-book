import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAuth, AuthenticatedRequest } from '@/middleware/auth';
import Order from '@/models/Order';

// Create a new order from cart payload before payment
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult) return authResult;
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;

    const body = await req.json();
    const { items, shippingAddress } = body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: 'Items are required' }, { status: 400 });
    }
    if (!shippingAddress || !shippingAddress.fullName) {
      return NextResponse.json({ success: false, message: 'Shipping address required' }, { status: 400 });
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

    const order = await Order.create({
      userId,
      orderId,
      merchantTransactionId: orderId,
      items: orderItems,
      totalAmount,
      paymentStatus: 'pending',
      status: 'created',
      shippingAddress,
      trackingInfo: {
        orderPlaced: { status: 'Order placed (pending payment)', timestamp: new Date() }
      }
    });

    return NextResponse.json({ success: true, message: 'Order created', data: { orderId: order.orderId, id: order._id, totalAmount } });
  } catch (e) {
    console.error('Order create error:', e);
    return NextResponse.json({ success: false, message: 'Failed to create order' }, { status: 500 });
  }
}