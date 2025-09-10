import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Address from '@/models/Address';
import { requireAuth, AuthenticatedRequest } from '@/middleware/auth';

// GET: list addresses for current user
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult) return authResult;
  const { user } = request as AuthenticatedRequest;

  try {
    await connectDB();
    const items = await Address.find({ user: user!.id }).sort({ isDefault: -1, updatedAt: -1 }).lean();
    return NextResponse.json({ success: true, data: items });
  } catch (e) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

// POST: create address (optionally set as default)
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult) return authResult;
  const { user } = request as AuthenticatedRequest;

  try {
    const body = await request.json();
    const { fullName, phone, line1, line2, city, state, postalCode, isDefault } = body || {};
    if (!fullName || !phone || !line1 || !city || !state || !postalCode) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }
    await connectDB();

    if (isDefault) {
      await Address.updateMany({ user: user!.id, isDefault: true }, { $set: { isDefault: false } });
    }

    const doc = await Address.create({ user: user!.id, fullName, phone, line1, line2, city, state, postalCode, isDefault: !!isDefault });
    return NextResponse.json({ success: true, data: doc }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

// PUT: update address and/or default flag (requires id query)
export async function PUT(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult) return authResult;
  const { user } = request as AuthenticatedRequest;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, message: 'Address ID is required' }, { status: 400 });

  try {
    const body = await request.json();
    const update: any = {};
    const fields = ['fullName', 'phone', 'line1', 'line2', 'city', 'state', 'postalCode'];
    fields.forEach(f => { if (body[f] !== undefined) update[f] = body[f]; });

    await connectDB();

    if (body.isDefault === true) {
      await Address.updateMany({ user: user!.id, isDefault: true }, { $set: { isDefault: false } });
      update.isDefault = true;
    } else if (body.isDefault === false) {
      update.isDefault = false;
    }

    const doc = await Address.findOneAndUpdate({ _id: id, user: user!.id }, update, { new: true });
    if (!doc) return NextResponse.json({ success: false, message: 'Address not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: doc });
  } catch (e) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: delete address by id
export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult) return authResult;
  const { user } = request as AuthenticatedRequest;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, message: 'Address ID is required' }, { status: 400 });

  try {
    await connectDB();
    const res = await Address.deleteOne({ _id: id, user: user!.id });
    if (res.deletedCount === 0) return NextResponse.json({ success: false, message: 'Address not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Address deleted' });
  } catch (e) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
