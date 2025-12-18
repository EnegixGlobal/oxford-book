import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IPromoBanner extends Document {
  image: string;
  link: string;
  altText?: string;
  title?: string;
  description?: string;
  buttonText?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PromoBannerSchema: Schema<IPromoBanner> = new Schema(
  {
    image: { type: String, required: true },
    link: { type: String, required: true },
    altText: { type: String, trim: true },
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    buttonText: { type: String, trim: true, default: 'Click Here' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

let PromoBannerModel: Model<IPromoBanner>;
if (mongoose.models.PromoBanner) {
  PromoBannerModel = mongoose.models.PromoBanner as Model<IPromoBanner>;
} else {
  PromoBannerModel = mongoose.model<IPromoBanner>('PromoBanner', PromoBannerSchema);
}

export default PromoBannerModel;

