import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { customerSignupSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input data
    const validationResult = customerSignupSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    const { name, email, password, phone, address } = validationResult.data;

    // Connect to database
    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'User with this email already exists'
        },
        { status: 409 }
      );
    }

    // Create new customer user
    const newUser = new User({
      name,
      email,
      password,
      role: 'customer',
      phone,
      address
    });

    // Save user (password will be hashed by the pre-save middleware)
    await newUser.save();

    // Return success response (without password)
    return NextResponse.json(
      {
        success: true,
        message: 'Customer account created successfully',
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          phone: newUser.phone,
          address: newUser.address,
          joinDate: newUser.joinDate,
          isActive: newUser.isActive
        }
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Signup error:', error);

    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: 'User with this email already exists'
        },
        { status: 409 }
      );
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
