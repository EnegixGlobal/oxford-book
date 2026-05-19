import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import HomeSection from '@/models/HomeSection';
import Book from '@/models/Book';

export const dynamic = 'force-dynamic';

// GET all homepage sections (for admin list)
export async function GET() {
  try {
    await connectDB();
    const sections = await HomeSection.find().sort({ order: 1, createdAt: -1 }).lean();
    
    // Populate books for admin view
    const populated = await Promise.all(
      sections.map(async (section: any) => {
        const bookIds = section.books?.map((b: any) => b.bookId) || [];
        const books = await Book.find({ _id: { $in: bookIds } })
          .select('_id title slug coverImage mrp discountedPrice discount inStock stock')
          .lean();
          
        const sortedBooks = section.books
          ?.sort((a: any, b: any) => a.order - b.order)
          .map((item: any) => {
            const book = books.find((b: any) => b._id.toString() === item.bookId.toString());
            return book ? { ...book, order: item.order } : null;
          })
          .filter(Boolean) || [];
          
        return { ...section, books: sortedBooks };
      })
    );
    
    return NextResponse.json({ success: true, data: populated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST create homepage section
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    
    if (!body.title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }
    
    const section = await HomeSection.create({
      title: body.title,
      description: body.description,
      isActive: body.isActive ?? true,
      order: body.order ?? 0,
      books: body.books || [],
    });
    
    return NextResponse.json({ success: true, data: section }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT update homepage section
export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }
    
    const section = await HomeSection.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!section) {
      return NextResponse.json({ success: false, error: 'Section not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: section });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE homepage section
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }
    
    await HomeSection.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
