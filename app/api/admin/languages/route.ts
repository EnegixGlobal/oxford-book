import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/middleware/auth';
import Language from '@/models/Language';

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
		const exists = await Language.exists(query);
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
		
		// If there are no languages yet, seed them first
		const count = await Language.countDocuments();
		if (count === 0) {
			await Language.insertMany([
				{ name: 'English', slug: 'english', isActive: true, sortOrder: 1 },
				{ name: 'Hindi', slug: 'hindi', isActive: true, sortOrder: 2 },
				{ name: 'Marathi', slug: 'marathi', isActive: true, sortOrder: 3 }
			]);
		}

		const rawLanguages = await Language.find(includeInactive ? {} : { isActive: true })
			.sort({ sortOrder: 1, name: 1 })
			.lean();

		// Filter duplicates in-memory and identify duplicates to delete
		const uniqueLanguages: any[] = [];
		const seenSlugs = new Set<string>();
		const duplicateIdsToDelete: any[] = [];

		for (const lang of rawLanguages) {
			const slug = lang.slug.toLowerCase().trim();
			if (!seenSlugs.has(slug)) {
				seenSlugs.add(slug);
				uniqueLanguages.push(lang);
			} else {
				duplicateIdsToDelete.push(lang._id);
			}
		}

		// Perform asynchronous cleanup in the database if duplicates exist
		if (duplicateIdsToDelete.length > 0) {
			Language.deleteMany({ _id: { $in: duplicateIdsToDelete } })
				.then((res) => console.log(`✅ Cleaned up ${res.deletedCount} duplicate languages from DB`))
				.catch((err) => console.error('Failed to clean up duplicate languages:', err));
		}

		return NextResponse.json({ success: true, data: uniqueLanguages });
	} catch (error) {
		console.error('Admin languages GET error:', error);
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

		const language = await Language.create({
			name: name.trim(),
			slug,
			description: description?.trim() || undefined,
			sortOrder: Number(sortOrder) || 0,
			isActive: !!isActive,
		});

		return NextResponse.json({ success: true, data: language }, { status: 201 });
	} catch (error: any) {
		console.error('Admin languages POST error:', error);
		if (error.code === 11000) {
			return NextResponse.json({ success: false, message: 'Language with this name already exists' }, { status: 409 });
		}
		return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
	}
}

export async function PUT(request: NextRequest) {
	const auth = await requireAdmin(request);
	if (auth) return auth;

	const { searchParams } = new URL(request.url);
	const id = searchParams.get('id');
	if (!id) return NextResponse.json({ success: false, message: 'Language ID is required' }, { status: 400 });

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
		const updated = await Language.findByIdAndUpdate(id, update, { new: true });
		if (!updated) {
			return NextResponse.json({ success: false, message: 'Language not found' }, { status: 404 });
		}

		return NextResponse.json({ success: true, data: updated });
	} catch (error: any) {
		console.error('Admin languages PUT error:', error);
		if (error.code === 11000) {
			return NextResponse.json({ success: false, message: 'Language with this name already exists' }, { status: 409 });
		}
		return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
	}
}

export async function DELETE(request: NextRequest) {
	const auth = await requireAdmin(request);
	if (auth) return auth;

	const { searchParams } = new URL(request.url);
	const id = searchParams.get('id');
	if (!id) return NextResponse.json({ success: false, message: 'Language ID is required' }, { status: 400 });

	try {
		await connectDB();
		const deleted = await Language.findByIdAndDelete(id);
		if (!deleted) {
			return NextResponse.json({ success: false, message: 'Language not found' }, { status: 404 });
		}
		return NextResponse.json({ success: true, message: 'Language deleted' });
	} catch (error) {
		console.error('Admin languages DELETE error:', error);
		return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
	}
}
