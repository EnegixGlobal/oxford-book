import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Book from '@/models/Book';

export async function POST(req: NextRequest) {
  try {
    const { excludeIds = [], limit = 8 } = await req.json().catch(() => ({ excludeIds: [], limit: 8 }));
    await connectDB();
    const ids = Array.isArray(excludeIds) ? excludeIds.filter(Boolean) : [];
    const query: any = { inStock: true };
    if (ids.length) {
      query._id = { $nin: ids };
    }
    // Prefer featured / bestseller / anticipated ordering
    const books = await Book.find(query)
      .sort({ featured: -1, bestseller: -1, anticipated: -1, createdAt: -1 })
      .limit(Math.min(20, Math.max(1, Number(limit))))
      .lean();

    return NextResponse.json({ success: true, data: books });
  } catch (e) {
    console.error('Recommended books fetch error', e);
    return NextResponse.json({ success: false, message: 'Failed to load recommendations' }, { status: 500 });
  }
}
