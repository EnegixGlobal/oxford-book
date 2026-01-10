import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Book from '@/models/Book';
import { requireAdmin } from '@/middleware/auth';
import Author from '@/models/Author';

// helper to make a URL-safe slug
const makeSlug = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

// ensure slug uniqueness by appending -2, -3, ... if needed
async function generateUniqueSlug(base: string, excludeId?: string) {
  let slug = base;
  let attempt = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await Book.exists(
      excludeId
        ? { slug, _id: { $ne: excludeId } }
        : { slug }
    );
    if (!exists) return slug;
    attempt += 1;
    slug = `${base}-${attempt}`;
  }
}

// Resolve author document by id or name
type LeanAuthor = { _id: any; name: string } | null;
async function resolveAuthor(authorId?: string | null, authorName?: string | null): Promise<LeanAuthor> {
  if (authorId) {
    try {
      const a = (await Author.findById(authorId).select('_id name').lean()) as any;
      if (a && a._id) return { _id: a._id, name: a.name } as { _id: any; name: string };
    } catch {}
  }
  if (authorName && authorName.trim()) {
    const a = (await Author.findOne({ name: authorName.trim() }).select('_id name').lean()) as any;
    if (a && a._id) return { _id: a._id, name: a.name } as { _id: any; name: string };
  }
  return null;
}

// Recalculate and persist booksCount for a given author
async function recalcBooksCountForAuthor(author: { _id: any; name: string }) {
  if (!author) return;
  const count = await Book.countDocuments({
    $or: [
      { authorId: author._id },
      { authorId: { $exists: false }, authorName: author.name },
      { authorId: null, authorName: author.name },
    ],
  });
  await Author.updateOne({ _id: author._id }, { $set: { booksCount: count < 0 ? 0 : count } });
}

// GET /api/admin/books - list books with pagination + search + filters
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult) return authResult;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
    const subcategory = searchParams.get('subcategory') || '';
    const featured = searchParams.get('featured');
  const ageGroup = searchParams.get('ageGroup') || '';
  const genre = searchParams.get('genre') || '';
  const anticipated = searchParams.get('anticipated');
  const bestseller = searchParams.get('bestseller');

    await connectDB();

    const query: any = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { authorName: { $regex: search, $options: 'i' } },
        { isbn: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) query.categorySlug = category;
  if (subcategory) query.subcategorySlug = subcategory;
  if (featured === 'true') query.featured = true;
    if (featured === 'false') query.featured = false;
  if (ageGroup) query.ageGroup = ageGroup;
  if (genre) query.genre = genre;
  if (anticipated === 'true') query.anticipated = true;
  if (anticipated === 'false') query.anticipated = false;
  if (bestseller === 'true') query.bestseller = true;
  if (bestseller === 'false') query.bestseller = false;

    const skip = (page - 1) * limit;
    
    // Sort featured by featuredOrder, bestsellers by bestsellerOrder, new releases by newReleaseOrder, then by createdAt
    let sortCriteria: any = { createdAt: -1 };
    if (featured === 'true') {
      sortCriteria = { featuredOrder: 1, createdAt: -1 };
    } else if (bestseller === 'true') {
      sortCriteria = { bestsellerOrder: 1, createdAt: -1 };
    } else {
      const newRelease = searchParams.get('newRelease');
      if (newRelease === 'true') {
        sortCriteria = { newReleaseOrder: 1, createdAt: -1 };
      }
    }
    
    const [items, total] = await Promise.all([
      Book.find(query)
        .sort(sortCriteria)
        .skip(skip)
        .limit(limit)
        .lean(),
      Book.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit) || 1;
    return NextResponse.json({
      success: true,
      data: items,
      pagination: {
        page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Admin books GET error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/books - create book
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult) return authResult;

    const body = await request.json();
    await connectDB();

    const {
      title,
      author,
      authorId,
      description,
      coverImage,
      category,
      subcategory,
      stock,
      mrp,
      discountedPrice,
      discount,
      isbn,
      publisher,
      binding,
      language,
      featured,
      featuredOrder,
      anticipated,
      bestseller,
      bestsellerOrder,
      newRelease,
      newReleaseOrder,
      ageGroup,
      genre,
      awardWinner,
      schoolLibrary,
    } = body;

    if (!title || !author || !category || mrp == null || discountedPrice == null || !isbn) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    // Ensure uniqueness constraints
    const existingIsbn = await Book.findOne({ isbn });
    if (existingIsbn) return NextResponse.json({ success: false, message: 'ISBN already exists' }, { status: 409 });

    // compute slug
    const baseSlug = makeSlug(title);
    const uniqueSlug = await generateUniqueSlug(baseSlug);

    const newBook = new Book({
      title,
      slug: uniqueSlug,
      authorName: author,
      authorId: authorId || undefined,
      description: typeof description === 'string' && description.trim() ? description.trim() : undefined,
      coverImage: typeof coverImage === 'string' && coverImage !== '{}' ? coverImage : undefined,
      categorySlug: category,
  subcategorySlug: subcategory || undefined,
  ageGroup: ageGroup || undefined,
  genre: genre || undefined,
      stock: Number(stock) || 0,
      inStock: (Number(stock) || 0) > 0,
      mrp: Number(mrp),
      discountedPrice: Number(discountedPrice),
      discount: Number(discount) || 0,
      isbn,
      publisher,
      binding,
      language,
      featured: !!featured,
      featuredOrder: featuredOrder !== undefined ? Number(featuredOrder) || 0 : undefined,
      anticipated: !!anticipated,
      bestseller: !!bestseller,
      bestsellerOrder: bestsellerOrder !== undefined ? Number(bestsellerOrder) || 0 : undefined,
      newRelease: !!newRelease,
      newReleaseOrder: newReleaseOrder !== undefined ? Number(newReleaseOrder) || 0 : undefined,
      awardWinner: !!awardWinner,
      schoolLibrary: !!schoolLibrary,
    });

    await newBook.save();

    // Update author's booksCount
  const targetAuthor = await resolveAuthor(authorId, author);
  if (targetAuthor) await recalcBooksCountForAuthor(targetAuthor);

    return NextResponse.json({ success: true, message: 'Book created', data: newBook }, { status: 201 });
  } catch (error: any) {
    console.error('Admin books POST error:', error);
    if (error.code === 11000) {
      return NextResponse.json({ success: false, message: 'Duplicate key error' }, { status: 409 });
    }
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError' && error.errors) {
      const validationErrors = Object.values(error.errors).map((err: any) => {
        // Use the error message if available, otherwise format the path
        if (err.message) return err.message;
        // Convert path like "authorName" to "Author name is required"
        const fieldName = err.path?.charAt(0).toUpperCase() + err.path?.slice(1).replace(/([A-Z])/g, ' $1');
        return `${fieldName} is required`;
      });
      const errorMessage = validationErrors.length > 0 
        ? validationErrors.join(', ') 
        : 'Validation failed';
      return NextResponse.json({ success: false, message: errorMessage }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/books?id=BOOK_ID - update book
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult) return authResult;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'Book ID is required' }, { status: 400 });

    const body = await request.json();
    await connectDB();

    const update: any = {};
    const map = (
      srcKey: string,
      destKey: string,
      transform?: (v: any) => any,
    ) => {
      if (body[srcKey] !== undefined) update[destKey] = transform ? transform(body[srcKey]) : body[srcKey];
    };

  map('title', 'title');
    map('author', 'authorName');
  map('description', 'description');
  map('authorId', 'authorId');
    // Only update coverImage if the client provided a non-empty string
    if (body.coverImage !== undefined) {
      const v = typeof body.coverImage === 'string' ? body.coverImage.trim() : '';
      if (v) update.coverImage = v;
    }
    map('category', 'categorySlug');
    map('subcategory', 'subcategorySlug');
  map('stock', 'stock', (v) => Number(v));
    map('mrp', 'mrp', (v) => Number(v));
    map('discountedPrice', 'discountedPrice', (v) => Number(v));
    map('discount', 'discount', (v) => Number(v));
    map('isbn', 'isbn');
    map('publisher', 'publisher');
    map('binding', 'binding');
  map('language', 'language');
  map('featured', 'featured', (v) => !!v);
  map('featuredOrder', 'featuredOrder', (v) => Number(v) || 0);
  map('ageGroup', 'ageGroup');
  map('genre', 'genre');
  map('anticipated', 'anticipated', (v) => !!v);
  map('bestseller', 'bestseller', (v) => !!v);
  map('bestsellerOrder', 'bestsellerOrder', (v) => Number(v) || 0);
  map('newRelease', 'newRelease', (v) => !!v);
  map('newReleaseOrder', 'newReleaseOrder', (v) => Number(v) || 0);
  map('awardWinner', 'awardWinner', (v) => !!v);
  map('schoolLibrary', 'schoolLibrary', (v) => !!v);

    // if title is being updated, recompute a unique slug
    if (typeof body.title === 'string' && body.title.trim().length > 0) {
      const baseSlug = makeSlug(body.title);
      update.slug = await generateUniqueSlug(baseSlug, id);
    }

    // Get existing book to detect author change
  const existing = (await Book.findById(id).lean()) as any;
    const updated = await Book.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!updated) return NextResponse.json({ success: false, message: 'Book not found' }, { status: 404 });

    // Recalculate booksCount for affected authors if author changed
    try {
  const oldAuthor = existing ? await resolveAuthor(existing.authorId as any, existing.authorName as any) : null;
  const newAuthor = await resolveAuthor((updated as any).authorId as any, (updated as any).authorName as any);
  const tasks: Promise<any>[] = [];
  if (oldAuthor) tasks.push(recalcBooksCountForAuthor(oldAuthor));
  if (newAuthor && (!oldAuthor || String(newAuthor._id) !== String(oldAuthor._id))) tasks.push(recalcBooksCountForAuthor(newAuthor));
  if (tasks.length) await Promise.all(tasks);
    } catch {}

    return NextResponse.json({ success: true, message: 'Book updated', data: updated });
  } catch (error: any) {
    console.error('Admin books PUT error:', error);
    if (error.code === 11000) {
      return NextResponse.json({ success: false, message: 'Duplicate key error' }, { status: 409 });
    }
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError' && error.errors) {
      const validationErrors = Object.values(error.errors).map((err: any) => {
        // Use the error message if available, otherwise format the path
        if (err.message) return err.message;
        // Convert path like "authorName" to "Author name is required"
        const fieldName = err.path?.charAt(0).toUpperCase() + err.path?.slice(1).replace(/([A-Z])/g, ' $1');
        return `${fieldName} is required`;
      });
      const errorMessage = validationErrors.length > 0 
        ? validationErrors.join(', ') 
        : 'Validation failed';
      return NextResponse.json({ success: false, message: errorMessage }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/books?id=BOOK_ID - delete book
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult) return authResult;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'Book ID is required' }, { status: 400 });

    await connectDB();
    const deleted = await Book.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ success: false, message: 'Book not found' }, { status: 404 });

    // Update author's booksCount after deletion
    try {
  const a = await resolveAuthor((deleted as any).authorId as any, (deleted as any).authorName as any);
  if (a) await recalcBooksCountForAuthor(a);
    } catch {}

    return NextResponse.json({ success: true, message: 'Book deleted' });
  } catch (error) {
    console.error('Admin books DELETE error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
