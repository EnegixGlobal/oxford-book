import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import HeroSlide from '@/models/HeroSlide';

export async function GET() {
  try {
    await connectDB();
    const slides = await HeroSlide.find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: slides });
  } catch (error) {
    console.error('Hero slides GET error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

