'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Book, Users, ShoppingCart, TrendingUp, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { sampleBooks } from '@/lib/sampleData';
import { Badge } from '@/components/ui/badge';

const salesData = [
  { name: 'Jan', sales: 4000, orders: 240 },
  { name: 'Feb', sales: 3000, orders: 198 },
  { name: 'Mar', sales: 5000, orders: 320 },
  { name: 'Apr', sales: 4500, orders: 278 },
  { name: 'May', sales: 6000, orders: 390 },
  { name: 'Jun', sales: 5500, orders: 345 }
];

const topBooksData = [
  { name: 'Atomic Habits', sales: 1200 },
  { name: 'The Midnight Library', sales: 980 },
  { name: 'Sapiens', sales: 760 },
  { name: 'Harry Potter', sales: 650 }
];

export default function AdminDashboard() {
  const { user, logout, login } = useAuth();
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(loginData.email, loginData.password);
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
            <p className="text-gray-600">Access the BookHaven dashboard</p>
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
              <Input
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="admin123"
                required
              />
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { title: 'Total Books', value: '2,847', icon: Book, color: 'purple' },
            { title: 'Total Users', value: '15,432', icon: Users, color: 'blue' },
            { title: 'Monthly Orders', value: '1,234', icon: ShoppingCart, color: 'green' },
            { title: 'Revenue', value: '₹2,34,567', icon: TrendingUp, color: 'orange' }
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
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
              <CardTitle>Monthly Sales</CardTitle>
              <CardDescription>Sales and orders over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sales" fill="#6a0dad" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Selling Books</CardTitle>
              <CardDescription>Best performing books this month</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={topBooksData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="sales" stroke="#6a0dad" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue="books" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="books">Books</TabsTrigger>
                <TabsTrigger value="authors">Authors</TabsTrigger>
                <TabsTrigger value="categories">Categories</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>
              
              <TabsContent value="books" className="mt-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">Manage Books</h3>
                  <Button className="bg-purple-600 hover:bg-purple-700">
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
                        <th className="text-left py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sampleBooks.slice(0, 5).map((book) => (
                        <tr key={book.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{book.title}</td>
                          <td className="py-3 px-4">{book.author}</td>
                          <td className="py-3 px-4">₹{book.discountedPrice}</td>
                          <td className="py-3 px-4">
                            <Badge className={book.inStock ? 'bg-green-500' : 'bg-red-500'}>
                              {book.inStock ? 'In Stock' : 'Out of Stock'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="authors" className="mt-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">Manage Authors</h3>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Author
                  </Button>
                </div>
                <p className="text-gray-600">Author management interface would go here...</p>
              </TabsContent>

              <TabsContent value="categories" className="mt-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">Manage Categories</h3>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Category
                  </Button>
                </div>
                <p className="text-gray-600">Category management interface would go here...</p>
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