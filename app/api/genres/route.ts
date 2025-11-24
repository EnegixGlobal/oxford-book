import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Genre from '@/models/Genre';

export async function GET(request: NextRequest) {
	try {
		await connectDB();
		const { searchParams } = new URL(request.url);
		const includeInactive = searchParams.get('includeInactive') === 'true';
		const items = await Genre.find(includeInactive ? {} : { isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();
		return NextResponse.json({ success: true, data: items });
	} catch (error) {
		console.error('Public genres GET error:', error);
		return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
	}
}

