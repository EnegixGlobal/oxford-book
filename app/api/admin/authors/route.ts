import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Author, { IAuthor } from '@/models/Author';
import { requireAdmin } from '@/middleware/auth';

// GET /api/admin/authors - List authors with pagination and search
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult) return authResult;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
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
      Author.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
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
    console.error('Get authors error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/authors - Create author
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult) return authResult;

    const body = await request.json();
    const { name, nationality, biography, profileImage, featured } = body;

    // Basic input validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 });
    }
    if (name.length > 100) {
      return NextResponse.json({ success: false, message: 'Author name cannot be more than 100 characters' }, { status: 400 });
    }
    if (typeof nationality === 'string' && nationality.length > 60) {
      return NextResponse.json({ success: false, message: 'Nationality cannot be more than 60 characters' }, { status: 400 });
    }
    if (typeof biography === 'string' && biography.length > 2000) {
      return NextResponse.json({ success: false, message: 'Biography cannot be more than 2000 characters' }, { status: 400 });
    }

    await connectDB();

    // Enforce unique name by slug logic
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const existingBySlug = await Author.findOne({ slug });
    if (existingBySlug) {
      return NextResponse.json({ success: false, message: 'Author with this name already exists' }, { status: 409 });
    }

    const author = new Author({
      name,
      slug,
      nationality: nationality || '',
      biography: biography || '',
      profileImage: typeof profileImage === 'string' && profileImage !== '{}' ? profileImage : '',
      featured: !!featured,
      booksCount: 0,
    });

    await author.save();

    return NextResponse.json({ success: true, message: 'Author created successfully', data: author }, { status: 201 });
  } catch (error: any) {
    console.error('Create author error:', error);
    if (error.code === 11000) {
      return NextResponse.json({ success: false, message: 'Author with this name already exists' }, { status: 409 });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors || {}).map((e: any) => e.message);
      return NextResponse.json({ success: false, message: messages[0] || 'Validation error' }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/authors?id=AUTHOR_ID - Update author
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult) return authResult;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, message: 'Author ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { name, nationality, biography, profileImage, featured } = body;

    await connectDB();

    const updateData: Partial<IAuthor> & any = {};

    if (name) {
      const newSlug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const conflict = await Author.findOne({ slug: newSlug, _id: { $ne: id } });
      if (conflict) {
        return NextResponse.json({ success: false, message: 'Another author with this name exists' }, { status: 409 });
      }
      if (name.length > 100) {
        return NextResponse.json({ success: false, message: 'Author name cannot be more than 100 characters' }, { status: 400 });
      }
      updateData.name = name;
      updateData.slug = newSlug;
    }
    if (typeof nationality === 'string') {
      if (nationality.length > 60) {
        return NextResponse.json({ success: false, message: 'Nationality cannot be more than 60 characters' }, { status: 400 });
      }
      updateData.nationality = nationality;
    }
    if (typeof biography === 'string') {
      if (biography.length > 2000) {
        return NextResponse.json({ success: false, message: 'Biography cannot be more than 2000 characters' }, { status: 400 });
      }
      updateData.biography = biography;
    }
    const imageUrl = typeof profileImage === 'string' && profileImage !== '{}' ? profileImage : '';
    if (imageUrl) updateData.profileImage = imageUrl;
    if (typeof featured === 'boolean') updateData.featured = featured;

    const updated = await Author.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!updated) {
      return NextResponse.json({ success: false, message: 'Author not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Author updated successfully', data: updated });
  } catch (error: any) {
    console.error('Update author error:', error);
    if (error.code === 11000) {
      return NextResponse.json({ success: false, message: 'Author with this name already exists' }, { status: 409 });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors || {}).map((e: any) => e.message);
      return NextResponse.json({ success: false, message: messages[0] || 'Validation error' }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/authors?id=AUTHOR_ID - Delete author
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult) return authResult;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, message: 'Author ID is required' }, { status: 400 });
    }

    await connectDB();
    const deleted = await Author.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Author not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Author deleted successfully' });
  } catch (error) {
    console.error('Delete author error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
