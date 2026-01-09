import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import NewReleaseList from '@/models/NewReleaseList';
import Book from '@/models/Book';

// GET all new release lists
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const lists = await NewReleaseList.find().sort({ createdAt: -1 }).lean();
    
    // Populate books for each list
    const populatedLists = await Promise.all(
      lists.map(async (list: any) => {
        const bookIds = list.books?.map((b: any) => b.bookId) || [];
        const books = await Book.find({ _id: { $in: bookIds } })
          .select('_id title slug coverImage mrp discountedPrice discount inStock stock')
          .lean();
        
        // Sort books by order
        const sortedBooks = list.books
          ?.sort((a: any, b: any) => a.order - b.order)
          .map((item: any) => {
            const book = books.find((b: any) => b._id.toString() === item.bookId.toString());
            return book ? { ...book, order: item.order } : null;
          })
          .filter(Boolean) || [];
        
        return { ...list, books: sortedBooks };
      })
    );
    
    return NextResponse.json({ success: true, data: populatedLists });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST create new release list
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    
    const list = await NewReleaseList.create({
      title: body.title,
      description: body.description,
      slug: body.slug || body.title?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      isActive: body.isActive ?? true,
      books: body.books || [],
    });
    
    return NextResponse.json({ success: true, data: list }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT update new release list
export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
    }
    
    const list = await NewReleaseList.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!list) {
      return NextResponse.json({ success: false, error: 'List not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: list });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE new release list
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
    }
    
    await NewReleaseList.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

