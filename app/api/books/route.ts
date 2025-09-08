import { NextRequest, NextResponse } from 'next/server';

import { sampleBooks } from '@/lib/sampleData';

export const dynamic = 'force-static';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const featured = searchParams.get('featured');
  const limit = searchParams.get('limit');

  let books = [...sampleBooks];

  if (category) {
    books = books.filter(book => book.category === category);
  }

  if (featured === 'true') {
    books = books.filter(book => book.featured);
  }

  if (limit) {
    books = books.slice(0, parseInt(limit));
  }

  return NextResponse.json(books);
}

export async function POST(request: NextRequest) {
  try {
    const bookData = await request.json();
    
    // In a real app, you would save to database
    // For demo, we'll just return success
    
    return NextResponse.json({ 
      success: true, 
      message: 'Book created successfully',
      id: Date.now().toString()
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create book' },
      { status: 500 }
    );
  }
}