import mongoose, { Document, Schema } from 'mongoose';

export interface ISubCategory extends Document {
  name: string;
  slug: string;
  description: string;
  image?: string;
  booksCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategory extends Document {
  name: string;
  slug: string;
  description: string;
  image?: string;
  featured: boolean;
  booksCount: number;
  subcategories: ISubCategory[];
  createdAt: Date;
  updatedAt: Date;
}

const SubCategorySchema: Schema<ISubCategory> = new Schema({
  name: {
    type: String,
    required: [true, 'Subcategory name is required'],
    trim: true,
    maxlength: [50, 'Subcategory name cannot be more than 50 characters']
  },
  slug: {
    type: String,
    required: [true, 'Subcategory slug is required'],
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Subcategory description is required'],
    trim: true,
    maxlength: [200, 'Subcategory description cannot be more than 200 characters']
  },
  image: {
    type: String,
    trim: true
  },
  booksCount: {
    type: Number,
    default: 0,
    min: [0, 'Books count cannot be negative']
  }
}, {
  timestamps: true
});

const CategorySchema: Schema<ICategory> = new Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [50, 'Category name cannot be more than 50 characters']
  },
  slug: {
    type: String,
    required: [true, 'Category slug is required'],
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Category description is required'],
    trim: true,
    maxlength: [200, 'Category description cannot be more than 200 characters']
  },
  image: {
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
  },
  subcategories: [SubCategorySchema]
}, {
  timestamps: true
});

// Indexes for better query performance
CategorySchema.index({ slug: 1 }, { unique: true });
CategorySchema.index({ featured: 1 });
CategorySchema.index({ name: 1 });

// Pre-save middleware to generate slug from name
CategorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }
  next();
});

// Pre-save middleware for subcategories to generate slug
SubCategorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }
  next();
});

// Static method to get featured categories
CategorySchema.statics.getFeatured = function() {
  return this.find({ featured: true }).sort({ createdAt: -1 });
};

// Static method to get category with subcategories
CategorySchema.statics.getWithSubcategories = function() {
  return this.find({}).populate('subcategories');
};

export default mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);