import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Session from '@/models/Session';
import { loginSchema } from '@/lib/validations';
import { loginRateLimit } from '@/middleware/rateLimit';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await loginRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult; // Rate limit exceeded
    }

    // Parse request body
    const body = await request.json();

    // Validate input data
    const validationResult = loginSchema.safeParse(body);
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

    const { email, password, rememberMe = false } = validationResult.data;

    // Connect to database
    await connectDB();

    // Find user by email and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid email or password'
        },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: 'Account is deactivated. Please contact support.'
        },
        { status: 401 }
      );
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid email or password'
        },
        { status: 401 }
      );
    }

    // Generate secure session ID
    const sessionId = crypto.randomBytes(32).toString('hex');

    // Get client information
    const userAgent = request.headers.get('user-agent') || undefined;
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               undefined;

    // Session expiration: 30 days if "Remember Me", otherwise 7 days
    const sessionDays = rememberMe ? 30 : 7;
    const expiresAt = new Date(Date.now() + sessionDays * 24 * 60 * 60 * 1000);

    // Create session in MongoDB
    const session = new Session({
      sessionId,
      userId: user._id,
      role: user.role,
      userAgent,
      ipAddress: ip,
      expiresAt,
      lastActivity: new Date(),
    });
    await session.save();

    // Delete old sessions for this user (keep only last 5 sessions)
    const userSessions = await Session.find({ userId: user._id })
      .sort({ createdAt: -1 });
    
    if (userSessions.length > 5) {
      const sessionsToDelete = userSessions.slice(5);
      await Session.deleteMany({
        _id: { $in: sessionsToDelete.map(s => s._id) }
      });
    }

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          address: user.address,
          joinDate: user.joinDate,
          isActive: user.isActive
        }
      },
      { status: 200 }
    );

    // Set HTTP-only cookie with session ID
    // Cookie expiration matches session expiration (30 days if rememberMe, 7 days otherwise)
    const isProduction = process.env.NODE_ENV === 'production';
    response.cookies.set('sessionId', sessionId, {
      httpOnly: true,
      secure: isProduction, // HTTPS only in production
      sameSite: 'lax', // CSRF protection
      maxAge: sessionDays * 24 * 60 * 60, // Match session expiration
      path: '/',
    });

    return response;

  } catch (error: any) {
    console.error('Login error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
