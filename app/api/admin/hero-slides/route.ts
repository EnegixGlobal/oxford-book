import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/middleware/auth';
import HeroSlide from '@/models/HeroSlide';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth) return auth;

  try {
    await connectDB();
    const slides = await HeroSlide.find({})
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: slides });
  } catch (error) {
    console.error('Admin hero slides GET error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth) return auth;

  try {
    const body = await request.json();
    const {
      imageUrl,
      imagePublicId,
      title,
      subtitle,
      ctaLabel,
      ctaHref,
      sortOrder = 0,
      isActive = true
    } = body || {};

    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json({ success: false, message: 'imageUrl is required' }, { status: 400 });
    }

    await connectDB();
    const slide = await HeroSlide.create({
      imageUrl: imageUrl.trim(),
      imagePublicId: imagePublicId?.trim() || undefined,
      title: title?.trim() || undefined,
      subtitle: subtitle?.trim() || undefined,
      ctaLabel: ctaLabel?.trim() || undefined,
      ctaHref: ctaHref?.trim() || undefined,
      sortOrder: Number(sortOrder) || 0,
      isActive: !!isActive
    });

    return NextResponse.json({ success: true, data: slide }, { status: 201 });
  } catch (error) {
    console.error('Admin hero slides POST error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth) return auth;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ success: false, message: 'Slide ID is required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const update: Record<string, unknown> = {};

    if (body.imageUrl !== undefined) {
      if (!body.imageUrl) return NextResponse.json({ success: false, message: 'imageUrl cannot be empty' }, { status: 400 });
      update.imageUrl = body.imageUrl.trim();
    }
    if (body.imagePublicId !== undefined) update.imagePublicId = body.imagePublicId?.trim() || undefined;
    if (body.title !== undefined) update.title = body.title?.trim() || undefined;
    if (body.subtitle !== undefined) update.subtitle = body.subtitle?.trim() || undefined;
    if (body.ctaLabel !== undefined) update.ctaLabel = body.ctaLabel?.trim() || undefined;
    if (body.ctaHref !== undefined) update.ctaHref = body.ctaHref?.trim() || undefined;
    if (body.sortOrder !== undefined) update.sortOrder = Number(body.sortOrder) || 0;
    if (body.isActive !== undefined) update.isActive = !!body.isActive;

    await connectDB();
    const updated = await HeroSlide.findByIdAndUpdate(id, update, { new: true });
    if (!updated) {
      return NextResponse.json({ success: false, message: 'Slide not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Admin hero slides PUT error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth) return auth;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ success: false, message: 'Slide ID is required' }, { status: 400 });
  }

  try {
    await connectDB();
    const deleted = await HeroSlide.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Slide not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Slide deleted' });
  } catch (error) {
    console.error('Admin hero slides DELETE error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

