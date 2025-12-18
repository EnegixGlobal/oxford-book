'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Upload, X } from 'lucide-react';

export default function PromoBannerPage() {
  const [image, setImage] = useState('');
  const [link, setLink] = useState('');
  const [altText, setAltText] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [buttonText, setButtonText] = useState('Click Here');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchBanner();
  }, []);

  const fetchBanner = async () => {
    try {
      const res = await fetch('/api/admin/promo-banner');
      const data = await res.json();
      if (data.success && data.data) {
        setImage(data.data.image || '');
        setLink(data.data.link || '');
        setAltText(data.data.altText || '');
        setTitle(data.data.title || '');
        setDescription(data.data.description || '');
        setButtonText(data.data.buttonText || 'Click Here');
        setIsActive(data.data.isActive ?? true);
      }
    } catch (error) {
      console.error('Failed to fetch banner:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', 'promo-banners');

    try {
      const token = localStorage.getItem('bookhaven-token');
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.data?.url) {
        setImage(data.data.url);
        toast.success('Image uploaded');
      } else {
        toast.error('Upload failed');
      }
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!image) {
      toast.error('Please upload an image');
      return;
    }
    if (!link) {
      toast.error('Please enter a link/path');
      return;
    }

    try {
      const res = await fetch('/api/admin/promo-banner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, link, altText, title, description, buttonText, isActive }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Banner saved');
      } else {
        toast.error(data.error || 'Failed to save');
      }
    } catch (error) {
      toast.error('Failed to save');
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Promo Banner</h1>
      <p className="text-gray-600 mb-6">Upload a banner image (recommended size: 1250 x 360 pixels)</p>

      <div className="space-y-6">
        {/* Image Upload */}
        <div>
          <label className="text-sm font-medium block mb-2">Banner Image *</label>
          {image ? (
            <div className="relative">
              <img src={image} alt="Banner preview" className="w-full rounded-lg border" style={{ aspectRatio: '1250/360', objectFit: 'cover' }} />
              <button
                onClick={() => setImage('')}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">{uploading ? 'Uploading...' : 'Click to upload'}</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
            </label>
          )}
        </div>

        {/* Link */}
        <div>
          <label className="text-sm font-medium block mb-2">Link/Path *</label>
          <Input
            value={link}
            onChange={e => setLink(e.target.value)}
            placeholder="e.g., /category/fiction or /genre/thriller"
          />
          <p className="text-xs text-gray-500 mt-1">Enter the path where users will be redirected when clicking the banner</p>
        </div>

        {/* Alt Text */}
        <div>
          <label className="text-sm font-medium block mb-2">Alt Text</label>
          <Input
            value={altText}
            onChange={e => setAltText(e.target.value)}
            placeholder="Describe the banner for accessibility"
          />
        </div>

        {/* Title */}
        <div>
          <label className="text-sm font-medium block mb-2">Title (shown on banner)</label>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g., Summer Sale"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-medium block mb-2">Description</label>
          <Input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g., Up to 50% off on all fiction books"
          />
        </div>

        {/* Button Text */}
        <div>
          <label className="text-sm font-medium block mb-2">Button Text</label>
          <Input
            value={buttonText}
            onChange={e => setButtonText(e.target.value)}
            placeholder="Click Here"
          />
        </div>

        {/* Active Toggle */}
        <div className="flex items-center gap-2">
          <Switch checked={isActive} onCheckedChange={setIsActive} />
          <label className="text-sm">Active</label>
        </div>

        <Button onClick={handleSave} className="w-full">Save Banner</Button>
      </div>
    </div>
  );
}

