'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function AdminForthcomingPage() {
  const [title, setTitle] = useState('Forthcoming Books');
  const [description, setDescription] = useState('Be the first to explore our soon-to-be-released titles');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/forthcoming-title');
      const data = await res.json();
      if (data.success && data.data) {
        setTitle(data.data.title || 'Forthcoming Books');
        setDescription(data.data.description || 'Be the first to explore our soon-to-be-released titles');
        setIsActive(data.data.isActive ?? true);
      }
    } catch (error) {
      console.error('Failed to fetch forthcoming section settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Section Title is required');
      return;
    }

    try {
      const res = await fetch('/api/admin/forthcoming-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, isActive }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Forthcoming section settings saved successfully');
      } else {
        toast.error(data.error || 'Failed to save settings');
      }
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Forthcoming Books Section Title</h1>
      <p className="text-gray-600 mb-8">Change the heading and subheading shown on the homepage for Forthcoming Books section</p>

      <div className="space-y-6 bg-white border p-6 rounded-lg shadow-sm">
        {/* Section Title */}
        <div>
          <label className="text-sm font-medium block mb-2">Section Title (Heading) *</label>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g., Forthcoming Books"
          />
        </div>

        {/* Section Subtitle / Description */}
        <div>
          <label className="text-sm font-medium block mb-2">Section Description (Subheading)</label>
          <Textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g., Be the first to explore our soon-to-be-released titles"
            rows={4}
          />
        </div>

        {/* Active Toggle */}
        <div className="flex items-center gap-2">
          <Switch checked={isActive} onCheckedChange={setIsActive} />
          <label className="text-sm font-medium">Show Section on Homepage</label>
        </div>

        <Button onClick={handleSave} className="w-full bg-purple-600 hover:bg-purple-700">
          Save Settings
        </Button>
      </div>
    </div>
  );
}
