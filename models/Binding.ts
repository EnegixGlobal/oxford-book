import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IBinding extends Document {
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

const BindingSchema: Schema<IBinding> = new Schema(
	{
		name: { type: String, required: true, trim: true, maxlength: 120, unique: true },
		slug: { type: String, required: true, trim: true, lowercase: true },
		description: { type: String, trim: true, maxlength: 280 },
		sortOrder: { type: Number, default: 0, min: 0 },
		isActive: { type: Boolean, default: true },
	},
	{ timestamps: true }
);

BindingSchema.pre('validate', function (next) {
	if ((this as any).isModified('name') || !(this as any).slug) {
		if (this.name) {
			this.slug = toSlug(this.name);
		}
	}
	next();
});

BindingSchema.index({ sortOrder: 1, name: 1 });
BindingSchema.index({ slug: 1 }, { unique: true });
BindingSchema.index({ isActive: 1 });

let BindingModel: Model<IBinding>;
if (mongoose.models.Binding) {
	BindingModel = mongoose.models.Binding as Model<IBinding>;
} else {
	BindingModel = mongoose.model<IBinding>('Binding', BindingSchema);
}

export default BindingModel;
