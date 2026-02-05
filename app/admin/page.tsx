'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Book, Users, ShoppingCart, TrendingUp, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { sampleBooks } from '@/lib/sampleData';
import { Badge } from '@/components/ui/badge';
import { AuthorFormDialog } from '@/components/ui/author-form-dialog';
import { CategoryFormDialog } from '@/components/ui/category-form-dialog';
import { BookFormDialog } from '@/components/ui/book-form-dialog';

interface DashboardData {
  userStats: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    recentUsers: { id: string; name: string; email: string; joinDate: string; isActive: boolean }[];
  };
  metrics: {
    totalBooks: number;
    featuredBooks: number;
    anticipatedBooks: number;
    bestsellerBooks: number;
    newReleaseLists: number;
    totalCategories: number;
    totalAuthors: number;
    inventoryValue: number;
    totalStock: number;
    lowStockCount: number;
  };
  recent: {
    books: { id: string; title: string; authorName: string; discountedPrice: number; stock: number; inStock: boolean; createdAt: string }[];
  };
  top: {
    ratedBooks: { id: string; title: string; authorName: string; rating: number; reviewCount: number; discountedPrice: number }[];
  };
  charts: {
    monthlyActivity: { key: string; label: string; booksAdded: number; userSignups: number }[];
  };
}

// Fallback skeleton arrays for charts while loading
const skeletonMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

export default function AdminDashboard() {
  const { user, logout, login } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loadingDash, setLoadingDash] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('bookhaven-token') : null;
  // Tab state
  const [tab, setTab] = useState<'books' | 'authors' | 'categories' | 'orders' | 'reviews'>('books');
  // Authors state
  const [authors, setAuthors] = useState<any[]>([]);
  const [authorsLoading, setAuthorsLoading] = useState(false);
  const [authorDialogOpen, setAuthorDialogOpen] = useState(false);
  const [authorDialogMode, setAuthorDialogMode] = useState<'add' | 'edit'>('add');
  const [editingAuthor, setEditingAuthor] = useState<any | null>(null);
  // Categories state
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categoryDialogMode, setCategoryDialogMode] = useState<'add' | 'edit'>('add');
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  // Books state
  const [bookDialogOpen, setBookDialogOpen] = useState(false);
  const [bookDialogMode, setBookDialogMode] = useState<'add' | 'edit'>('add');
  const [editingBook, setEditingBook] = useState<any | null>(null);

  // Generic helpers
  const adminHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }), [token]);

  const fetchAuthors = async () => {
    if (!token) return;
    setAuthorsLoading(true);
    try {
      const res = await fetch('/api/admin/authors?limit=10', { headers: adminHeaders });
      const json = await res.json();
      if (res.ok && json.success) setAuthors(json.data || []); else console.warn('Authors fetch failed', json);
    } catch (e) {
      console.error('Fetch authors error', e);
    } finally {
      setAuthorsLoading(false);
    }
  };

  const fetchCategories = async () => {
    if (!token) return;
    setCategoriesLoading(true);
    try {
      const res = await fetch('/api/admin/categories?limit=10', { headers: adminHeaders });
      const json = await res.json();
      if (res.ok && json.success) setCategories(json.data || []); else console.warn('Categories fetch failed', json);
    } catch (e) {
      console.error('Fetch categories error', e);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Fetch per-tab when selected
  useEffect(() => {
    if (user?.role !== 'admin') return;
    if (tab === 'authors') fetchAuthors();
    if (tab === 'categories') fetchCategories();
  }, [tab, user]);

  useEffect(() => {
    if (user?.role === 'admin') {
      const fetchData = async () => {
        try {
          setLoadingDash(true);
          const res = await fetch('/api/admin/dashboard', {
            headers: {
              Authorization: token ? `Bearer ${token}` : ''
            }
          });
          const json = await res.json();
          if (res.ok && json.success) {
            setDashboard(json.data);
          }
        } catch (e) {
          console.error('Dashboard fetch error', e);
        } finally {
          setLoadingDash(false);
        }
      };
      fetchData();
    }
  }, [user, token]);

  const stats = useMemo(() => {
    return [
      { title: 'Total Books', value: dashboard?.metrics.totalBooks ?? '—', icon: Book, color: 'purple' },
      { title: 'Total Users', value: dashboard?.userStats.totalUsers ?? '—', icon: Users, color: 'blue' },
      { title: 'New Release Lists', value: dashboard?.metrics.newReleaseLists ?? '—', icon: Book, color: 'pink' },
      { title: 'Low Stock (<5)', value: dashboard?.metrics.lowStockCount ?? '—', icon: ShoppingCart, color: 'green' },
      { title: 'Inventory Value', value: dashboard ? `₹${dashboard.metrics.inventoryValue.toLocaleString()}` : '—', icon: TrendingUp, color: 'orange' }
    ];
  }, [dashboard]);

  const monthlyChartData = useMemo(() => {
    if (!dashboard) return skeletonMonths.map(m => ({ name: m, books: 0, signups: 0 }));
    return dashboard.charts.monthlyActivity.map(m => ({ name: m.label, books: m.booksAdded, signups: m.userSignups }));
  }, [dashboard]);

  const topRatedChartData = useMemo(() => {
    if (!dashboard) return [] as { name: string; rating: number }[];
    return dashboard.top.ratedBooks.map(b => ({ name: b.title, rating: b.rating }));
  }, [dashboard]);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(loginData.email, loginData.password, rememberMe);
    if (!success) {
      toast.error('Invalid admin credentials');
    }
  };

  if (!user || user.role !== 'admin') {

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Login</h1>
            <p className="text-gray-600">Access the Oxford Book House dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <Input
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="admin@bookhaven.com"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={loginData.password}
                  onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="admin123"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              <label
                htmlFor="rememberMe"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Remember me
              </label>
            </div>
            
            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
              Login to Dashboard
            </Button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
            <p className="text-gray-600">Welcome back, {user.name}</p>
          </div>
          <Button onClick={logout} variant="outline">
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    {stat.title}
                    {loadingDash && <span className="animate-pulse text-xs text-gray-400">loading...</span>}
                  </CardTitle>
                  <stat.icon className={`h-4 w-4 text-${stat.color}-600`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold text-${stat.color}-600`}>
                    {stat.value}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Activity</CardTitle>
              <CardDescription>Books added & user signups (last 6 months)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="books" fill="#6a0dad" name="Books Added" />
                  <Bar dataKey="signups" fill="#38bdf8" name="User Signups" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Rated Books</CardTitle>
              <CardDescription>Highest rated books (by rating & reviews)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={topRatedChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" hide={topRatedChartData.length > 8} />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="rating" stroke="#6a0dad" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Card>
          <CardContent className="p-6">
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="books">Books</TabsTrigger>
                <TabsTrigger value="authors">Authors</TabsTrigger>
                <TabsTrigger value="categories">Categories</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>
              
              <TabsContent value="books" className="mt-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">Recent Books</h3>
                  <Button 
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={() => {
                      setBookDialogMode('add');
                      setEditingBook(null);
                      setBookDialogOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Book
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Title</th>
                        <th className="text-left py-3 px-4">Author</th>
                        <th className="text-left py-3 px-4">Price</th>
                        <th className="text-left py-3 px-4">Stock</th>
                        <th className="text-left py-3 px-4">Added</th>
                        <th className="text-left py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(dashboard?.recent.books || []).map((book) => (
                        <tr key={book.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{book.title}</td>
                          <td className="py-3 px-4">{book.authorName}</td>
                          <td className="py-3 px-4">₹{book.discountedPrice}</td>
                          <td className="py-3 px-4">
                            <Badge className={book.inStock ? 'bg-green-500' : 'bg-red-500'}>
                              {book.inStock ? 'In Stock' : 'Out of Stock'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">{new Date(book.createdAt).toLocaleDateString()}</td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={async () => {
                                  try {
                                    // Fetch full book details for editing
                                    const res = await fetch(`/api/books/${book.id}`, {
                                      headers: adminHeaders,
                                    });
                                    const json = await res.json();
                                    if (res.ok && json.success && json.data) {
                                      const fullBook = json.data;
                                      setBookDialogMode('edit');
                                      setEditingBook({
                                        ...fullBook,
                                        _id: fullBook._id || fullBook.id,
                                        id: fullBook._id || fullBook.id,
                                        author: fullBook.authorName || fullBook.author,
                                        originalPrice: fullBook.mrp,
                                        finalPrice: fullBook.discountedPrice,
                                        category: fullBook.categorySlug,
                                        subcategory: fullBook.subcategorySlug,
                                        ageGroup: fullBook.ageGroup,
                                        genre: fullBook.genre,
                                        anticipated: !!fullBook.anticipated,
                                        bestseller: !!fullBook.bestseller,
                                        newRelease: !!fullBook.newRelease,
                                      });
                                      setBookDialogOpen(true);
                                    } else {
                                      toast.error('Failed to load book details');
                                    }
                                  } catch (e) {
                                    console.error('Error fetching book details', e);
                                    toast.error('Error loading book details');
                                  }
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-red-600 hover:text-red-700"
                                onClick={async () => {
                                  if (confirm('Are you sure you want to delete this book?')) {
                                    try {
                                      const res = await fetch(`/api/admin/books?id=${book.id}`, {
                                        method: 'DELETE',
                                        headers: adminHeaders,
                                      });
                                      const json = await res.json();
                                      if (res.ok && json.success) {
                                        toast.success('Book deleted successfully');
                                        // Refresh dashboard
                                        const dashRes = await fetch('/api/admin/dashboard', {
                                          headers: { Authorization: token ? `Bearer ${token}` : '' }
                                        });
                                        const dashJson = await dashRes.json();
                                        if (dashRes.ok && dashJson.success) {
                                          setDashboard(dashJson.data);
                                        }
                                      } else {
                                        toast.error(json.message || 'Failed to delete book');
                                      }
                                    } catch (e) {
                                      toast.error('Error deleting book');
                                    }
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {!dashboard && (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-sm text-gray-500">
                            Loading recent books...
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <BookFormDialog
                  open={bookDialogOpen}
                  onOpenChange={(o) => { 
                    setBookDialogOpen(o); 
                    if (!o) setEditingBook(null); 
                  }}
                  mode={bookDialogMode}
                  initialData={editingBook}
                  onSubmit={async (data) => {
                    try {
                      const payload = {
                        title: data.title,
                        author: data.author || undefined,
                        authorId: data.authorId,
                        description: data.description,
                        stock: Number(data.stock) || 0,
                        coverImage: data.coverImage,
                        category: data.category,
                        subcategory: data.subcategory,
                        mrp: Number(data.mrp ?? data.originalPrice ?? 0),
                        discountedPrice: Number(data.discountedPrice ?? data.finalPrice ?? 0),
                        discount: Number(data.discount ?? 0),
                        discountType: data.discountType || 'percentage',
                        discountAmount: data.discountAmount || 0,
                        hsnCode: data.hsnCode || undefined,
                        totalPages: data.totalPages || undefined,
                        isbn: data.isbn,
                        publisher: data.publisher,
                        binding: data.binding,
                        language: data.language,
                        ageGroup: data.ageGroup || undefined,
                        genre: data.genre || undefined,
                        featured: !!data.featured,
                        anticipated: !!data.anticipated,
                        bestseller: !!data.bestseller,
                        newRelease: !!data.newRelease,
                      };

                      if (bookDialogMode === 'add') {
                        const res = await fetch('/api/admin/books', {
                          method: 'POST',
                          headers: adminHeaders,
                          body: JSON.stringify(payload),
                        });
                        const json = await res.json();
                        if (res.ok && json.success) {
                          toast.success('Book added successfully');
                          setBookDialogOpen(false);
                          setEditingBook(null);
                          // Refresh dashboard
                          const dashRes = await fetch('/api/admin/dashboard', {
                            headers: { Authorization: token ? `Bearer ${token}` : '' }
                          });
                          const dashJson = await dashRes.json();
                          if (dashRes.ok && dashJson.success) {
                            setDashboard(dashJson.data);
                          }
                        } else {
                          toast.error(json.message || 'Failed to add book');
                        }
                      } else if (editingBook?.id || editingBook?._id) {
                        const bookId = editingBook.id || editingBook._id;
                        const res = await fetch(`/api/admin/books?id=${bookId}`, {
                          method: 'PUT',
                          headers: adminHeaders,
                          body: JSON.stringify(payload),
                        });
                        const json = await res.json();
                        if (res.ok && json.success) {
                          toast.success('Book updated successfully');
                          setBookDialogOpen(false);
                          setEditingBook(null);
                          // Refresh dashboard
                          const dashRes = await fetch('/api/admin/dashboard', {
                            headers: { Authorization: token ? `Bearer ${token}` : '' }
                          });
                          const dashJson = await dashRes.json();
                          if (dashRes.ok && dashJson.success) {
                            setDashboard(dashJson.data);
                          }
                        } else {
                          toast.error(json.message || 'Failed to update book');
                        }
                      }
                    } catch (e) {
                      console.error('Error saving book', e);
                      toast.error('Error saving book');
                    }
                  }}
                />
              </TabsContent>

              <TabsContent value="authors" className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Authors</h3>
                  <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => { setAuthorDialogMode('add'); setEditingAuthor(null); setAuthorDialogOpen(true); }}>
                    <Plus className="w-4 h-4 mr-2" /> Add Author
                  </Button>
                </div>
                <div className="overflow-x-auto border rounded-md">
                  <table className="w-full table-auto text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-2 px-3">Name</th>
                        <th className="text-left py-2 px-3">Nationality</th>
                        <th className="text-left py-2 px-3">Books</th>
                        <th className="text-left py-2 px-3">Featured</th>
                        <th className="text-left py-2 px-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {authors.map(a => (
                        <tr key={a._id} className="border-t hover:bg-gray-50">
                          <td className="py-2 px-3 font-medium">{a.name}</td>
                          <td className="py-2 px-3">{a.nationality || '-'}</td>
                          <td className="py-2 px-3">{a.booksCount}</td>
                          <td className="py-2 px-3">
                            <Badge className={a.featured ? 'bg-green-600' : 'bg-gray-400'}>{a.featured ? 'Yes' : 'No'}</Badge>
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => { setAuthorDialogMode('edit'); setEditingAuthor(a); setAuthorDialogOpen(true); }}>
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {authorsLoading && (
                        <tr><td colSpan={5} className="py-4 text-center text-gray-500">Loading authors...</td></tr>
                      )}
                      {!authorsLoading && authors.length === 0 && (
                        <tr><td colSpan={5} className="py-4 text-center text-gray-500">No authors found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <AuthorFormDialog
                  open={authorDialogOpen}
                  onOpenChange={(o) => { setAuthorDialogOpen(o); if (!o) setEditingAuthor(null); }}
                  mode={authorDialogMode}
                  initialData={editingAuthor}
                  onSubmit={async (data) => {
                    try {
                      if (authorDialogMode === 'add') {
                        const res = await fetch('/api/admin/authors', {
                          method: 'POST',
                          headers: adminHeaders,
                          body: JSON.stringify({
                            name: data.name,
                            nationality: data.nationality,
                            biography: data.biography,
                            profileImage: data.profileImage,
                            featured: data.featured
                          })
                        });
                        const json = await res.json();
                        if (res.ok && json.success) {
                          toast.success('Author added');
                          fetchAuthors();
                        } else toast.error(json.message || 'Failed to add author');
                      } else if (editingAuthor?._id) {
                        const res = await fetch(`/api/admin/authors?id=${editingAuthor._id}`, {
                          method: 'PUT',
                          headers: adminHeaders,
                          body: JSON.stringify({
                            name: data.name,
                            nationality: data.nationality,
                            biography: data.biography,
                            profileImage: data.profileImage,
                            featured: data.featured
                          })
                        });
                        const json = await res.json();
                        if (res.ok && json.success) {
                          toast.success('Author updated');
                          fetchAuthors();
                        } else toast.error(json.message || 'Failed to update author');
                      }
                    } catch (e) {
                      toast.error('Error saving author');
                    }
                  }}
                />
              </TabsContent>

              <TabsContent value="categories" className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Categories</h3>
                  <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => { setCategoryDialogMode('add'); setEditingCategory(null); setCategoryDialogOpen(true); }}>
                    <Plus className="w-4 h-4 mr-2" /> Add Category
                  </Button>
                </div>
                <div className="overflow-x-auto border rounded-md">
                  <table className="w-full table-auto text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-2 px-3">Name</th>
                        <th className="text-left py-2 px-3">Featured</th>
                        <th className="text-left py-2 px-3">Books</th>
                        <th className="text-left py-2 px-3">Subcategories</th>
                        <th className="text-left py-2 px-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map(c => (
                        <tr key={c._id} className="border-t hover:bg-gray-50">
                          <td className="py-2 px-3 font-medium">{c.name}</td>
                          <td className="py-2 px-3"><Badge className={c.featured ? 'bg-green-600' : 'bg-gray-400'}>{c.featured ? 'Yes' : 'No'}</Badge></td>
                          <td className="py-2 px-3">{c.booksCount}</td>
                          <td className="py-2 px-3">{c.subcategories?.length || 0}</td>
                          <td className="py-2 px-3">
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => { setCategoryDialogMode('edit'); setEditingCategory(c); setCategoryDialogOpen(true); }}>
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {categoriesLoading && (
                        <tr><td colSpan={5} className="py-4 text-center text-gray-500">Loading categories...</td></tr>
                      )}
                      {!categoriesLoading && categories.length === 0 && (
                        <tr><td colSpan={5} className="py-4 text-center text-gray-500">No categories found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <CategoryFormDialog
                  open={categoryDialogOpen}
                  onOpenChange={(o) => { setCategoryDialogOpen(o); if (!o) setEditingCategory(null); }}
                  mode={categoryDialogMode}
                  initialData={editingCategory}
                  onSubmit={async (data) => {
                    try {
                      if (categoryDialogMode === 'add') {
                        const res = await fetch('/api/admin/categories', {
                          method: 'POST',
                          headers: adminHeaders,
                          body: JSON.stringify({
                            name: data.name,
                            description: data.description,
                            featured: data.featured
                          })
                        });
                        const json = await res.json();
                        if (res.ok && json.success) { toast.success('Category added'); fetchCategories(); } else toast.error(json.message || 'Failed to add category');
                      } else if (editingCategory?._id) {
                        const res = await fetch(`/api/admin/categories?id=${editingCategory._id}`, {
                          method: 'PUT',
                          headers: adminHeaders,
                          body: JSON.stringify({
                            name: data.name,
                            description: data.description,
                            featured: data.featured
                          })
                        });
                        const json = await res.json();
                        if (res.ok && json.success) { toast.success('Category updated'); fetchCategories(); } else toast.error(json.message || 'Failed to update category');
                      }
                    } catch (e) {
                      toast.error('Error saving category');
                    }
                  }}
                />
              </TabsContent>

              <TabsContent value="orders" className="mt-6">
                <h3 className="text-xl font-bold mb-6">Order Management</h3>
                <p className="text-gray-600">Order management interface would go here...</p>
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                <h3 className="text-xl font-bold mb-6">Review Management</h3>
                <p className="text-gray-600">Review management interface would go here...</p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}