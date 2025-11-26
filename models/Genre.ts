import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IGenre extends Document {
	name: string;
	slug: string;
	description?: string;
	sortOrder?: number;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

const toSlug = (value: string) =>
	value
		.toLowerCase()
		.trim()
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9-]/g, '');

const GenreSchema: Schema<IGenre> = new Schema(
	{
		name: { type: String, required: true, trim: true, maxlength: 120, unique: true },
		slug: { type: String, required: true, trim: true, lowercase: true },
		description: { type: String, trim: true, maxlength: 280 },
		sortOrder: { type: Number, default: 0, min: 0 },
		isActive: { type: Boolean, default: true },
	},
	{ timestamps: true }
);

GenreSchema.pre('validate', function (next) {
	if ((this as any).isModified('name') || !(this as any).slug) {
		if (this.name) {
			this.slug = toSlug(this.name);
		}
	}
	next();
});

GenreSchema.index({ sortOrder: 1, name: 1 });
GenreSchema.index({ slug: 1 }, { unique: true });
GenreSchema.index({ isActive: 1 });

let GenreModel: Model<IGenre>;
if (mongoose.models.Genre) {
	GenreModel = mongoose.models.Genre as Model<IGenre>;
} else {
	GenreModel = mongoose.model<IGenre>('Genre', GenreSchema);
}

export default GenreModel;

