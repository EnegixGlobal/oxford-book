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
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 justify-between">
          <CardTitle className="text-lg sm:text-xl">Profile Information</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? "outline" : "default"}
              size="sm"
              className="min-w-[110px]"
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs sm:text-sm">Full Name</Label>
            {isEditing ? (
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="h-9 sm:h-10 text-sm"
              />
            ) : (
              <div className="flex items-center space-x-2 p-2.5 sm:p-3 bg-gray-50 rounded-md text-sm">
                <User className="w-4 h-4 text-gray-400" />
                <span className="truncate">{user.name}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs sm:text-sm">Email Address</Label>
            <div className="flex items-center space-x-2 p-2.5 sm:p-3 bg-gray-50 rounded-md text-sm">
              <span className="truncate">{user.email}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-xs sm:text-sm">Phone Number</Label>
            {isEditing ? (
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter your phone number"
                className="h-9 sm:h-10 text-sm"
              />
            ) : (
              <div className="flex items-center space-x-2 p-2.5 sm:p-3 bg-gray-50 rounded-md text-sm">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{user.phone || 'Not provided'}</span>
              </div>
            )}
          </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-xs sm:text-sm">Account Type</Label>
              <div className="flex items-center space-x-2 p-2.5 sm:p-3 bg-gray-50 rounded-md text-sm">
                <span className="capitalize">{user.role}</span>
              </div>
            </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address" className="text-xs sm:text-sm">Address</Label>
          {isEditing ? (
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Enter your address"
              rows={3}
              className="text-sm"
            />
          ) : (
            <div className="flex items-start space-x-2 p-2.5 sm:p-3 bg-gray-50 rounded-md text-sm">
              <MapPin className="w-4 h-4 text-gray-400 mt-1" />
              <span className="whitespace-pre-line break-words">{user.address || 'Not provided'}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Account Status</Label>
            <div className="flex items-center space-x-2 p-2.5 sm:p-3 bg-gray-50 rounded-md">
              <span className={`px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                user.isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Member Since</Label>
            <div className="flex items-center space-x-2 p-2.5 sm:p-3 bg-gray-50 rounded-md text-sm">
              <span>{new Date(user.joinDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
            <Button onClick={handleUpdateProfile} size="sm" className="sm:min-w-[140px]">Save Changes</Button>
            <Button variant="outline" onClick={() => setIsEditing(false)} size="sm" className="sm:min-w-[120px]">Cancel</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileInfoPage;
