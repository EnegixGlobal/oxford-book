import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';

// Public: GET /api/categories
// Query params:
//   featured=true|false (optional) - filter only featured categories
//   limit=<number> (optional) - limit number of categories returned
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const featured = searchParams.get('featured');
		const limitParam = searchParams.get('limit');
		const limit = limitParam ? Math.max(1, Math.min(100, parseInt(limitParam))) : undefined;

		await connectDB();

		const query: any = {};
		if (featured === 'true') query.featured = true;

		const cursor = Category.find(query)
			.select({ name: 1, slug: 1, subcategories: { $slice: 100 } })
			.sort({ name: 1 })
			.lean();

		const categories = limit ? await cursor.limit(limit) : await cursor;

		// Shape response: expose only needed fields and slugified subcategories
		const data = categories.map((cat: any) => ({
			_id: cat._id?.toString?.() ?? undefined,
			name: cat.name,
			slug: cat.slug,
			subcategories: (cat.subcategories || []).map((sub: any) => ({
				_id: sub._id?.toString?.() ?? undefined,
				name: sub.name,
				slug: sub.slug,
			})),
		}));

		return NextResponse.json({ success: true, data });
	} catch (error: any) {
		console.error('Public categories error:', error);
		return NextResponse.json(
			{ success: false, message: 'Internal server error' },
			{ status: 500 }
		);
	}
}

