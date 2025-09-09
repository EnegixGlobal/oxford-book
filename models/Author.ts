import mongoose, { Document, Schema } from 'mongoose';

export interface IAuthor extends Document {
  name: string;
  slug: string;
  nationality?: string;
  biography?: string;
  profileImage?: string;
  featured: boolean;
  booksCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const AuthorSchema: Schema<IAuthor> = new Schema({
  name: {
    type: String,
    required: [true, 'Author name is required'],
    trim: true,
    maxlength: [100, 'Author name cannot be more than 100 characters']
  },
  slug: {
    type: String,
    required: [true, 'Author slug is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  nationality: {
    type: String,
    trim: true,
    maxlength: [60, 'Nationality cannot be more than 60 characters']
  },
  biography: {
    type: String,
    trim: true,
    maxlength: [2000, 'Biography cannot be more than 2000 characters']
  },
  profileImage: {
    type: String,
    trim: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  booksCount: {
    type: Number,
    default: 0,
    min: [0, 'Books count cannot be negative']
  }
}, { timestamps: true });

// Indexes for better query performance
// Note: "unique: true" on slug already creates an index; avoid duplicating it
AuthorSchema.index({ name: 1 });
AuthorSchema.index({ featured: 1 });

// Pre-save middleware to generate slug from name
AuthorSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }
  next();
});

export default mongoose.models.Author || mongoose.model<IAuthor>('Author', AuthorSchema);
