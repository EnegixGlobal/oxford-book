import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Book from '@/models/Book';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// Helper to extract user id from Authorization Bearer token (JWT) stored client-side
function getUserId(req: NextRequest): string | null {
  try {
    const auth = req.headers.get('authorization');
    if (!auth) return null;
    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
    const token = parts[1];
    const secret = process.env.JWT_SECRET || 'devsecret';
    const decoded: any = jwt.verify(token, secret);
    // Login token stores userId property; tolerate alternate naming for forward compatibility
    return decoded?.userId || decoded?.id || decoded?._id || null;
  } catch (e) {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const userId = getUserId(req);
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    let user: any = await User.findById(userId).select('wishlist');
    if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

    try {
      await user.populate('wishlist');
    } catch (popErr: any) {
      // Fallback if schema path issue
      console.warn('Wishlist populate failed (GET):', popErr?.message || popErr);
      if (Array.isArray(user.wishlist) && user.wishlist.length) {
        const books = await Book.find({ _id: { $in: user.wishlist } });
        user.wishlist = books;
      }
    }

    const data = (user.wishlist || []).filter(Boolean);
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    console.error('Wishlist GET error', e?.message || e);
    return NextResponse.json({ success: false, message: 'Failed to load wishlist', detail: process.env.NODE_ENV !== 'production' ? (e?.message || 'error') : undefined }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const userId = getUserId(req);
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { bookId } = await req.json().catch(() => ({}));
    if (!bookId) return NextResponse.json({ success: false, message: 'bookId required' }, { status: 400 });
    if (!mongoose.isValidObjectId(bookId)) {
      return NextResponse.json({ success: false, message: 'Invalid bookId format' }, { status: 400 });
    }

  const user: any = await User.findById(userId).select('wishlist');
    if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    if (!user.wishlist) user.wishlist = [];
    // Validate book exists
  const bookExists = await Book.findById(bookId).select('_id');
    if (!bookExists) return NextResponse.json({ success: false, message: 'Book not found' }, { status: 404 });

    const exists = user.wishlist.some((id: any) => id.toString() === bookId);
    if (!exists) user.wishlist.push(bookId);
    await user.save();
    // Re-populate after save (with fallback)
    try {
      await user.populate('wishlist');
    } catch (popErr: any) {
      console.warn('Wishlist populate failed (POST):', popErr?.message || popErr);
      if (Array.isArray(user.wishlist) && user.wishlist.length) {
        const books = await Book.find({ _id: { $in: user.wishlist } });
        user.wishlist = books;
      }
    }
    return NextResponse.json({ success: true, message: 'Added', data: user.wishlist });
  } catch (e: any) {
    console.error('Wishlist POST error', e?.message || e);
    return NextResponse.json({ success: false, message: 'Failed to update wishlist', detail: process.env.NODE_ENV !== 'production' ? (e?.message || 'error') : undefined }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const userId = getUserId(req);
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const { bookId } = await req.json().catch(() => ({}));
    if (!bookId) return NextResponse.json({ success: false, message: 'bookId required' }, { status: 400 });
    if (!mongoose.isValidObjectId(bookId)) {
      return NextResponse.json({ success: false, message: 'Invalid bookId format' }, { status: 400 });
    }

    const user: any = await User.findById(userId).select('wishlist');
    if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    user.wishlist = (user.wishlist || []).filter((id: any) => id.toString() !== bookId);
    await user.save();
    try {
      await user.populate('wishlist');
    } catch (popErr: any) {
      console.warn('Wishlist populate failed (DELETE):', popErr?.message || popErr);
      if (Array.isArray(user.wishlist) && user.wishlist.length) {
        const books = await Book.find({ _id: { $in: user.wishlist } });
        user.wishlist = books;
      }
    }
    return NextResponse.json({ success: true, message: 'Removed', data: user.wishlist });
  } catch (e: any) {
    console.error('Wishlist DELETE error', e?.message || e);
    return NextResponse.json({ success: false, message: 'Failed to remove from wishlist', detail: process.env.NODE_ENV !== 'production' ? (e?.message || 'error') : undefined }, { status: 500 });
  }
}
