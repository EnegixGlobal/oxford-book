import mongoose, { Document, Schema, Model } from 'mongoose';

export interface INewReleaseListItem {
  bookId: mongoose.Types.ObjectId;
  order: number;
}

export interface INewReleaseList extends Document {
  title: string;
  slug: string;
  description?: string;
  isActive: boolean;
  books: INewReleaseListItem[];
  createdAt: Date;
  updatedAt: Date;
}

const NewReleaseListItemSchema = new Schema<INewReleaseListItem>(
  {
    bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const NewReleaseListSchema: Schema<INewReleaseList> = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true, maxlength: 1000 },
    isActive: { type: Boolean, default: true },
    books: [NewReleaseListItemSchema],
  },
  { timestamps: true }
);

NewReleaseListSchema.index({ slug: 1 });
NewReleaseListSchema.index({ isActive: 1 });

NewReleaseListSchema.pre('validate', function (next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }
  next();
});

let NewReleaseListModel: Model<INewReleaseList>;
if (mongoose.models.NewReleaseList) {
  NewReleaseListModel = mongoose.models.NewReleaseList as Model<INewReleaseList>;
} else {
  NewReleaseListModel = mongoose.model<INewReleaseList>('NewReleaseList', NewReleaseListSchema);
}

export default NewReleaseListModel;

