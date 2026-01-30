import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import NewReleaseList from '@/models/NewReleaseList';
import Book from '@/models/Book';

// GET public new release lists (only active ones)
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    
    let query: any = { isActive: true };
    if (slug) {
      query.slug = slug;
    }
    
    const lists = await NewReleaseList.find(query).lean();
    
    // Populate books for each list
    const populatedLists = await Promise.all(
      lists.map(async (list: any) => {
        const bookIds = list.books?.map((b: any) => b.bookId) || [];
        const books = await Book.find({ _id: { $in: bookIds } })
          .select('_id title slug authorName coverImage mrp discountedPrice discount inStock stock')
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
    
    if (slug) {
      return NextResponse.json({ success: true, data: populatedLists[0] || null });
    }
    
    return NextResponse.json({ success: true, data: populatedLists });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

