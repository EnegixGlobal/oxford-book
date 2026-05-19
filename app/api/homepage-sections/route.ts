import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import HomeSection from '@/models/HomeSection';
import Book from '@/models/Book';

export const dynamic = 'force-dynamic';

// GET public dynamic homepage sections
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const section = await HomeSection.findById(id).lean();
      if (!section) {
        return NextResponse.json({ success: false, message: 'Section not found' }, { status: 404 });
      }
      
      const bookIds = section.books?.map((b: any) => b.bookId) || [];
      const books = await Book.find({ _id: { $in: bookIds } }).lean();
      
      const sortedBooks = section.books
        ?.sort((a: any, b: any) => a.order - b.order)
        .map((item: any) => {
          const book = books.find((b: any) => b._id.toString() === item.bookId.toString());
          return book ? book : null;
        })
        .filter(Boolean) || [];

      return NextResponse.json({
        success: true,
        data: {
          _id: section._id.toString(),
          title: section.title,
          description: section.description || '',
          order: section.order,
          books: sortedBooks,
        }
      });
    }
    
    // Fetch active home sections ordered by display order
    const sections = await HomeSection.find({ isActive: true }).sort({ order: 1 }).lean();
    
    // Populate books for each section based on their manual books list
    const populatedSections = await Promise.all(
      sections.map(async (section: any) => {
        const bookIds = section.books?.map((b: any) => b.bookId) || [];
        
        const books = await Book.find({ _id: { $in: bookIds } })
          .select('_id title slug authorName coverImage mrp discountedPrice discount inStock stock')
          .lean();
          
        // Sort books by their custom order
        const sortedBooks = section.books
          ?.sort((a: any, b: any) => a.order - b.order)
          .map((item: any) => {
            const book = books.find((b: any) => b._id.toString() === item.bookId.toString());
            return book ? { ...book, order: item.order } : null;
          })
          .filter(Boolean) || [];
          
        return {
          _id: section._id.toString(),
          title: section.title,
          description: section.description || '',
          order: section.order,
          books: sortedBooks,
        };
      })
    );
    
    // Only return sections that have books to display
    const visibleSections = populatedSections.filter(s => s.books && s.books.length > 0);
    
    return NextResponse.json({ success: true, data: visibleSections });
  } catch (error: any) {
    console.error('Homepage sections public error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
