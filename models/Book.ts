import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IBook extends Document {
	title: string;
	slug: string;
	authorName: string;
	authorId?: mongoose.Types.ObjectId;
	description: string;
	coverImage?: string;
	categorySlug: string;
	subcategorySlug?: string;
	ageGroup?: '0-2' | '3-5' | '6-8' | '9-12' | 'teen' | 'young-adult' | 'old-man';
	inStock: boolean;
	stock: number;
	mrp: number;
	discountedPrice: number;
	discount: number; // percentage 0-100
	isbn: string;
	publisher?: string;
	binding?: 'hardcover' | 'paperback' | 'digital';
	language?: string; // e.g., 'english'
	rating: number; // average rating
	reviewCount: number;
	featured: boolean;
}

const BookSchema: Schema<IBook> = new Schema(
	{
		title: { type: String, required: true, trim: true, maxlength: 200 },
		slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
		authorName: { type: String, required: true, trim: true, maxlength: 120 },
		authorId: { type: Schema.Types.ObjectId, ref: 'Author' },
		description: { type: String, required: true, trim: true, maxlength: 5000 },
		coverImage: { type: String, trim: true },
		categorySlug: { type: String, required: true, lowercase: true, trim: true },
		subcategorySlug: { type: String, lowercase: true, trim: true },
		ageGroup: { type: String, enum: ['0-2', '3-5', '6-8', '9-12', 'teen', 'young-adult', 'old-man'], lowercase: true, trim: true },
		inStock: { type: Boolean, default: true },
		stock: { type: Number, required: true, min: 0, default: 0 },
		mrp: { type: Number, required: true, min: 0 },
		discountedPrice: { type: Number, required: true, min: 0 },
		discount: { type: Number, required: true, min: 0, max: 100, default: 0 },
		isbn: { type: String, required: true, unique: true, trim: true },
		publisher: { type: String, trim: true },
		binding: { type: String, enum: ['hardcover', 'paperback', 'digital'], default: 'paperback' },
		language: { type: String, trim: true, lowercase: true },
		rating: { type: Number, default: 0, min: 0, max: 5 },
		reviewCount: { type: Number, default: 0, min: 0 },
		featured: { type: Boolean, default: false },
	},
	{ timestamps: true }
);

// Text index for search
BookSchema.index({ title: 'text', description: 'text', authorName: 'text' });
// Filter indexes
BookSchema.index({ categorySlug: 1 });
BookSchema.index({ subcategorySlug: 1 });
BookSchema.index({ featured: 1 });
BookSchema.index({ ageGroup: 1 });

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
	if (this.isModified('mrp') || this.isModified('discount')) {
		const mrp = Number(this.mrp) || 0;
		const discount = Number(this.discount) || 0;
		const final = Math.max(0, mrp - (mrp * discount) / 100);
		this.discountedPrice = Number.isFinite(final) ? Number(final.toFixed(2)) : 0;
	}
	next();
});

// In dev with hot reload, the cached model may be compiled without new fields (like ageGroup).
// Augment the cached model's schema to ensure new paths persist without a full restart.
let BookModel: Model<IBook>;
if (mongoose.models.Book) {
	BookModel = mongoose.models.Book as Model<IBook>;
	if (!BookModel.schema.path('ageGroup')) {
		BookModel.schema.add({
			ageGroup: { type: String, enum: ['0-2', '3-5', '6-8', '9-12', 'teen', 'young-adult', 'old-man'], lowercase: true, trim: true },
		});
		try { BookModel.schema.index({ ageGroup: 1 }); } catch {}
	}
} else {
	BookModel = mongoose.model<IBook>('Book', BookSchema);
}

export default BookModel;
