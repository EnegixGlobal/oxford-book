import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ForthcomingTitle from '@/models/ForthcomingTitle';

export const dynamic = 'force-dynamic';

// GET forthcoming title
export async function GET() {
  try {
    await connectDB();
    const setting = await ForthcomingTitle.findOne().sort({ updatedAt: -1 }).lean();
    return NextResponse.json({ success: true, data: setting });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST/PUT - create or update (only one setting)
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    
    const setting = await ForthcomingTitle.findOneAndUpdate(
      {},
      {
        title: body.title,
        description: body.description || '',
        isActive: body.isActive ?? true,
      },
      { new: true, upsert: true }
    );
    
    return NextResponse.json({ success: true, data: setting });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
