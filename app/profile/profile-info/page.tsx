'use client';

import { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, MapPin, Phone } from 'lucide-react';
import { toast } from 'sonner';

const ProfileInfoPage = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });

  const handleUpdateProfile = async () => {
    try {
      const token = localStorage.getItem('bookhaven-token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Profile updated successfully!');
        setIsEditing(false);
        // Update local storage with new user data
        const updatedUser = { ...user, ...formData };
        localStorage.setItem('bookhaven-user', JSON.stringify(updatedUser));
        // Refresh the page to update the auth context
        window.location.reload();
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error('Failed to update profile');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Profile Information</CardTitle>
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant={isEditing ? "outline" : "default"}
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            {isEditing ? (
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            ) : (
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
                <User className="w-4 h-4 text-gray-400" />
                <span>{user.name}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
              <span>{user.email}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            {isEditing ? (
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter your phone number"
              />
            ) : (
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{user.phone || 'Not provided'}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Account Type</Label>
            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
              <span className="capitalize">{user.role}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          {isEditing ? (
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Enter your address"
              rows={3}
            />
          ) : (
            <div className="flex items-start space-x-2 p-3 bg-gray-50 rounded-md">
              <MapPin className="w-4 h-4 text-gray-400 mt-1" />
              <span>{user.address || 'Not provided'}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Account Status</Label>
          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              user.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {user.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Member Since</Label>
          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
            <span>{new Date(user.joinDate).toLocaleDateString()}</span>
          </div>
        </div>

        {isEditing && (
          <div className="flex space-x-4 pt-4">
            <Button onClick={handleUpdateProfile}>
              Save Changes
            </Button>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileInfoPage;
