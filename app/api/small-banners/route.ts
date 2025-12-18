import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SmallBanner from '@/models/SmallBanner';

export async function GET() {
  try {
    await connectDB();
    const banners = await SmallBanner.find({ isActive: true }).sort({ position: 1 }).lean();
    return NextResponse.json({ success: true, data: banners });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

