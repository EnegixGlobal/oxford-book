import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Book from '@/models/Book';
import Category from '@/models/Category';
import Author from '@/models/Author';
import { requireAdmin, AuthenticatedRequest } from '@/middleware/auth';

// Helper: build an array of the last N months (oldest -> newest)
function getLastNMonths(n: number) {
  const now = new Date();
  const months: { key: string; label: string; year: number; month: number }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = d.getMonth() + 1; // 1-12
    const year = d.getFullYear();
    const key = `${year}-${month.toString().padStart(2, '0')}`;
    const label = d.toLocaleString('default', { month: 'short' });
    months.push({ key, label, year, month });
  }
  return months;
}

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const authResult = await requireAdmin(request);
    if (authResult) {
      return authResult; // This will be an error response
    }

    const authRequest = request as AuthenticatedRequest;

    // Connect to database
    await connectDB();

    // Parallel primitives
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      recentUsers,
      totalBooks,
      featuredBooks,
      anticipatedBooks,
      bestsellerBooks,
      totalCategories,
      totalAuthors,
      inventoryAgg,
      lowStockCount,
      recentBooks,
      topRatedBooks
    ] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'customer', isActive: true }),
      User.countDocuments({ role: 'customer', isActive: false }),
      User.find({ role: 'customer' }).sort({ createdAt: -1 }).limit(5).select('name email joinDate isActive'),
      Book.countDocuments({}),
      Book.countDocuments({ featured: true }),
      Book.countDocuments({ anticipated: true }),
      Book.countDocuments({ bestseller: true }),
      Category.countDocuments({}),
      Author.countDocuments({}),
      Book.aggregate([
        { $group: { _id: null, value: { $sum: { $multiply: ['$discountedPrice', '$stock'] } }, totalStock: { $sum: '$stock' } } }
      ]),
      Book.countDocuments({ stock: { $lt: 5 } }),
  Book.find({}).sort({ createdAt: -1 }).limit(5).select('title authorName discountedPrice stock inStock createdAt').lean(),
  Book.find({}).sort({ rating: -1, reviewCount: -1 }).limit(5).select('title authorName rating reviewCount discountedPrice').lean()
    ]);

    // Monthly aggregates (books added & user signups)
    const monthsWindow = getLastNMonths(6); // last 6 months incl current
    const startDate = new Date(monthsWindow[0].year, monthsWindow[0].month - 1, 1);

    const [booksByMonthRaw, usersByMonthRaw] = await Promise.all([
      Book.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.y': 1, '_id.m': 1 } }
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: startDate }, role: 'customer' } },
        { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.y': 1, '_id.m': 1 } }
      ])
    ]);

    const booksByMonthMap = new Map<string, number>();
    booksByMonthRaw.forEach(r => {
      const key = `${r._id.y}-${r._id.m.toString().padStart(2, '0')}`;
      booksByMonthMap.set(key, r.count);
    });
    const usersByMonthMap = new Map<string, number>();
    usersByMonthRaw.forEach(r => {
      const key = `${r._id.y}-${r._id.m.toString().padStart(2, '0')}`;
      usersByMonthMap.set(key, r.count);
    });

    const monthlyActivity = monthsWindow.map(m => ({
      key: m.key,
      label: m.label,
      booksAdded: booksByMonthMap.get(m.key) || 0,
      userSignups: usersByMonthMap.get(m.key) || 0
    }));

    const inventoryValue = inventoryAgg?.[0]?.value || 0;
    const totalStock = inventoryAgg?.[0]?.totalStock || 0;

    return NextResponse.json({
      success: true,
      message: 'Admin dashboard data retrieved successfully',
      data: {
        userStats: {
          totalUsers,
          activeUsers,
            inactiveUsers,
          recentUsers: recentUsers.map(user => ({
            id: user._id,
            name: user.name,
            email: user.email,
            joinDate: user.joinDate,
            isActive: user.isActive
          }))
        },
        metrics: {
          totalBooks,
          featuredBooks,
          anticipatedBooks,
          bestsellerBooks,
          totalCategories,
          totalAuthors,
          inventoryValue,
          totalStock,
          lowStockCount
        },
        recent: {
          books: recentBooks.map((b: any) => ({
            id: b._id,
            title: b.title,
            authorName: b.authorName,
            discountedPrice: b.discountedPrice,
            stock: b.stock,
            inStock: b.inStock,
            createdAt: b.createdAt
          }))
        },
        top: {
          ratedBooks: topRatedBooks.map((b: any) => ({
            id: b._id,
            title: b.title,
            authorName: b.authorName,
            rating: b.rating,
            reviewCount: b.reviewCount,
            discountedPrice: b.discountedPrice
          }))
        },
        charts: {
          monthlyActivity
        }
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Admin dashboard error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
