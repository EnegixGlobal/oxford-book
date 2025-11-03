import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Book from '@/models/Book';
import Author from '@/models/Author';
import { sampleBooks } from '@/lib/sampleData';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '12', 10);
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const subcategory = searchParams.get('subcategory') || '';
  const featured = searchParams.get('featured');
  const bestseller = searchParams.get('bestseller');
  const anticipated = searchParams.get('anticipated');
  const ageGroup = searchParams.get('ageGroup') || '';
  const genre = searchParams.get('genre') || '';
  const authorId = searchParams.get('authorId');
  const authorSlug = searchParams.get('authorSlug');
  const authorNameParam = searchParams.get('authorName');

  try {
    await connectDB();

    const query: any = {};
    const andClauses: any[] = [];

    if (search) {
      andClauses.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { authorName: { $regex: search, $options: 'i' } },
          { isbn: { $regex: search, $options: 'i' } },
        ]
      });
    }
    if (category) andClauses.push({ categorySlug: category });
    if (subcategory) andClauses.push({ subcategorySlug: subcategory });
    if (featured === 'true') andClauses.push({ featured: true });
    if (featured === 'false') andClauses.push({ featured: false });
    if (anticipated === 'true') andClauses.push({ anticipated: true });
    if (anticipated === 'false') andClauses.push({ anticipated: false });
    if (ageGroup) andClauses.push({ ageGroup });
    if (genre) andClauses.push({ genre });
    if (bestseller === 'true') andClauses.push({ bestseller: true });
    if (bestseller === 'false') andClauses.push({ bestseller: false });

    // Author filters: support authorId, authorSlug, authorName
    let resolvedAuthorId: string | null = null;
    let resolvedAuthorName: string | null = authorNameParam && authorNameParam.trim() ? authorNameParam.trim() : null;
    if (authorSlug) {
      const a = (await Author.findOne({ slug: authorSlug }).select('_id name').lean()) as any;
      if (a && a._id) {
        resolvedAuthorId = String(a._id);
        resolvedAuthorName = a.name as string;
      }
    }
    if (authorId) resolvedAuthorId = authorId;

    const authorOr: any[] = [];
    if (resolvedAuthorId) authorOr.push({ authorId: resolvedAuthorId });
    if (resolvedAuthorName) {
      // match name-only entries (no authorId stored)
      authorOr.push({ authorId: { $exists: false }, authorName: resolvedAuthorName });
      authorOr.push({ authorId: null, authorName: resolvedAuthorName });
    }
    if (authorOr.length) andClauses.push({ $or: authorOr });

    if (andClauses.length) Object.assign(query, { $and: andClauses });

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Book.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Book.countDocuments(query)
    ]);

    return NextResponse.json({
      success: true,
      data: items,
      pagination: {
        page,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        totalItems: total,
        itemsPerPage: limit,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      }
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    // Fallback to sample data if DB not available
    let books = [...sampleBooks];
    if (category) books = books.filter(b => b.category === category);
    if (ageGroup) books = books.filter((b: any) => (b as any).ageGroup === ageGroup);
    if (featured === 'true') books = books.filter(b => (b as any).featured);
    if (anticipated === 'true') books = books.filter((b: any) => (b as any).anticipated);
    if (bestseller === 'true') books = books.filter((b: any) => (b as any).bestseller);
    const limited = books.slice(0, limit);
    return NextResponse.json({ success: true, data: limited, pagination: { page: 1, totalPages: 1, totalItems: limited.length, itemsPerPage: limit, hasNext: false, hasPrev: false } });
  }
}

// POST is not used for public books in this app; keeping for compatibility
export async function POST(_request: NextRequest) {
  return NextResponse.json({ success: false, message: 'Not allowed' }, { status: 405 });
}