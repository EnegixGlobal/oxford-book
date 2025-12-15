import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAuth, AuthenticatedRequest } from '@/middleware/auth';
import User from '@/models/User';

function getUserId(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const jwt = require('jsonwebtoken');
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    return decoded.userId || null;
  } catch {
    return null;
  }
}

// GET user's cart
export async function GET(req: NextRequest) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(userId).select('cart');
    
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      data: user.cart || [] 
    });
  } catch (error: any) {
    console.error('Cart fetch error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch cart' 
    }, { status: 500 });
  }
}

// POST/UPDATE user's cart
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult) return authResult;
    
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;

    const body = await req.json();
    const { items } = body;

    if (!Array.isArray(items)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Items must be an array' 
      }, { status: 400 });
    }

    await connectDB();
    
    // Validate and normalize cart items
    const cartItems = items.map((item: any) => ({
      bookId: item.bookId || item.id || item._id || '',
      title: item.title || '',
      price: Number(item.price || item.discountedPrice || 0),
      quantity: Number(item.quantity || 1),
      coverImage: item.coverImage || '',
      authorName: item.authorName || '',
      isbn: item.isbn || ''
    })).filter((item: any) => item.bookId && item.title && item.quantity > 0);

    const user = await User.findByIdAndUpdate(
      userId,
      { cart: cartItems },
      { new: true }
    ).select('cart');

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: 'User not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      data: user.cart || [],
      message: 'Cart updated successfully' 
    });
  } catch (error: any) {
    console.error('Cart update error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to update cart' 
    }, { status: 500 });
  }
}

// DELETE - clear cart
export async function DELETE(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult) return authResult;
    
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;

    await connectDB();
    const user = await User.findByIdAndUpdate(
      userId,
      { cart: [] },
      { new: true }
    ).select('cart');

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: 'User not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Cart cleared successfully' 
    });
  } catch (error: any) {
    console.error('Cart clear error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to clear cart' 
    }, { status: 500 });
  }
}

