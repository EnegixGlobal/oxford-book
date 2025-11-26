'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ImageIcon, Loader2, Pencil, Plus, Trash2, UploadCloud, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

type HeroSlide = {
  _id?: string;
  imageUrl: string;
  imagePublicId?: string;
  sortOrder: number;
  isActive: boolean;
};

const emptyForm: HeroSlide = {
  imageUrl: '',
  imagePublicId: '',
  sortOrder: 0,
  isActive: true
};

const getAuthHeaders = (): HeadersInit => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('bookhaven-token');
  return token ? ({ Authorization: `Bearer ${token}` } as Record<string, string>) : {};
};

export default function HeroSlidesAdminPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<HeroSlide>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState(false);
  const desktopInputRef = useRef<HTMLInputElement>(null);

  const loadSlides = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/hero-slides', { headers: { ...getAuthHeaders() } });
      const data = await res.json();
      if (data?.success) {
        setSlides(data.data || []);
      } else {
        toast.error(data?.message || 'Failed to load slides');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load slides');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlides();
  }, []);

  const activeCount = useMemo(() => slides.filter((s) => s.isActive).length, [slides]);

  const openCreateDialog = () => {
    setEditingId(null);
    setForm({ ...emptyForm, sortOrder: slides.length });
    setDialogOpen(true);
  };

  const openEditDialog = (slide: HeroSlide) => {
    setEditingId(slide._id || null);
    setForm({
      imageUrl: slide.imageUrl || '',
      imagePublicId: slide.imagePublicId || '',
      sortOrder: slide.sortOrder ?? 0,
      isActive: slide.isActive
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setForm(emptyForm);
    setEditingId(null);
  };

  const uploadImage = async (file: File) => {
    if (!file) return;
    const headers = getAuthHeaders();
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', 'hero-slides');
    formData.append('publicId', `hero-desktop-${Date.now()}`);

    try {
      setUploadingField(true);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers,
        body: formData
      });
      const data = await res.json();
      if (!data?.success) {
        throw new Error(data?.message || 'Upload failed');
      }
      setForm((prev) => ({
        ...prev,
        imageUrl: data.data.url,
        imagePublicId: data.data.publicId
      }));
      toast.success('Image uploaded');
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploadingField(false);
    }
  };

  const deleteCloudImage = async (publicId?: string | null) => {
    if (!publicId) return;
    try {
      await fetch(`/api/admin/upload?publicId=${encodeURIComponent(publicId)}`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders() }
      });
    } catch (error) {
      console.error('Failed to delete cloud image', error);
    }
  };

  const saveSlide = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.imageUrl.trim()) {
      toast.error('Desktop image URL is required');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...form,
        sortOrder: Number(form.sortOrder) || 0
      };

      const response = await fetch(
        editingId ? `/api/admin/hero-slides?id=${editingId}` : '/api/admin/hero-slides',
        {
          method: editingId ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();
      if (!data?.success) {
        toast.error(data?.message || 'Unable to save slide');
        return;
      }

      toast.success(editingId ? 'Slide updated' : 'Slide created');
      closeDialog();
      loadSlides();
    } catch (error) {
      console.error(error);
      toast.error('Unable to save slide');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (slide: HeroSlide, isActive: boolean) => {
    if (!slide._id) return;
    const previous = slide.isActive;
    setSlides((prev) => prev.map((s) => (s._id === slide._id ? { ...s, isActive } : s)));

    try {
      const res = await fetch(`/api/admin/hero-slides?id=${slide._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ isActive })
      });
      const data = await res.json();
      if (!data?.success) {
        throw new Error(data?.message || 'Failed to update');
      }
      toast.success(isActive ? 'Slide activated' : 'Slide hidden');
    } catch (error) {
      console.error(error);
      setSlides((prev) => prev.map((s) => (s._id === slide._id ? { ...s, isActive: previous } : s)));
      toast.error('Failed to update slide');
    }
  };

  const deleteSlide = async (slide: HeroSlide) => {
    if (!slide._id) return;
    if (!confirm(`Delete slide "${slide.imageUrl}"?`)) return;

    try {
      const res = await fetch(`/api/admin/hero-slides?id=${slide._id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders() }
      });
      const data = await res.json();
      if (!data?.success) {
        toast.error(data?.message || 'Failed to delete slide');
        return;
      }
      toast.success('Slide deleted');
      await deleteCloudImage(slide.imagePublicId);
      setSlides((prev) => prev.filter((s) => s._id !== slide._id));
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete slide');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-2">
            <ImageIcon className="w-8 h-8 text-purple-600" /> Hero Slider
          </h1>
          <p className="text-gray-500">
            Manage the images and copy that appear in the homepage hero carousel.
          </p>
          <p className="text-sm text-gray-400">Active slides: {activeCount}</p>
        </div>
        <Button onClick={openCreateDialog} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Slide
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {slides.map((slide) => (
          <div key={slide._id || slide.imageUrl} className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <div className="relative h-48 w-full bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slide.imageUrl}
                alt="Hero slide"
                className="h-full w-full object-cover"
              />
              <div className="absolute top-2 right-2 flex items-center gap-2">
                <Button variant="secondary" size="icon" onClick={() => openEditDialog(slide)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="destructive" size="icon" onClick={() => deleteSlide(slide)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <p className="text-xs uppercase text-gray-400">Desktop</p>
                <a href={slide.imageUrl} className="text-sm text-purple-600 break-all" target="_blank" rel="noreferrer">
                  {slide.imageUrl}
                </a>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex flex-col">
                  <span className="text-gray-500">Sort order</span>
                  <span className="font-semibold">{slide.sortOrder}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={slide.isActive} onCheckedChange={(checked) => toggleActive(slide, checked)} />
                  <span className="text-sm">{slide.isActive ? 'Visible' : 'Hidden'}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!slides.length && !loading ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-gray-500">
          No slides yet. Click &ldquo;Add Slide&rdquo; to get started.
        </div>
      ) : null}

      <Dialog open={dialogOpen} onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}>
        <DialogContent className="sm:max-w-[700px] md:max-w-[900px] h-[90vh] max-h-[820px] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit slide' : 'Add slide'}</DialogTitle>
            <DialogDescription>Configure the media and copy for this hero slide.</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveSlide} className="flex-1 overflow-y-auto space-y-6 pr-2">
            <div className="space-y-4 rounded-xl border bg-gray-50 p-4">
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Desktop image URL *</Label>
                <Input
                  id="imageUrl"
                  value={form.imageUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="/book/book1.jpg"
                  required
                />
              </div>
              <div className="flex flex-col gap-2 rounded-lg border border-dashed border-gray-300 bg-white/70 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-600">Upload from computer</p>
                  <input
                    ref={desktopInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadImage(file);
                      e.target.value = '';
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => desktopInputRef.current?.click()}
                    disabled={uploadingField}
                  >
                    {uploadingField ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading…
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4 mr-2" />
                        Upload
                      </>
                    )}
                  </Button>
                </div>
                {uploadingField ? (
                  <div className="flex items-center text-sm text-gray-500 gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Uploading image…
                  </div>
                ) : null}
                {form.imageUrl ? (
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="truncate">{form.imageUrl}</span>
                    <button
                      type="button"
                      className="text-red-500 hover:text-red-600"
                      onClick={() =>
                        setForm((prev) => ({ ...prev, imageUrl: '', imagePublicId: '' }))
                      }
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : null}
              </div>
            </div>


            <div className="grid gap-4 rounded-xl border bg-white p-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Sort order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))}
                />
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isActive: checked }))}
                  id="visible"
                />
                <Label htmlFor="visible">Visible on homepage</Label>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white pt-4">
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : editingId ? 'Update slide' : 'Create slide'}
                </Button>
              </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

