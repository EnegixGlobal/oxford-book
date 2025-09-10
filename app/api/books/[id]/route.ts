import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Book from '@/models/Book';
import { sampleBooks } from '@/lib/sampleData';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ success: false, message: 'Book ID is required' }, { status: 400 });

    try {
      await connectDB();
      const doc = await Book.findById(id).lean();
      if (!doc) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
      return NextResponse.json({ success: true, data: doc }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (dbErr) {
      // Fallback to sample data when DB not available
      const fallback = sampleBooks.find(b => String(b.id) === String(id));
      if (fallback) return NextResponse.json({ success: true, data: fallback });
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
