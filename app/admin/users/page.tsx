'use client';

import { useEffect, useState } from 'react';
import { Search, Eye, Edit, Trash2, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { toast } from 'sonner';
import { AdminPagination } from '@/components/ui/admin-pagination';

// Fetch users from admin API
const fetchUsers = async (page = 1, limit = 10, search = '') => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('bookhaven-token') : null;
  const url = new URL('/api/admin/users', window.location.origin);
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));
  if (search) url.searchParams.set('search', search);
  const res = await fetch(url.toString(), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.json();
};

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editStatus, setEditStatus] = useState('');
  const [editRole, setEditRole] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const result = await fetchUsers(currentPage, itemsPerPage, searchTerm);
      if (result?.success) {
        const mapped = (result.data || []).map((u: any) => ({
          id: u._id,
          name: u.name,
          email: u.email,
          phone: u.phone || '',
          address: u.address || '',
          joinDate: new Date(u.joinDate || u.createdAt).toISOString().slice(0, 10),
          status: u.isActive ? 'Active' : 'Inactive',
          orders: 0,
          totalSpent: 0,
          role: u.role === 'admin' ? 'Admin' : 'Customer',
        }));
        setUsers(mapped);
        setTotalItems(result.pagination?.totalItems || mapped.length);
        setTotalPages(result.pagination?.totalPages || 1);
      }
    } catch (e) {
      // noop toast for now
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [currentPage, searchTerm]);

  const handleViewUser = (user: any) => {
    setSelectedUser(user);
    setEditStatus(user.status);
    setEditRole(user.role);
    setDialogOpen(true);
  };

  const handleUpdateUser = () => {
    if (!selectedUser) return;
    setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, status: editStatus, role: editRole } : u));
    setSelectedUser((prev: any) => ({ ...prev, status: editStatus, role: editRole }));
    toast.success('User updated successfully');
    setDialogOpen(false);
  };

  const handleDeleteUser = (id: number) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    if (selectedUser?.id === id) setDialogOpen(false);
    toast.success('User deleted successfully');
  };

  const currentUsers = users; // server paginated

  // Reset to first page when search changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'Inactive':
        return <Badge className="bg-gray-500">Inactive</Badge>;
      case 'Suspended':
        return <Badge className="bg-red-500">Suspended</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Admin':
        return <Badge className="bg-purple-500">Admin</Badge>;
      case 'Customer':
        return <Badge className="bg-blue-500">Customer</Badge>;
      default:
        return <Badge className="bg-gray-500">{role}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-gray-900">Users Management</h1>
      </div>

      {/* Search Bar */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder="Search by name, email, or phone..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spent</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {user.name.split(' ').map((n: string) => n[0]).join('')}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        Joined {user.joinDate}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 flex items-center">
                    <Mail className="w-3 h-3 mr-1" />
                    {user.email}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center">
                    <Phone className="w-3 h-3 mr-1" />
                    {user.phone}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getRoleBadge(user.role)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(user.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.orders}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                  ₹{user.totalSpent}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewUser(user)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteUser(user.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
        />
      </div>

      {/* User Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] md:max-w-[700px] h-[90vh] max-h-[800px] flex flex-col">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>View and manage user information.</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6 flex-1 overflow-y-auto pr-2">
              {/* User Profile */}
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 h-16 w-16">
                  <div className="h-16 w-16 rounded-full bg-purple-500 flex items-center justify-center">
                    <span className="text-white font-medium text-lg">
                      {selectedUser.name.split(' ').map((n: string) => n[0]).join('')}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{selectedUser.name}</h3>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    {getRoleBadge(selectedUser.role)}
                    {getStatusBadge(selectedUser.status)}
                  </div>
                </div>
              </div>

              {/* User Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase text-gray-500 mb-1">Email</p>
                    <p className="font-medium flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      {selectedUser.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500 mb-1">Phone</p>
                    <p className="font-medium flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      {selectedUser.phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500 mb-1">Join Date</p>
                    <p className="font-medium flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      {selectedUser.joinDate}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase text-gray-500 mb-1">Address</p>
                    <p className="font-medium flex items-start">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400 mt-0.5" />
                      {selectedUser.address}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500 mb-1">Orders</p>
                    <p className="font-medium">{selectedUser.orders} orders</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500 mb-1">Total Spent</p>
                    <p className="font-medium">₹{selectedUser.totalSpent}</p>
                  </div>
                </div>
              </div>

              {/* Edit Section */}
              <div className="border-t pt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Edit User</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-xs uppercase text-gray-500">Status</p>
                    <Select value={editStatus} onValueChange={setEditStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                        <SelectItem value="Suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs uppercase text-gray-500">Role</p>
                    <Select value={editRole} onValueChange={setEditRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Customer">Customer</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => selectedUser && handleDeleteUser(selectedUser.id)}
                >
                  Delete User
                </Button>
                <div className="space-x-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Close</Button>
                  <Button type="button" onClick={handleUpdateUser}>Save Changes</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

