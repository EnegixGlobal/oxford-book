import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAuth, AuthenticatedRequest } from '@/middleware/auth';
import Order from '@/models/Order';
import {
  StandardCheckoutClient,
  Env,
  MetaInfo,
  StandardCheckoutPayRequest,
} from 'pg-sdk-node';

// PHONEPE CONFIGURATION COMMENTED OUT - Using Razorpay instead
// Initialize PhonePe client (singleton)
// const clientId = String(process.env.PHONEPAY_PG_CLIENT_ID || '');
// const clientSecret = String(process.env.PHONEPAY_PG_CLIENT_SECRET || '');
// const clientVersion = Number(process.env.PHONEPAY_PG_CLIENT_VERSION || 2);
// // Allow overriding environment explicitly (PHONEPE_ENV=PRODUCTION) otherwise default SANDBOX
// const phonepeEnv = (process.env.PHONEPE_ENV || 'SANDBOX').toUpperCase();
// const env = phonepeEnv === 'PRODUCTION' ? Env.PRODUCTION : Env.SANDBOX;

// let phonepeClient: StandardCheckoutClient | null = null;
// function getClient() {
//   if (!phonepeClient) {
//     phonepeClient = StandardCheckoutClient.getInstance(
//       clientId,
//       clientSecret,
//       clientVersion,
//       env
//     );
//   }
//   return phonepeClient;
// }

// PHONEPE ENDPOINT DISABLED - Using Razorpay instead
export async function POST(req: NextRequest) {
  return NextResponse.json(
    { success: false, message: 'PhonePe integration is disabled. Please use Razorpay.' },
    { status: 410 } // 410 Gone - indicates the resource is no longer available
  );
  
  /* COMMENTED OUT - PhonePe implementation
  try {
    // Auth (customer or admin allowed, but typically customer)
    const authResult = await requireAuth(req);
    if (authResult) return authResult; // error response
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;

    const { orderId } = await req.json();
    if (!orderId) {
      return NextResponse.json({ success: false, message: 'orderId is required' }, { status: 400 });
    }

    await connectDB();

    const order = await Order.findOne({ orderId, userId });
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    if (order.paymentStatus === 'paid') {
      return NextResponse.json({ success: false, message: 'Order already paid' }, { status: 400 });
    }

    const metaInfo = MetaInfo.builder().udf1('udf1').udf2('udf2').build();
  const baseUrl = process.env.PUBLIC_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const redirectUrl = `${baseUrl}/checkout/success?orderId=${order._id}`;
  // Optional server-side callback (recommended for reliable confirmation)
  const callbackUrl = process.env.PHONEPE_CALLBACK_URL || `${baseUrl}/api/payments/phonepe/callback`;

    // Amount must be integer paise and >= 100 (₹1). Truncate any decimals and enforce min.
    const paiseAmount = Math.max(100, Math.trunc(order.totalAmount * 100));
    if (!Number.isFinite(paiseAmount) || paiseAmount <= 0) {
      return NextResponse.json({ success: false, message: 'Invalid amount for payment' }, { status: 400 });
    }

    const builder: any = StandardCheckoutPayRequest.builder()
      .merchantOrderId(order.orderId)
      .amount(paiseAmount)
      .redirectUrl(redirectUrl)
      .metaInfo(metaInfo);

    // Attach callbackUrl if SDK supports it (some versions expose callbackUrl function)
    try {
      if (typeof builder.callbackUrl === 'function') {
        builder.callbackUrl(callbackUrl);
      }
    } catch (e) {
      console.warn('[PHONEPE][CREATE] Unable to set callbackUrl', e);
    }

    // Opportunistically add merchantUserId / mobileNumber if SDK supports & we have data
    try {
      if (typeof builder.merchantUserId === 'function') builder.merchantUserId(userId);
      const possiblePhone = (authReq.user as any)?.phone;
      if (possiblePhone && typeof builder.mobileNumber === 'function') builder.mobileNumber(possiblePhone);
    } catch (e) {
      console.warn('Optional user fields not attached to PhonePe builder', e);
    }

    const payReq = builder.build();
  console.log('[PHONEPE][CREATE] Request', { merchantOrderId: order.orderId, amount: paiseAmount, redirectUrl, env: phonepeEnv });

    const client = getClient();
  const response = await client.pay(payReq);
  console.log('[PHONEPE][CREATE] Raw response', response);

    if (!response) {
      console.error('[PHONEPE][CREATE] Empty response from SDK');
      return NextResponse.json({ success: false, message: 'Failed to initiate payment' }, { status: 500 });
    }

    // Persist gateway order id / reference
    if (response.orderId) {
      order.paymentOrderId = response.orderId;
    }
    // Some SDKs may expose a transaction / provider reference id differently; keep future-proof placeholder
    if ((response as any).transactionId && !order.paymentGatewayTxnId) {
      order.paymentGatewayTxnId = (response as any).transactionId;
    }
    await order.save();

    // If success returned immediately (rare), mark paid
    if (response.state === 'SUCCESS') {
      const now = new Date();
      order.paymentStatus = 'paid';
      order.paymentCompletedAt = now;
      order.status = 'confirmed';
      order.trackingInfo = {
        ...order.trackingInfo,
        orderPlaced: order.trackingInfo?.orderPlaced || { status: 'Order placed successfully', timestamp: now },
        confirmed: { status: 'Payment confirmed', timestamp: now }
      } as any;
      await order.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Payment order created',
      data: {
        orderMongoId: order._id,
        merchantOrderId: order.orderId,
        paymentOrderId: response.orderId,
        redirectUrl: response.redirectUrl,
        state: response.state,
        debug: process.env.NODE_ENV !== 'production' ? { responseState: response.state } : undefined
      }
    });
  } catch (error: any) {
    console.error('PhonePe payment create error:', error?.response || error);
    return NextResponse.json({ success: false, message: 'Payment initiation failed' }, { status: 500 });
  }
  */
}