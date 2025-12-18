'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Upload, X } from 'lucide-react';

interface BannerData {
  image: string;
  text: string;
  link: string;
  isActive: boolean;
}

const emptyBanner: BannerData = { image: '', text: '', link: '', isActive: true };

export default function SmallBannersPage() {
  const [banner1, setBanner1] = useState<BannerData>(emptyBanner);
  const [banner2, setBanner2] = useState<BannerData>(emptyBanner);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<1 | 2 | null>(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const res = await fetch('/api/admin/small-banners');
      const data = await res.json();
      if (data.success && data.data) {
        const b1 = data.data.find((b: any) => b.position === 1);
        const b2 = data.data.find((b: any) => b.position === 2);
        if (b1) setBanner1({ image: b1.image, text: b1.text, link: b1.link, isActive: b1.isActive });
        if (b2) setBanner2({ image: b2.image, text: b2.text, link: b2.link, isActive: b2.isActive });
      }
    } catch (error) {
      console.error('Failed to fetch banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, position: 1 | 2) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(position);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', 'small-banners');

    try {
      const token = localStorage.getItem('bookhaven-token');
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.data?.url) {
        if (position === 1) setBanner1(prev => ({ ...prev, image: data.data.url }));
        else setBanner2(prev => ({ ...prev, image: data.data.url }));
        toast.success('Image uploaded');
      } else {
        toast.error('Upload failed');
      }
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async (position: 1 | 2) => {
    const banner = position === 1 ? banner1 : banner2;
    
    if (!banner.image) {
      toast.error('Please upload an image');
      return;
    }
    if (!banner.text) {
      toast.error('Please enter text');
      return;
    }
    if (!banner.link) {
      toast.error('Please enter a link');
      return;
    }

    try {
      const res = await fetch('/api/admin/small-banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...banner, position }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Banner ${position} saved`);
      } else {
        toast.error(data.error || 'Failed to save');
      }
    } catch (error) {
      toast.error('Failed to save');
    }
  };

  const renderBannerForm = (position: 1 | 2) => {
    const banner = position === 1 ? banner1 : banner2;
    const setBanner = position === 1 ? setBanner1 : setBanner2;

    return (
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Banner {position}</h2>
        
        <div className="space-y-4">
          {/* Image Upload */}
          <div>
            <label className="text-sm font-medium block mb-2">Image (300 x 146) *</label>
            {banner.image ? (
              <div className="relative inline-block">
                <img src={banner.image} alt="Banner" className="w-[300px] h-[146px] object-cover rounded border" />
                <button
                  onClick={() => setBanner(prev => ({ ...prev, image: '' }))}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-[300px] h-[146px] border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                <Upload className="w-6 h-6 text-gray-400 mb-1" />
                <span className="text-sm text-gray-500">{uploading === position ? 'Uploading...' : 'Click to upload'}</span>
                <input type="file" accept="image/*" onChange={e => handleImageUpload(e, position)} className="hidden" disabled={uploading === position} />
              </label>
            )}
          </div>

          {/* Text */}
          <div>
            <label className="text-sm font-medium block mb-2">Text *</label>
            <Input
              value={banner.text}
              onChange={e => setBanner(prev => ({ ...prev, text: e.target.value }))}
              placeholder="e.g., Snuggle up with these books this winter season!"
            />
          </div>

          {/* Link */}
          <div>
            <label className="text-sm font-medium block mb-2">Link *</label>
            <Input
              value={banner.link}
              onChange={e => setBanner(prev => ({ ...prev, link: e.target.value }))}
              placeholder="e.g., /category/fiction"
            />
          </div>

          {/* Active */}
          <div className="flex items-center gap-2">
            <Switch checked={banner.isActive} onCheckedChange={checked => setBanner(prev => ({ ...prev, isActive: checked }))} />
            <label className="text-sm">Active</label>
          </div>

          <Button onClick={() => handleSave(position)} className="w-full">Save Banner {position}</Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2">Small Banners</h1>
      <p className="text-gray-600 mb-6">Two small banners displayed side by side after bestsellers</p>
      
      <div className="grid md:grid-cols-2 gap-6">
        {renderBannerForm(1)}
        {renderBannerForm(2)}
      </div>
    </div>
  );
}

