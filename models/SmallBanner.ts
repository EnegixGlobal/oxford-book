import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ISmallBanner extends Document {
  image: string;
  text: string;
  link: string;
  position: 1 | 2;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SmallBannerSchema: Schema<ISmallBanner> = new Schema(
  {
    image: { type: String, required: true },
    text: { type: String, required: true, trim: true },
    link: { type: String, required: true },
    position: { type: Number, enum: [1, 2], required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

SmallBannerSchema.index({ position: 1 });

let SmallBannerModel: Model<ISmallBanner>;
if (mongoose.models.SmallBanner) {
  SmallBannerModel = mongoose.models.SmallBanner as Model<ISmallBanner>;
} else {
  SmallBannerModel = mongoose.model<ISmallBanner>('SmallBanner', SmallBannerSchema);
}

export default SmallBannerModel;

