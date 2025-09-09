import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Category, { ICategory, ISubCategory } from '@/models/Category';
import { requireAdmin } from '@/middleware/auth';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// GET /api/admin/categories - Get all categories with pagination and search
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const authResult = await requireAdmin(request);
    if (authResult) {
      return authResult; // Returns error response if not admin
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const featured = searchParams.get('featured');

    await connectDB();

    // Build query
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'subcategories.name': { $regex: search, $options: 'i' } },
        { 'subcategories.description': { $regex: search, $options: 'i' } }
      ];
    }
    if (featured !== null) {
      query.featured = featured === 'true';
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get categories with pagination
    const categories = await Category.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await Category.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: categories,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error: any) {
    console.error('Get categories error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/categories - Create new category
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const authResult = await requireAdmin(request);
    if (authResult) {
      return authResult;
    }

    const body = await request.json();
    const { name, description, image, featured, isSubcategory, parentCategoryId } = body;

    console.log('Received data:', { name, description, image, featured, isSubcategory, parentCategoryId });

    // Validate required fields
    if (!name || !description) {
      return NextResponse.json(
        { success: false, message: 'Name and description are required' },
        { status: 400 }
      );
    }

    await connectDB();

    console.log('Checking condition: isSubcategory && parentCategoryId', isSubcategory, parentCategoryId);

    if (isSubcategory && parentCategoryId) {
      console.log('Creating subcategory for parent:', parentCategoryId);
      // Add subcategory to existing category
      const category = await Category.findById(parentCategoryId);
      if (!category) {
        return NextResponse.json(
          { success: false, message: 'Parent category not found' },
          { status: 404 }
        );
      }

      // Check if subcategory name already exists in this category
      const existingSubcategory = category.subcategories.find(
        (sub: ISubCategory) => sub.name.toLowerCase() === name.toLowerCase()
      );

      if (existingSubcategory) {
        return NextResponse.json(
          { success: false, message: 'Subcategory with this name already exists in this category' },
          { status: 409 }
        );
      }

      // Generate slug and check if it already exists
      const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const existingSlug = category.subcategories.find(
        (sub: ISubCategory) => sub.slug === slug
      );

      if (existingSlug) {
        return NextResponse.json(
          { success: false, message: 'Subcategory with this slug already exists in this category' },
          { status: 409 }
        );
      }

      // Add new subcategory
      const subcategoryData: any = {
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        description,
        booksCount: 0
      };

      // Add image if provided
      const imageUrl = typeof image === 'string' && image !== '{}' ? image : '';
      if (imageUrl) {
        subcategoryData.image = imageUrl;
      }

      category.subcategories.push(subcategoryData);

      await category.save();

      return NextResponse.json({
        success: true,
        message: 'Subcategory created successfully',
        data: category
      }, { status: 201 });

    } else {
      console.log('Creating main category');
      // Create new main category
      // Ensure image is a valid string (optional)
      const imageUrl = typeof image === 'string' && image !== '{}' ? image : '';

      // Note: Image is now optional for main categories too

      // Check if category name already exists
      const existingCategory = await Category.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') }
      });

      if (existingCategory) {
        return NextResponse.json(
          { success: false, message: 'Category with this name already exists' },
          { status: 409 }
        );
      }

      // Generate slug and check if it already exists
      const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const existingSlug = await Category.findOne({ slug });

      if (existingSlug) {
        return NextResponse.json(
          { success: false, message: 'Category with this slug already exists' },
          { status: 409 }
        );
      }

      const newCategory = new Category({
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        description,
        image: imageUrl,
        featured: featured || false,
        booksCount: 0,
        subcategories: []
      });

      await newCategory.save();

      return NextResponse.json({
        success: true,
        message: 'Category created successfully',
        data: newCategory
      }, { status: 201 });
    }

  } catch (error: any) {
    console.error('Create category error:', error);

    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: 'Category or subcategory with this name already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/categories/[id] - Update category
export async function PUT(request: NextRequest) {
  try {
    // Check admin authentication
    const authResult = await requireAdmin(request);
    if (authResult) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('id');

    if (!categoryId) {
      return NextResponse.json(
        { success: false, message: 'Category ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description, image, featured, isSubcategory, subcategoryId } = body;

    await connectDB();

    if (isSubcategory && subcategoryId) {
      // Update subcategory
      const category = await Category.findById(categoryId);
      if (!category) {
        return NextResponse.json(
          { success: false, message: 'Category not found' },
          { status: 404 }
        );
      }

      const subcategoryIndex = category.subcategories.findIndex(
        (sub: ISubCategory) => (sub._id as any).toString() === subcategoryId
      );

      if (subcategoryIndex === -1) {
        return NextResponse.json(
          { success: false, message: 'Subcategory not found' },
          { status: 404 }
        );
      }

      // Check if new name conflicts with existing subcategories
      const existingSubcategory = category.subcategories.find(
        (sub: ISubCategory, index: number) => index !== subcategoryIndex && sub.name.toLowerCase() === name.toLowerCase()
      );

      if (existingSubcategory) {
        return NextResponse.json(
          { success: false, message: 'Subcategory with this name already exists in this category' },
          { status: 409 }
        );
      }

      // Generate new slug and check if it conflicts with existing subcategories
      const newSlug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const existingSlug = category.subcategories.find(
        (sub: ISubCategory, index: number) => index !== subcategoryIndex && sub.slug === newSlug
      );

      if (existingSlug) {
        return NextResponse.json(
          { success: false, message: 'Subcategory with this slug already exists in this category' },
          { status: 409 }
        );
      }

      // Update subcategory
      const updateData: any = {
        ...category.subcategories[subcategoryIndex],
        name,
        slug: newSlug,
        description
      };

      // Add image if provided
      const imageUrl = typeof image === 'string' && image !== '{}' ? image : '';
      if (imageUrl) {
        updateData.image = imageUrl;
      }

      category.subcategories[subcategoryIndex] = updateData;

      await category.save();

      return NextResponse.json({
        success: true,
        message: 'Subcategory updated successfully',
        data: category
      });

    } else {
      // Update main category
      const updateData: any = {};
      if (name) updateData.name = name;
      if (description) updateData.description = description;

      // Ensure image is a valid string
      const imageUrl = typeof image === 'string' && image !== '{}' ? image : '';
      if (imageUrl) updateData.image = imageUrl;
      if (featured !== undefined) updateData.featured = featured;

      const updatedCategory = await Category.findByIdAndUpdate(
        categoryId,
        updateData,
        { new: true, runValidators: true }
      );

      if (!updatedCategory) {
        return NextResponse.json(
          { success: false, message: 'Category not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Category updated successfully',
        data: updatedCategory
      });
    }

  } catch (error: any) {
    console.error('Update category error:', error);

    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: 'Category or subcategory with this name already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/categories/[id] - Delete category
export async function DELETE(request: NextRequest) {
  try {
    // Check admin authentication
    const authResult = await requireAdmin(request);
    if (authResult) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('id');
    const subcategoryId = searchParams.get('subcategoryId');

    if (!categoryId) {
      return NextResponse.json(
        { success: false, message: 'Category ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    if (subcategoryId) {
      // Delete subcategory
      const category = await Category.findById(categoryId);
      if (!category) {
        return NextResponse.json(
          { success: false, message: 'Category not found' },
          { status: 404 }
        );
      }

      category.subcategories = category.subcategories.filter(
        (sub: ISubCategory) => (sub._id as any).toString() !== subcategoryId
      );

      await category.save();

      return NextResponse.json({
        success: true,
        message: 'Subcategory deleted successfully'
      });

    } else {
      // Delete main category
      const deletedCategory = await Category.findByIdAndDelete(categoryId);

      if (!deletedCategory) {
        return NextResponse.json(
          { success: false, message: 'Category not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Category deleted successfully'
      });
    }

  } catch (error: any) {
    console.error('Delete category error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
