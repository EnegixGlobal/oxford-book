import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Author from '@/models/Author';

// Public: GET /api/authors - list authors with pagination/search/featured filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const search = searchParams.get('search') || '';
    const featured = searchParams.get('featured');

    await connectDB();

    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { nationality: { $regex: search, $options: 'i' } },
      ];
    }
    if (featured === 'true') query.featured = true;
    if (featured === 'false') query.featured = false;

    const skip = (page - 1) * limit;
    const [authors, total] = await Promise.all([
      Author.find(query)
        .select('name slug nationality profileImage featured booksCount biography createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Author.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return NextResponse.json({
      success: true,
      data: authors,
      pagination: {
        page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    });
  } catch (error) {
    console.error('Public Get authors error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
