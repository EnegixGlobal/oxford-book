import { NextRequest, NextResponse } from 'next/server';
import { shiprocketService } from '@/lib/shiprocket';

/**
 * Get shipping rates from Shiprocket
 * GET /api/shiprocket/rates?pickup_pincode=XXX&delivery_pincode=XXX&weight=XXX&cod_amount=XXX
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const pickupPincode = searchParams.get('pickup_pincode');
    const deliveryPincode = searchParams.get('delivery_pincode');
    const weight = searchParams.get('weight');
    const codAmount = searchParams.get('cod_amount');

    if (!pickupPincode || !deliveryPincode || !weight) {
      return NextResponse.json(
        { success: false, message: 'pickup_pincode, delivery_pincode, and weight are required' },
        { status: 400 }
      );
    }

    const ratesData = await shiprocketService.getRates({
      pickup_pincode: pickupPincode,
      delivery_pincode: deliveryPincode,
      weight: parseFloat(weight),
      cod_amount: codAmount ? parseFloat(codAmount) : undefined,
    });

    return NextResponse.json({
      success: true,
      data: ratesData
    });
  } catch (error: any) {
    console.error('Shiprocket rates error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to get shipping rates' },
      { status: 500 }
    );
  }
}

