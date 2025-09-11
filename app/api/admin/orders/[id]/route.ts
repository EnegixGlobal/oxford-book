import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAuth, AuthenticatedRequest } from '@/middleware/auth';
import Order from '@/models/Order';
import mongoose from 'mongoose';

// Next.js 15 dynamic API routes now provide params as a Promise that must be awaited.
interface AsyncRouteContext { params: Promise<{ id: string }> }
export async function PATCH(req: NextRequest, context: AsyncRouteContext) {
  try {
    const authResult = await requireAuth(req);
    if (authResult) return authResult;
    const authReq = req as AuthenticatedRequest;
    if (authReq.user?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }
  const { id } = await context.params; // await params per Next.js requirement
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid id' }, { status: 400 });
    }
    const { status, paymentStatus } = await req.json();
    if (!status && !paymentStatus) {
      return NextResponse.json({ success: false, message: 'Nothing to update' }, { status: 400 });
    }
    await connectDB();
    const order = await Order.findById(id);
    if (!order) return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });

    const allowedStatus = ['created','confirmed','shipped','delivered','cancelled'];
    const allowedPayment = ['pending','paid','failed'];
    if (status && !allowedStatus.includes(status)) {
      return NextResponse.json({ success: false, message: 'Invalid status value' }, { status: 400 });
    }
    if (paymentStatus && !allowedPayment.includes(paymentStatus)) {
      return NextResponse.json({ success: false, message: 'Invalid paymentStatus value' }, { status: 400 });
    }

    const now = new Date();
    if (typeof status === 'string' && status !== order.status) {
      order.status = status as any;
      if (status === 'confirmed') {
        order.trackingInfo = { ...order.trackingInfo, confirmed: { status: 'Order confirmed', timestamp: now } } as any;
      } else if (status === 'shipped') {
        order.trackingInfo = { ...order.trackingInfo, shipped: { status: 'Order shipped', timestamp: now } } as any;
      } else if (status === 'delivered') {
        order.trackingInfo = { ...order.trackingInfo, delivered: { status: 'Order delivered', timestamp: now } } as any;
      } else if (status === 'cancelled') {
        order.trackingInfo = { ...order.trackingInfo, cancelled: { status: 'Order cancelled', timestamp: now } } as any;
      }
    }
    if (typeof paymentStatus === 'string' && paymentStatus !== order.paymentStatus) {
      order.paymentStatus = paymentStatus as any;
      if (paymentStatus === 'paid') {
        order.paymentCompletedAt = order.paymentCompletedAt || now;
        order.trackingInfo = { ...order.trackingInfo, confirmed: order.trackingInfo?.confirmed || { status: 'Payment confirmed', timestamp: now } } as any;
      } else if (paymentStatus === 'failed') {
        order.trackingInfo = { ...order.trackingInfo, cancelled: order.trackingInfo?.cancelled || { status: 'Payment failed', timestamp: now } } as any;
      }
    }

    await order.save();
    return NextResponse.json({ success: true, data: order });
  } catch (e) {
    console.error('Admin order update error', e);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}