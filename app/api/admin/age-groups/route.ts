import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/middleware/auth';
import AgeGroup from '@/models/AgeGroup';

const makeSlug = (value: string) =>
	value
		.toLowerCase()
		.trim()
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9-]/g, '');

async function generateUniqueSlug(base: string, excludeId?: string | null) {
	let slug = base;
	let attempt = 1;
	// eslint-disable-next-line no-constant-condition
	while (true) {
		const query: Record<string, any> = { slug };
		if (excludeId) query._id = { $ne: excludeId };
		const exists = await AgeGroup.exists(query);
		if (!exists) return slug;
		attempt += 1;
		slug = `${base}-${attempt}`;
	}
}

export async function GET(request: NextRequest) {
	const auth = await requireAdmin(request);
	if (auth) return auth;

	try {
		await connectDB();
		const { searchParams } = new URL(request.url);
		const includeInactive = searchParams.get('includeInactive') === 'true';
		const items = await AgeGroup.find(includeInactive ? {} : { isActive: true })
			.sort({ sortOrder: 1, name: 1 })
			.lean();

		return NextResponse.json({ success: true, data: items });
	} catch (error) {
		console.error('Admin age-groups GET error:', error);
		return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	const auth = await requireAdmin(request);
	if (auth) return auth;

	try {
		const body = await request.json();
		const { name, description, sortOrder = 0, isActive = true } = body || {};

		if (!name || typeof name !== 'string') {
			return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 });
		}

		await connectDB();

		const baseSlug = makeSlug(name);
		const slug = await generateUniqueSlug(baseSlug);

		const ageGroup = await AgeGroup.create({
			name: name.trim(),
			slug,
			description: description?.trim() || undefined,
			sortOrder: Number(sortOrder) || 0,
			isActive: !!isActive,
		});

		return NextResponse.json({ success: true, data: ageGroup }, { status: 201 });
	} catch (error: any) {
		console.error('Admin age-groups POST error:', error);
		if (error.code === 11000) {
			return NextResponse.json({ success: false, message: 'Age group with this name already exists' }, { status: 409 });
		}
		return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
	}
}

export async function PUT(request: NextRequest) {
	const auth = await requireAdmin(request);
	if (auth) return auth;

	const { searchParams } = new URL(request.url);
	const id = searchParams.get('id');
	if (!id) return NextResponse.json({ success: false, message: 'Age group ID is required' }, { status: 400 });

	try {
		const body = await request.json();
		const update: Record<string, any> = {};

		if (body.name) {
			update.name = body.name.trim();
			const baseSlug = makeSlug(body.name);
			update.slug = await generateUniqueSlug(baseSlug, id);
		}
		if (body.description !== undefined) update.description = body.description?.trim() || undefined;
		if (body.sortOrder !== undefined) update.sortOrder = Number(body.sortOrder) || 0;
		if (body.isActive !== undefined) update.isActive = !!body.isActive;

		await connectDB();
		const updated = await AgeGroup.findByIdAndUpdate(id, update, { new: true });
		if (!updated) {
			return NextResponse.json({ success: false, message: 'Age group not found' }, { status: 404 });
		}

		return NextResponse.json({ success: true, data: updated });
	} catch (error: any) {
		console.error('Admin age-groups PUT error:', error);
		if (error.code === 11000) {
			return NextResponse.json({ success: false, message: 'Age group with this name already exists' }, { status: 409 });
		}
		return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
	}
}

export async function DELETE(request: NextRequest) {
	const auth = await requireAdmin(request);
	if (auth) return auth;

	const { searchParams } = new URL(request.url);
	const id = searchParams.get('id');
	if (!id) return NextResponse.json({ success: false, message: 'Age group ID is required' }, { status: 400 });

	try {
		await connectDB();
		const deleted = await AgeGroup.findByIdAndDelete(id);
		if (!deleted) {
			return NextResponse.json({ success: false, message: 'Age group not found' }, { status: 404 });
		}
		return NextResponse.json({ success: true, message: 'Age group deleted' });
	} catch (error) {
		console.error('Admin age-groups DELETE error:', error);
		return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
	}
}

