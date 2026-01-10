import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Session from '@/models/Session';
import { customerSignupSchema } from '@/lib/validations';
import { signupRateLimit } from '@/middleware/rateLimit';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await signupRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult; // Rate limit exceeded
    }

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

    // Generate secure session ID for automatic login after signup
    const sessionId = crypto.randomBytes(32).toString('hex');

    // Get client information
    const userAgent = request.headers.get('user-agent') || undefined;
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               request.ip ||
               undefined;

    // Session expires in 7 days
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Create session in MongoDB
    const session = new Session({
      sessionId,
      userId: newUser._id,
      role: newUser.role,
      userAgent,
      ipAddress: ip,
      expiresAt,
      lastActivity: new Date(),
    });
    await session.save();

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        message: 'Customer account created successfully',
        user: {
          id: newUser._id.toString(),
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

    // Set HTTP-only cookie with session ID for automatic login
    const isProduction = process.env.NODE_ENV === 'production';
    response.cookies.set('sessionId', sessionId, {
      httpOnly: true,
      secure: isProduction, // HTTPS only in production
      sameSite: 'lax', // CSRF protection
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: '/',
    });

    return response;

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
