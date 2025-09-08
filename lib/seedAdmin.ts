import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function createAdminUser() {
  try {
    await connectDB();

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
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

    console.log('✅ Admin user created successfully');
    console.log('Email: admin@bookhaven.com');
    console.log('Password: Admin123!');

  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

// Run this function to create admin user
// createAdminUser();
