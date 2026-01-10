import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Session from '@/models/Session';
import crypto from 'crypto';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  session?: {
    sessionId: string;
    userId: string;
    role: string;
  };
}

/**
 * Verify session from HTTP-only cookie
 * Checks MongoDB for valid session and updates lastActivity
 */
export async function verifySession(request: NextRequest): Promise<{
  success: boolean;
  user?: { id: string; email: string; role: string };
  session?: { sessionId: string; userId: string; role: string };
  error?: string;
}> {
  try {
    // Get sessionId from cookie
    const sessionId = request.cookies.get('sessionId')?.value;

    if (!sessionId) {
      return { success: false, error: 'No session found' };
    }

    // Connect to database
    await connectDB();

    // Find session in MongoDB
    const session = await Session.findOne({
      sessionId,
      expiresAt: { $gt: new Date() }, // Not expired
    }).populate('userId', 'email role isActive');

    if (!session) {
      return { success: false, error: 'Invalid or expired session' };
    }

    // Check if user exists and is active
    const user = session.userId as any;
    if (!user || !user.isActive) {
      // Delete invalid session
      await Session.deleteOne({ sessionId });
      return { success: false, error: 'User not found or inactive' };
    }

    // Update last activity (but not on every request to reduce DB writes)
    // Only update if last activity was more than 5 minutes ago
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (session.lastActivity < fiveMinutesAgo) {
      session.lastActivity = new Date();
      await session.save();
    }

    return {
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      },
      session: {
        sessionId: session.sessionId,
        userId: session.userId.toString(),
        role: session.role,
      },
    };
  } catch (error: any) {
    console.error('Session verification error:', error);
    return { success: false, error: 'Session verification failed' };
  }
}

/**
 * Legacy JWT verification (for backward compatibility during migration)
 * Will be removed after full migration
 */
export async function verifyToken(request: NextRequest): Promise<{
  success: boolean;
  user?: { id: string; email: string; role: string };
  error?: string;
}> {
  // First try session-based auth
  const sessionResult = await verifySession(request);
  if (sessionResult.success) {
    return {
      success: true,
      user: sessionResult.user,
    };
  }

  // Fallback to JWT from Authorization header (for backward compatibility)
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return { success: false, error: 'No token provided' };
    }

    const jwt = await import('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
      role: string;
    };

    await connectDB();
    const user = await User.findById(decoded.userId).select('email role isActive');

    if (!user || !user.isActive) {
      return { success: false, error: 'User not found or inactive' };
    }

    return {
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      },
    };
  } catch (error: any) {
    return { success: false, error: 'Invalid token' };
  }
}

// Role-based Access Control Middleware
export function requireRole(allowedRoles: string[]) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const authResult = await verifySession(request);

    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }

    if (!allowedRoles.includes(authResult.user!.role)) {
      return NextResponse.json(
        {
          success: false,
          message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
        },
        { status: 403 }
      );
    }

    // Add user and session info to request for use in route handlers
    (request as AuthenticatedRequest).user = authResult.user;
    (request as AuthenticatedRequest).session = authResult.session;

    return null; // Continue to next middleware/route handler
  };
}

// Customer-only access middleware
export const requireCustomer = requireRole(['customer']);

// Admin-only access middleware
export const requireAdmin = requireRole(['admin']);

// Admin or Customer access middleware
export const requireAuth = requireRole(['customer', 'admin']);

// Optional authentication (doesn't fail if no session)
export async function optionalAuth(request: NextRequest): Promise<{
  user?: { id: string; email: string; role: string };
  session?: { sessionId: string; userId: string; role: string };
  isAuthenticated: boolean;
}> {
  const authResult = await verifySession(request);

  if (authResult.success) {
    return {
      user: authResult.user,
      session: authResult.session,
      isAuthenticated: true
    };
  }

  return { isAuthenticated: false };
}