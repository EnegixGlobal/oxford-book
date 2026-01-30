import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAuth, AuthenticatedRequest } from '@/middleware/auth';
import Order from '@/models/Order';
import mongoose from 'mongoose';

// Next.js (see sync-dynamic-apis message) now provides dynamic route params as an async value.
// We must await params before accessing its properties to avoid the runtime warning/error.
interface AsyncRouteContext { params: Promise<{ id: string }> }
export async function GET(request: NextRequest, context: AsyncRouteContext) {
  try {
    const authResult = await requireAuth(request);
    if (authResult) return authResult;
    const authReq = request as AuthenticatedRequest;
    const user = authReq.user!;
  const { id } = await context.params; // Await the params per Next.js requirement
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid order id' }, { status: 400 });
    }
    await connectDB();
    const order = await Order.findById(id).lean();
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }
    // Only owner or admin can view
    if (String(order.userId) !== user.id && user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ success: true, data: order });
  } catch (e) {
    console.error('Order fetch error', e);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// PATCH - Cancel a pending order (user can cancel their own pending orders)
export async function PATCH(request: NextRequest, context: AsyncRouteContext) {
  try {
    const authResult = await requireAuth(request);
    if (authResult) return authResult;
    const authReq = request as AuthenticatedRequest;
    const user = authReq.user!;
    const { id } = await context.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid order id' }, { status: 400 });
    }
    await connectDB();
    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }
    // Only owner or admin can cancel
    if (String(order.userId) !== user.id && user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }
    // Only allow cancelling orders that haven't been shipped or delivered
    // Customers can cancel orders in 'created' or 'confirmed' status (even if paid)
    if (order.status === 'cancelled' || order.status === 'shipped' || order.status === 'delivered') {
      return NextResponse.json({ 
        success: false, 
        message: 'Cannot cancel order that has been shipped or delivered' 
      }, { status: 400 });
    }
    const now = new Date();
    order.status = 'cancelled';
    // Only update payment status if it was pending (payment never completed)
    // If payment was already paid, keep it as paid (refunds handled separately)
    if (order.paymentStatus === 'pending') {
      order.paymentStatus = 'failed';
    }
    // If payment was 'paid', keep it as 'paid' since the payment was successful
    // The order cancellation is separate from payment status
    order.trackingInfo = {
      ...order.trackingInfo,
      cancelled: { status: 'Order cancelled by user', timestamp: now }
    } as any;
    await order.save();
    return NextResponse.json({ success: true, data: order, message: 'Order cancelled' });
  } catch (e) {
    console.error('Order cancel error', e);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// DELETE - Delete a pending order (user can delete their own pending/cancelled orders)
export async function DELETE(request: NextRequest, context: AsyncRouteContext) {
  try {
    const authResult = await requireAuth(request);
    if (authResult) return authResult;
    const authReq = request as AuthenticatedRequest;
    const user = authReq.user!;
    const { id } = await context.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid order id' }, { status: 400 });
    }
    await connectDB();
    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }
    // Only owner or admin can delete
    if (String(order.userId) !== user.id && user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }
    // Only allow deleting pending or cancelled orders (not paid orders)
    if (order.paymentStatus === 'paid') {
      return NextResponse.json({ 
        success: false, 
        message: 'Cannot delete paid orders' 
      }, { status: 400 });
    }
    const deletedOrder = await Order.findByIdAndDelete(id);
    if (!deletedOrder) {
      // Order might have been deleted already
      return NextResponse.json({ success: true, message: 'Order already deleted or not found' });
    }
    console.log(`Order ${id} deleted successfully`);
    return NextResponse.json({ success: true, message: 'Order deleted' });
  } catch (e) {
    console.error('Order delete error', e);
    return NextResponse.json({ success: false, message: 'Server error', error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}