import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ForthcomingTitle from '@/models/ForthcomingTitle';

export const dynamic = 'force-dynamic';

// GET public forthcoming title (only active ones)
export async function GET() {
  try {
    await connectDB();
    const setting = await ForthcomingTitle.findOne({ isActive: true }).sort({ updatedAt: -1 }).lean();
    return NextResponse.json({ success: true, data: setting });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
