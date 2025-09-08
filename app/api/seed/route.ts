import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        {
          success: false,
          message: 'Seeding is not allowed in production'
        },
        { status: 403 }
      );
    }

    await connectDB();

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: 'Admin user already exists'
        },
        { status: 409 }
      );
    }

    // Create admin user
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@bookhaven.com',
      password: 'Admin123!',
      role: 'admin',
      phone: '+91 9876543214',
      address: 'Admin Office, Mumbai, Maharashtra'
    });

    await adminUser.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Admin user created successfully',
        admin: {
          id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role
        }
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Seed error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
