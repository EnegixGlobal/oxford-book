import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ILanguage extends Document {
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

const LanguageSchema: Schema<ILanguage> = new Schema(
	{
		name: { type: String, required: true, trim: true, maxlength: 120, unique: true },
		slug: { type: String, required: true, trim: true, lowercase: true },
		description: { type: String, trim: true, maxlength: 280 },
		sortOrder: { type: Number, default: 0, min: 0 },
		isActive: { type: Boolean, default: true },
	},
	{ timestamps: true }
);

LanguageSchema.pre('validate', function (next) {
	if ((this as any).isModified('name') || !(this as any).slug) {
		if (this.name) {
			this.slug = toSlug(this.name);
		}
	}
	next();
});

LanguageSchema.index({ sortOrder: 1, name: 1 });
LanguageSchema.index({ slug: 1 }, { unique: true });
LanguageSchema.index({ isActive: 1 });

let LanguageModel: Model<ILanguage>;
if (mongoose.models.Language) {
	LanguageModel = mongoose.models.Language as Model<ILanguage>;
} else {
	LanguageModel = mongoose.model<ILanguage>('Language', LanguageSchema);
}

export default LanguageModel;
