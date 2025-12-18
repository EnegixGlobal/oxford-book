import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SmallBanner from '@/models/SmallBanner';

// GET all small banners
export async function GET() {
  try {
    await connectDB();
    const banners = await SmallBanner.find().sort({ position: 1 }).lean();
    return NextResponse.json({ success: true, data: banners });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST create or update small banner
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    
    // Upsert by position
    const banner = await SmallBanner.findOneAndUpdate(
      { position: body.position },
      {
        image: body.image,
        text: body.text,
        link: body.link,
        position: body.position,
        isActive: body.isActive ?? true,
      },
      { new: true, upsert: true }
    );
    
    return NextResponse.json({ success: true, data: banner });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE small banner
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const position = searchParams.get('position');
    
    if (!position) {
      return NextResponse.json({ success: false, error: 'Position required' }, { status: 400 });
    }
    
    await SmallBanner.findOneAndDelete({ position: Number(position) });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

