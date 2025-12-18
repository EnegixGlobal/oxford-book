import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PromoBanner from '@/models/PromoBanner';

export async function GET() {
  try {
    await connectDB();
    const banner = await PromoBanner.findOne({ isActive: true }).lean();
    console.log('Fetched promo banner:', banner);
    return NextResponse.json({ success: true, data: banner });
  } catch (error: any) {
    console.error('Error fetching banner:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

