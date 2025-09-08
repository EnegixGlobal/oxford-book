import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// JWT Verification Middleware
export async function verifyToken(request: NextRequest): Promise<{
  success: boolean;
  user?: { id: string; email: string; role: string };
  error?: string;
}> {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return { success: false, error: 'No token provided' };
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    // Connect to database and verify user exists
    await connectDB();
    const user = await User.findById(decoded.userId).select('email role isActive');

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (!user.isActive) {
      return { success: false, error: 'User account is deactivated' };
    }

    return {
      success: true,
      user: {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role
      }
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { success: false, error: 'Token expired' };
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return { success: false, error: 'Invalid token' };
    }
    return { success: false, error: 'Token verification failed' };
  }
}

// Role-based Access Control Middleware
export function requireRole(allowedRoles: string[]) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const authResult = await verifyToken(request);

    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: authResult.error },
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

    // Add user info to request for use in route handlers
    (request as AuthenticatedRequest).user = authResult.user;

    return null; // Continue to next middleware/route handler
  };
}

// Customer-only access middleware
export const requireCustomer = requireRole(['customer']);

// Admin-only access middleware
export const requireAdmin = requireRole(['admin']);

// Admin or Customer access middleware
export const requireAuth = requireRole(['customer', 'admin']);

// Optional authentication (doesn't fail if no token)
export async function optionalAuth(request: NextRequest): Promise<{
  user?: { id: string; email: string; role: string };
  isAuthenticated: boolean;
}> {
  const authResult = await verifyToken(request);

  if (authResult.success) {
    return {
      user: authResult.user,
      isAuthenticated: true
    };
  }

  return { isAuthenticated: false };
}