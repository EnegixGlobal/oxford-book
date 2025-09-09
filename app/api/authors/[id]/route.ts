import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Author from '@/models/Author';

// Public: GET /api/authors/[id] - get author by id or slug
export async function GET(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
  const { id } = await ctx.params;
  const idOrSlug = id;
    const query = /^[0-9a-fA-F]{24}$/.test(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug };
    const author = await Author.findOne(query).select('name slug nationality profileImage featured booksCount biography createdAt');
    if (!author) {
      return NextResponse.json({ success: false, message: 'Author not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: author });
  } catch (error) {
    console.error('Public Get author detail error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
