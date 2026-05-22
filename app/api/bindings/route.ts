import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Binding from '@/models/Binding';

export async function GET() {
	try {
		await connectDB();

		// Check if we need to seed initial bindings
		const count = await Binding.countDocuments();
		if (count === 0) {
			await Binding.insertMany([
				{ name: 'Paperback', slug: 'paperback', isActive: true, sortOrder: 1 },
				{ name: 'Hardcover', slug: 'hardcover', isActive: true, sortOrder: 2 },
				{ name: 'Digital', slug: 'digital', isActive: true, sortOrder: 3 }
			]);
		}

		const bindings = await Binding.find({ isActive: true })
			.sort({ sortOrder: 1, name: 1 })
			.lean();

		return NextResponse.json({ success: true, data: bindings });
	} catch (error) {
		console.error('Public bindings GET error:', error);
		return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
	}
}
