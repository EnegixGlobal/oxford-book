import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IBook extends Document {
	title: string;
	slug: string;
	authorName?: string; // Made optional
	authorId?: mongoose.Types.ObjectId;
	description?: string;
	coverImage?: string;
	categorySlug: string;
	subcategorySlug?: string;
	ageGroup?: string;
	genre?: string;
	inStock: boolean;
	stock: number;
	mrp: number;
	discountedPrice: number;
	discount: number; // percentage 0-100 (for backward compatibility)
	discountType?: 'percentage' | 'amount'; // New field: type of discount
	discountAmount?: number; // New field: discount amount in currency
	hsnCode?: string; // New field: HSN code (optional)
	totalPages?: number; // New field: total page count (optional)
	isbn: string;
	publisher?: string;
	binding?: 'hardcover' | 'paperback' | 'digital';
	language?: string; // e.g., 'english'
	rating: number; // average rating
	reviewCount: number;
	featured: boolean;
	featuredOrder?: number;
			anticipated?: boolean;
		bestseller?: boolean;
	bestsellerOrder?: number;
	newRelease?: boolean;
	newReleaseOrder?: number;
	awardWinner?: boolean;
	schoolLibrary?: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const BookSchema: Schema<IBook> = new Schema(
	{
		title: { type: String, required: true, trim: true, maxlength: 200 },
		slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
		authorName: { type: String, required: false, trim: true, maxlength: 120 }, // Made optional
		authorId: { type: Schema.Types.ObjectId, ref: 'Author' },
		description: { type: String, trim: true, maxlength: 5000 },
		coverImage: { type: String, trim: true },
		categorySlug: { type: String, required: true, lowercase: true, trim: true },
		subcategorySlug: { type: String, lowercase: true, trim: true },
		ageGroup: { type: String, lowercase: true, trim: true },
		genre: { type: String, lowercase: true, trim: true },
		inStock: { type: Boolean, default: true },
		stock: { type: Number, required: true, min: 0, default: 0 },
		mrp: { type: Number, required: true, min: 0 },
		discountedPrice: { type: Number, required: true, min: 0 },
		discount: { type: Number, required: false, min: 0, max: 100, default: 0 }, // Made optional for backward compatibility
		discountType: { type: String, enum: ['percentage', 'amount'], default: 'percentage' }, // New field
		discountAmount: { type: Number, min: 0, default: 0 }, // New field
		hsnCode: { type: String, trim: true, maxlength: 50 }, // New field (optional)
		totalPages: { type: Number, min: 0 }, // New field (optional)
		isbn: { type: String, required: true, unique: true, trim: true },
		publisher: { type: String, trim: true },
		binding: { type: String, enum: ['hardcover', 'paperback', 'digital'], default: 'paperback' },
		language: { type: String, trim: true, lowercase: true },
		rating: { type: Number, default: 0, min: 0, max: 5 },
		reviewCount: { type: Number, default: 0, min: 0 },
		featured: { type: Boolean, default: false },
		featuredOrder: { type: Number, default: 0, min: 0 },
		anticipated: { type: Boolean, default: false },
		bestseller: { type: Boolean, default: false },
	bestsellerOrder: { type: Number, default: 0, min: 0 },
	newRelease: { type: Boolean, default: false },
	newReleaseOrder: { type: Number, default: 0, min: 0 },
	awardWinner: { type: Boolean, default: false },
	schoolLibrary: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

// Text index for search. Set language_override to a non-conflicting field name so
// our 'language' property can store values like 'hindi' or 'marathi' without errors.
// Text index for search (avoid using doc 'language' as language override)
// Using default_language: 'none' prevents unsupported language override errors (e.g., 'hindi')
// and language_override points to a non-existent field so doc 'language' is not used.
BookSchema.index(
	{ title: 'text', description: 'text', authorName: 'text' },
	{ default_language: 'none', language_override: 'textLanguage' }
);
// Filter indexes
BookSchema.index({ categorySlug: 1 });
BookSchema.index({ subcategorySlug: 1 });
BookSchema.index({ featured: 1 });
BookSchema.index({ featured: 1, featuredOrder: 1 });
BookSchema.index({ ageGroup: 1 });
BookSchema.index({ genre: 1 });
BookSchema.index({ anticipated: 1 });
BookSchema.index({ bestseller: 1 });
BookSchema.index({ bestseller: 1, bestsellerOrder: 1 });
BookSchema.index({ newRelease: 1 });
BookSchema.index({ newRelease: 1, newReleaseOrder: 1 });

// Ensure slug exists prior to validation
BookSchema.pre('validate', function (next) {
	if (!this.slug && this.title) {
		this.slug = this.title
			.toLowerCase()
			.replace(/\s+/g, '-')
			.replace(/[^a-z0-9-]/g, '');
	}
	next();
});

// Generate/refresh derived fields on save
BookSchema.pre('save', function (next) {
	if (this.isModified('title')) {
		this.slug = this.title
			.toLowerCase()
			.replace(/\s+/g, '-')
			.replace(/[^a-z0-9-]/g, '');
	}
	// keep inStock in sync with stock
	if (this.isModified('stock')) {
		this.inStock = (this.stock || 0) > 0;
	}
	// ensure discountedPrice consistent if mrp/discount changed (best-effort)
	if (this.isModified('mrp') || this.isModified('discount') || this.isModified('discountType') || this.isModified('discountAmount')) {
		const mrp = Number(this.mrp) || 0;
		const discountType = this.discountType || 'percentage';
		let final = mrp;
		
		if (discountType === 'amount') {
			const discountAmount = Number(this.discountAmount) || 0;
			final = Math.max(0, mrp - discountAmount);
			// Also update discount percentage for backward compatibility
			if (mrp > 0) {
				this.discount = (discountAmount / mrp) * 100;
			}
		} else {
			const discount = Number(this.discount) || 0;
			final = Math.max(0, mrp - (mrp * discount) / 100);
			// Also update discountAmount for consistency
			this.discountAmount = (mrp * discount) / 100;
		}
		
		this.discountedPrice = Number.isFinite(final) ? Number(final.toFixed(2)) : 0;
	}
	next();
});

// In dev with hot reload, the cached model may be compiled without new fields (like ageGroup).
// Augment the cached model's schema to ensure new paths persist without a full restart.
let BookModel: Model<IBook>;
if (mongoose.models.Book) {
	BookModel = mongoose.models.Book as Model<IBook>;
	const descPath = BookModel.schema.path('description');
	if (descPath && (descPath as any).options?.required) {
		(descPath as any).options.required = false;
	}
	const ageGroupPath = BookModel.schema.path('ageGroup');
	if (!ageGroupPath) {
		BookModel.schema.add({
			ageGroup: { type: String, lowercase: true, trim: true },
		});
		try { BookModel.schema.index({ ageGroup: 1 }); } catch {}
	} else if ((ageGroupPath as any).options?.enum) {
		delete (ageGroupPath as any).options.enum;
	}
	const genrePath = BookModel.schema.path('genre');
	if (!genrePath) {
		BookModel.schema.add({
			genre: { type: String, lowercase: true, trim: true },
		});
		try { BookModel.schema.index({ genre: 1 }); } catch {}
	} else if ((genrePath as any).options?.enum) {
		delete (genrePath as any).options.enum;
	}
	if (!BookModel.schema.path('anticipated')) {
		BookModel.schema.add({ anticipated: { type: Boolean, default: false } });
		try { BookModel.schema.index({ anticipated: 1 }); } catch {}
	}
		if (!BookModel.schema.path('bestseller')) {
			BookModel.schema.add({ bestseller: { type: Boolean, default: false } });
			try { BookModel.schema.index({ bestseller: 1 }); } catch {}
		}
		if (!BookModel.schema.path('bestsellerOrder')) {
			BookModel.schema.add({ bestsellerOrder: { type: Number, default: 0, min: 0 } });
			try { BookModel.schema.index({ bestseller: 1, bestsellerOrder: 1 }); } catch {}
		}
	if (!BookModel.schema.path('newRelease')) {
		BookModel.schema.add({ newRelease: { type: Boolean, default: false } });
		try { BookModel.schema.index({ newRelease: 1 }); } catch {}
	}
	if (!BookModel.schema.path('newReleaseOrder')) {
		BookModel.schema.add({ newReleaseOrder: { type: Number, default: 0, min: 0 } });
		try { BookModel.schema.index({ newRelease: 1, newReleaseOrder: 1 }); } catch {}
	}
	if (!BookModel.schema.path('awardWinner')) {
		BookModel.schema.add({ awardWinner: { type: Boolean, default: false } });
		try { BookModel.schema.index({ awardWinner: 1 }); } catch {}
	}
	if (!BookModel.schema.path('schoolLibrary')) {
		BookModel.schema.add({ schoolLibrary: { type: Boolean, default: false } });
		try { BookModel.schema.index({ schoolLibrary: 1 }); } catch {}
	}
	if (!BookModel.schema.path('featuredOrder')) {
		BookModel.schema.add({ featuredOrder: { type: Number, default: 0, min: 0 } });
		try { BookModel.schema.index({ featured: 1, featuredOrder: 1 }); } catch {}
	}
	// Add new fields for backward compatibility
	const authorNamePath = BookModel.schema.path('authorName');
	if (authorNamePath && (authorNamePath as any).options?.required) {
		(authorNamePath as any).options.required = false;
	}
	if (!BookModel.schema.path('discountType')) {
		BookModel.schema.add({ discountType: { type: String, enum: ['percentage', 'amount'], default: 'percentage' } });
	}
	if (!BookModel.schema.path('discountAmount')) {
		BookModel.schema.add({ discountAmount: { type: Number, min: 0, default: 0 } });
	}
	if (!BookModel.schema.path('hsnCode')) {
		BookModel.schema.add({ hsnCode: { type: String, trim: true, maxlength: 50 } });
	}
	if (!BookModel.schema.path('totalPages')) {
		BookModel.schema.add({ totalPages: { type: Number, min: 0 } });
	}
} else {
	BookModel = mongoose.model<IBook>('Book', BookSchema);
}

export default BookModel;
