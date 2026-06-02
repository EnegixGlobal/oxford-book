import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Language from '@/models/Language';

export async function GET() {
	try {
		await connectDB();

		// Check if we need to seed initial languages
		const count = await Language.countDocuments();
		if (count === 0) {
			await Language.insertMany([
				{ name: 'English', slug: 'english', isActive: true, sortOrder: 1 },
				{ name: 'Hindi', slug: 'hindi', isActive: true, sortOrder: 2 },
				{ name: 'Marathi', slug: 'marathi', isActive: true, sortOrder: 3 }
			]);
		}

		// Fetch all languages
		const rawLanguages = await Language.find({ isActive: true })
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
		console.error('Public languages GET error:', error);
		return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
	}
}
