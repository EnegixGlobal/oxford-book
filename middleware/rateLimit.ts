import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import RateLimitModel from '@/models/RateLimit';

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
}

/**
 * Rate limiting middleware using MongoDB
 * Tracks requests by IP address or userId
 */
export async function rateLimit(
  request: NextRequest,
  options: RateLimitOptions
): Promise<NextResponse | null> {
  try {
    await connectDB();

    const { windowMs, maxRequests, message = 'Too many requests, please try again later.', skipSuccessfulRequests = false } = options;

    // Get identifier (IP address or userId from session)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown';

    // Try to get userId from session if available
    const sessionId = request.cookies.get('sessionId')?.value;
    let identifier = `ip:${ip}`;

    if (sessionId) {
      const Session = (await import('@/models/Session')).default;
      const session = await Session.findOne({ sessionId, expiresAt: { $gt: new Date() } });
      if (session) {
        identifier = `user:${session.userId}`;
      }
    }

    // Clean up old rate limit records (older than windowMs)
    await RateLimitModel.deleteMany({
      identifier,
      createdAt: { $lt: new Date(Date.now() - windowMs) }
    });

    // Find or create rate limit record
    const now = new Date();
    const windowStart = new Date(now.getTime() - windowMs);

    let rateLimitRecord = await RateLimitModel.findOne({
      identifier,
      createdAt: { $gte: windowStart }
    });

    if (!rateLimitRecord) {
      // Create new rate limit record
      rateLimitRecord = new RateLimitModel({
        identifier,
        count: 1,
        windowStart,
        expiresAt: new Date(now.getTime() + windowMs),
      });
      await rateLimitRecord.save();
    } else {
      // Increment count
      rateLimitRecord.count += 1;
      rateLimitRecord.lastRequest = now;
      await rateLimitRecord.save();
    }

    // Check if limit exceeded
    if (rateLimitRecord.count > maxRequests) {
      const retryAfter = Math.ceil((rateLimitRecord.expiresAt.getTime() - now.getTime()) / 1000);

      return NextResponse.json(
        {
          success: false,
          message,
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitRecord.expiresAt).toISOString(),
          },
        }
      );
    }

    // Add rate limit headers
    const remaining = Math.max(0, maxRequests - rateLimitRecord.count);
    
    // Return null to continue (rate limit passed)
    // We'll attach headers in the response later
    return null;
  } catch (error) {
    console.error('Rate limit error:', error);
    // On error, allow request (fail open)
    return null;
  }
}

/**
 * Login rate limiting: 10 attempts per 10 minutes per IP/user
 */
export async function loginRateLimit(request: NextRequest): Promise<NextResponse | null> {
  return rateLimit(request, {
    windowMs: 10 * 60 * 1000, // 10 minutes
    maxRequests: 10,
    message: 'Too many login attempts. Please try again in 10 minutes.',
  });
}

/**
 * Signup rate limiting: 10 attempts per 30 minutes per IP/user
 */
export async function signupRateLimit(request: NextRequest): Promise<NextResponse | null> {
  return rateLimit(request, {
    windowMs: 30 * 60 * 1000, // 30 minutes
    maxRequests: 10,
    message: 'Too many signup attempts. Please try again in 30 minutes.',
  });
}

/**
 * API rate limiting: 150 requests per minute per user/IP
 */
export async function apiRateLimit(request: NextRequest): Promise<NextResponse | null> {
  return rateLimit(request, {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 150,
    message: 'API rate limit exceeded. Please slow down.',
  });
}

/**
 * Admin API rate limiting: 250 requests per minute
 */
export async function adminApiRateLimit(request: NextRequest): Promise<NextResponse | null> {
  return rateLimit(request, {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 250,
    message: 'Admin API rate limit exceeded.',
  });
}

