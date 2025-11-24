import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IAgeGroup extends Document {
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

const AgeGroupSchema: Schema<IAgeGroup> = new Schema(
	{
		name: { type: String, required: true, trim: true, maxlength: 120, unique: true },
		slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
		description: { type: String, trim: true, maxlength: 280 },
		sortOrder: { type: Number, default: 0, min: 0 },
		isActive: { type: Boolean, default: true },
	},
	{ timestamps: true }
);

AgeGroupSchema.pre('validate', function (next) {
	if ((this as any).isModified('name') || !(this as any).slug) {
		if (this.name) {
			this.slug = toSlug(this.name);
		}
	}
	next();
});

AgeGroupSchema.index({ sortOrder: 1, name: 1 });
AgeGroupSchema.index({ slug: 1 }, { unique: true });
AgeGroupSchema.index({ isActive: 1 });

let AgeGroupModel: Model<IAgeGroup>;
if (mongoose.models.AgeGroup) {
	AgeGroupModel = mongoose.models.AgeGroup as Model<IAgeGroup>;
} else {
	AgeGroupModel = mongoose.model<IAgeGroup>('AgeGroup', AgeGroupSchema);
}

export default AgeGroupModel;

