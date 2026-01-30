import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import connectDB from '@/lib/mongodb';
import { requireAuth, AuthenticatedRequest } from '@/middleware/auth';
import Order from '@/models/Order';

let razorpayInstance: Razorpay | null = null;

function getRazorpay() {
  if (!razorpayInstance) {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      throw new Error('RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not configured');
    }

    razorpayInstance = new Razorpay({
      key_id,
      key_secret,
    });
  }
  return razorpayInstance;
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult) return authResult;
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;

    const { orderId } = await req.json();
    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'orderId is required' },
        { status: 400 }
      );
    }

    await connectDB();
    const order = await Order.findOne({ orderId, userId });
    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.paymentStatus === 'paid') {
      return NextResponse.json(
        { success: false, message: 'Order already paid' },
        { status: 400 }
      );
    }

    const instance = getRazorpay();

    // amount in paise, minimum ₹1
    const amount = Math.max(100, Math.trunc(order.totalAmount * 100));
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid amount for payment' },
        { status: 400 }
      );
    }

    const options: any = {
      amount,
      currency: 'INR',
      receipt: String(order._id),
      notes: {
        mongoOrderId: String(order._id),
        merchantOrderId: order.orderId,
      },
    };

    const razorpayOrder = await instance.orders.create(options);

    // Persist Razorpay order id
    order.paymentOrderId = razorpayOrder.id;
    await order.save();

    return NextResponse.json({
      success: true,
      message: 'Razorpay order created',
      data: {
        orderMongoId: order._id,
        merchantOrderId: order.orderId,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error('[RAZORPAY][CREATE] Error', error);
    return NextResponse.json(
      { success: false, message: 'Failed to initiate payment' },
      { status: 500 }
    );
  }
}


