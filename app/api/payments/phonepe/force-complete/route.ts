import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAuth, AuthenticatedRequest } from '@/middleware/auth';
import Order from '@/models/Order';

// PHONEPE ENDPOINT DISABLED - Using Razorpay instead
// DEV ONLY: force mark order paid if stuck in pending during sandbox testing
export async function PATCH(req: NextRequest) {
  return NextResponse.json(
    { success: false, message: 'PhonePe integration is disabled. Please use Razorpay.' },
    { status: 410 } // 410 Gone - indicates the resource is no longer available
  );
  
  /* COMMENTED OUT - PhonePe implementation
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ success: false, message: 'Not allowed in production' }, { status: 403 });
  }
  const authResult = await requireAuth(req);
  if (authResult) return authResult;
  const authReq = req as AuthenticatedRequest;
  const { orderMongoId } = await req.json();
  if (!orderMongoId) return NextResponse.json({ success: false, message: 'orderMongoId required' }, { status: 400 });
  await connectDB();
  const order = await Order.findById(orderMongoId);
  if (!order) return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
  if (String(order.userId) !== authReq.user!.id && authReq.user!.role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }
  if (order.paymentStatus === 'paid') {
    return NextResponse.json({ success: true, message: 'Already paid', data: order });
  }
  const now = new Date();
  (order as any).trackingInfo = order.trackingInfo || {};
  order.paymentStatus = 'paid';
  order.status = 'confirmed';
  order.paymentCompletedAt = now;
  order.trackingInfo = {
    ...order.trackingInfo,
    orderPlaced: order.trackingInfo?.orderPlaced || { status: 'Order placed successfully', timestamp: now },
    confirmed: { status: 'Payment confirmed (manual)' , timestamp: now }
  } as any;
  await order.save();
  return NextResponse.json({ success: true, data: order });
  */
}
