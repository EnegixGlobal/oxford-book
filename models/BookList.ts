import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IBookListItem {
  bookId: mongoose.Types.ObjectId;
  order: number;
}

export interface IBookList extends Document {
  title: string;
  slug: string;
  description?: string;
  isActive: boolean;
  books: IBookListItem[];
  createdAt: Date;
  updatedAt: Date;
}

const BookListItemSchema = new Schema<IBookListItem>(
  {
    bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const BookListSchema: Schema<IBookList> = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true, maxlength: 1000 },
    isActive: { type: Boolean, default: true },
    books: [BookListItemSchema],
  },
  { timestamps: true }
);

BookListSchema.index({ slug: 1 });
BookListSchema.index({ isActive: 1 });

BookListSchema.pre('validate', function (next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }
  next();
});

let BookListModel: Model<IBookList>;
if (mongoose.models.BookList) {
  BookListModel = mongoose.models.BookList as Model<IBookList>;
} else {
  BookListModel = mongoose.model<IBookList>('BookList', BookListSchema);
}

export default BookListModel;

