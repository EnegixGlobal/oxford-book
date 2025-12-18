import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PromoBanner from '@/models/PromoBanner';

// GET promo banner
export async function GET() {
  try {
    await connectDB();
    const banner = await PromoBanner.findOne().sort({ updatedAt: -1 }).lean();
    return NextResponse.json({ success: true, data: banner });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST/PUT - create or update (only one banner)
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    
    console.log('Saving promo banner - received body:', JSON.stringify(body, null, 2));
    
    // Upsert - update existing or create new
    const banner = await PromoBanner.findOneAndUpdate(
      {},
      {
        image: body.image,
        link: body.link,
        altText: body.altText || '',
        title: body.title || '',
        description: body.description || '',
        buttonText: body.buttonText || 'Click Here',
        isActive: body.isActive ?? true,
      },
      { new: true, upsert: true }
    );
    
    console.log('Saved banner:', banner);
    
    return NextResponse.json({ success: true, data: banner });
  } catch (error: any) {
    console.error('Error saving banner:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

