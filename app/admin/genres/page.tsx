'use client';

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

type Genre = {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
};

const defaultForm = () => ({
  name: '',
  description: '',
  sortOrder: '0',
  isActive: true,
});

const getAuthHeaders = (): HeadersInit => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('bookhaven-token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function GenresPage() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(false);
  const [formSaving, setFormSaving] = useState(false);
  const [form, setForm] = useState(() => defaultForm());
  const [editingId, setEditingId] = useState<string | null>(null);

  const resolveId = (entity: Genre) => {
    const value = entity._id || entity.id;
    return value ? String(value) : '';
  };

  const loadGenres = useCallback(async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const res = await fetch('/api/admin/genres?includeInactive=true', { headers });
      const json = await res.json();
      if (!json?.success) throw new Error(json?.message || 'Failed to load genres');
      setGenres(Array.isArray(json.data) ? json.data : []);
    } catch (error: any) {
      toast.error(error?.message || 'Unable to load genres');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGenres();
  }, [loadGenres]);

  const resetForm = () => {
    setForm(defaultForm());
    setEditingId(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error('Genre name is required');
      return;
    }
    try {
      setFormSaving(true);
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      };
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() ? form.description.trim() : undefined,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      };
      const url = editingId ? `/api/admin/genres?id=${editingId}` : '/api/admin/genres';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!json?.success) throw new Error(json?.message || 'Unable to save genre');
      toast.success(editingId ? 'Genre updated' : 'Genre created');
      resetForm();
      await loadGenres();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save genre');
    } finally {
      setFormSaving(false);
    }
  };

  const handleEdit = (item: Genre) => {
    const id = resolveId(item);
    if (!id) return;
    setEditingId(id);
    setForm({
      name: item.name || '',
      description: item.description || '',
      sortOrder: String(item.sortOrder ?? 0),
      isActive: item.isActive !== false,
    });
  };

  const handleDelete = async (id: string) => {
    if (!id) return;
    if (!confirm('Delete this genre? This cannot be undone.')) return;
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/admin/genres?id=${id}`, { method: 'DELETE', headers });
      const json = await res.json();
      if (!json?.success) throw new Error(json?.message || 'Unable to delete genre');
      toast.success('Genre deleted');
      if (editingId === id) resetForm();
      await loadGenres();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete genre');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Genres</h1>
          <p className="text-sm text-gray-500">Create, edit, and control the genres used throughout the store.</p>
        </div>
        {loading && <span className="text-xs text-gray-500">Refreshing…</span>}
      </div>

      <div className="bg-white rounded-lg shadow p-5 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="genreName">Genre name</Label>
            <Input
              id="genreName"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Mystery Thriller"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="genreDescription">Description (optional)</Label>
            <Textarea
              id="genreDescription"
              rows={2}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Internal helper text"
            />
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1 space-y-2">
              <Label htmlFor="genreSort">Sort order</Label>
              <Input
                id="genreSort"
                type="number"
                min="0"
                value={form.sortOrder}
                onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-3 pt-2 sm:pt-6">
              <Switch 
                id="genreActive"
                checked={form.isActive}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="genreActive" className="text-sm text-gray-600">Visible in dropdowns</Label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button className='bg-purple-600 hover:bg-purple-700' type="submit" disabled={formSaving}>
              {formSaving ? 'Saving…' : editingId ? 'Update Genre' : 'Add Genre'}
            </Button>
            {editingId && (
              <Button type="button" variant="ghost" onClick={resetForm} disabled={formSaving}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
        {genres.length ? (
          genres.map((genre) => {
            const id = resolveId(genre);
            return (
              <div key={id} className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                    {genre.name}
                    <Badge
                      variant={genre.isActive !== false ? 'secondary' : 'outline'}
                      className={genre.isActive !== false ? 'bg-green-100 text-green-800' : 'text-gray-500'}
                    >
                      {genre.isActive !== false ? 'Active' : 'Hidden'}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500 flex flex-wrap gap-4">
                    <span>Slug: {genre.slug}</span>
                    <span>Order: {genre.sortOrder ?? 0}</span>
                  </div>
                  {genre.description && <p className="text-xs text-gray-500">{genre.description}</p>}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => handleEdit(genre)}>
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => {
                      if (!id) {
                        toast.error('Unable to determine genre id');
                        return;
                      }
                      handleDelete(id);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="p-6 text-sm text-center text-gray-500">No genres found.</p>
        )}
      </div>
    </div>
  );
}

