import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAuth, AuthenticatedRequest } from '@/middleware/auth';
import Order from '@/models/Order';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult) return authResult;
    const authReq = req as AuthenticatedRequest;
    if (authReq.user?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }
    await connectDB();
    const orders = await Order.find().sort({ createdAt: -1 }).limit(500).lean();
    // attach basic user info
  const rawIds = orders.map(o => String(o.userId)).filter(Boolean);
  const uniq = Array.from(new Set(rawIds));
  const userIds = uniq.filter(id => /^[0-9a-fA-F]{24}$/.test(id));
    let users: any[] = [];
    if (userIds.length > 0) {
      users = await User.find({ _id: { $in: userIds } }, { name: 1, email: 1 }).lean();
    }
    const userMap = new Map(users.map(u => [String(u._id), u]));
    const data = orders.map(o => ({
      _id: o._id,
      orderId: o.orderId,
      totalAmount: o.totalAmount,
      paymentStatus: o.paymentStatus,
      status: o.status,
      itemsCount: o.items?.length || 0,
      createdAt: o.createdAt,
      customer: userMap.get(String(o.userId))?.name || 'Unknown'
    }));
    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error('Admin orders fetch error', e);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
