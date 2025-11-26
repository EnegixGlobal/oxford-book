import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IHeroSlide extends Document {
  title?: string;
  subtitle?: string;
  imageUrl: string;
  imagePublicId?: string;
  ctaLabel?: string;
  ctaHref?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HeroSlideSchema: Schema<IHeroSlide> = new Schema(
  {
    title: { type: String, trim: true, maxlength: 120 },
    subtitle: { type: String, trim: true, maxlength: 240 },
    imageUrl: { type: String, required: true, trim: true },
    imagePublicId: { type: String, trim: true },
    ctaLabel: { type: String, trim: true, maxlength: 60 },
    ctaHref: { type: String, trim: true, maxlength: 240 },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

HeroSlideSchema.index({ isActive: 1, sortOrder: 1 });

let HeroSlideModel: Model<IHeroSlide>;
if (mongoose.models.HeroSlide) {
  HeroSlideModel = mongoose.models.HeroSlide as Model<IHeroSlide>;
} else {
  HeroSlideModel = mongoose.model<IHeroSlide>('HeroSlide', HeroSlideSchema);
}

export default HeroSlideModel;

