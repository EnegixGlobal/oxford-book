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
