import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IHomeSectionItem {
  bookId: mongoose.Types.ObjectId;
  order: number;
}

export interface IHomeSection extends Document {
  title: string;
  description?: string;
  isActive: boolean;
  order: number;
  books: IHomeSectionItem[];
  createdAt: Date;
  updatedAt: Date;
}

const HomeSectionItemSchema = new Schema<IHomeSectionItem>(
  {
    bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const HomeSectionSchema: Schema<IHomeSection> = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 1000 },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    books: [HomeSectionItemSchema],
  },
  { timestamps: true }
);

HomeSectionSchema.index({ isActive: 1 });
HomeSectionSchema.index({ order: 1 });

if (mongoose.models.HomeSection) {
  delete (mongoose.models as any).HomeSection;
}
const HomeSectionModel = mongoose.model<IHomeSection>('HomeSection', HomeSectionSchema);

export default HomeSectionModel;
