'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Book {
  _id: string;
  title: string;
  slug: string;
  coverImage?: string;
  mrp: number;
  discountedPrice: number;
  order?: number;
}

interface HomeSection {
  _id: string;
  title: string;
  description?: string;
  isActive: boolean;
  order: number;
  books: Book[];
}

export default function AdminHomepageSectionsPage() {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<HomeSection | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedBooks, setSelectedBooks] = useState<Book[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [order, setOrder] = useState(0);

  // Book search fields
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [searching, setSearching] = useState(false);

  const fetchSections = async () => {
    try {
      const res = await fetch('/api/admin/homepage-sections');
      const data = await res.json();
      if (data.success) {
        setSections(data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch homepage sections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const searchBooks = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/books?search=${encodeURIComponent(query)}&limit=10`);
      const data = await res.json();
      if (data.success) {
        // Filter out books already selected
        setSearchResults(data.data.filter((b: Book) => !selectedBooks.find(sb => sb._id === b._id)));
      }
    } catch (error) {
      console.error('Book search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => searchBooks(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedBooks]);

  const openCreateDialog = () => {
    setEditingSection(null);
    setTitle('');
    setDescription('');
    setSelectedBooks([]);
    setIsActive(true);
    setOrder(sections.length * 10);
    setSearchQuery('');
    setDialogOpen(true);
  };

  const openEditDialog = (section: HomeSection) => {
    setEditingSection(section);
    setTitle(section.title);
    setDescription(section.description || '');
    setSelectedBooks(section.books.map((b, i) => ({ ...b, order: b.order ?? i })));
    setIsActive(section.isActive);
    setOrder(section.order);
    setSearchQuery('');
    setDialogOpen(true);
  };

  const addBook = (book: Book) => {
    setSelectedBooks(prev => [...prev, { ...book, order: prev.length }]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeBook = (bookId: string) => {
    setSelectedBooks(prev => prev.filter(b => b._id !== bookId));
  };

  const moveBook = (index: number, direction: 'up' | 'down') => {
    const newBooks = [...selectedBooks];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newBooks.length) return;
    [newBooks[index], newBooks[newIndex]] = [newBooks[newIndex], newBooks[index]];
    setSelectedBooks(newBooks.map((b, i) => ({ ...b, order: i })));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Section Title is required');
      return;
    }

    const payload = {
      id: editingSection?._id,
      title,
      description,
      isActive,
      order: Number(order),
      books: selectedBooks.map((b, i) => ({ bookId: b._id, order: i })),
    };

    try {
      const res = await fetch('/api/admin/homepage-sections', {
        method: editingSection ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editingSection ? 'Section updated' : 'Section created');
        setDialogOpen(false);
        fetchSections();
      } else {
        toast.error(data.error || 'Failed to save');
      }
    } catch (error) {
      toast.error('Failed to save');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this custom homepage section?')) return;
    try {
      const res = await fetch(`/api/admin/homepage-sections?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Section deleted');
        fetchSections();
      }
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Homepage Book Sections</h1>
          <p className="text-gray-600 text-sm mt-1">Create dynamic custom book shelves and select exactly which books appear in them</p>
        </div>
        <Button onClick={openCreateDialog} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" /> Add Section
        </Button>
      </div>

      <div className="grid gap-4 mt-6">
        {sections.map(section => (
          <div key={section._id} className="bg-white rounded-lg border p-5 shadow-sm hover:shadow-md transition">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{section.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded ${section.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {section.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                    {section.books.length} books
                  </span>
                </div>
                {section.description && <p className="text-gray-600 text-sm mt-1">{section.description}</p>}
                <p className="text-gray-400 text-xs mt-3">Display Order: {section.order}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEditDialog(section)}>
                  <Edit className="w-4 h-4 text-gray-700" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(section._id)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
            
            {section.books.length > 0 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                {section.books.slice(0, 8).map(book => (
                  <div key={book._id} className="flex-shrink-0 w-16">
                    <img
                      src={book.coverImage || '/book/book1.jpg'}
                      alt={book.title}
                      className="w-16 h-20 object-cover rounded border"
                    />
                  </div>
                ))}
                {section.books.length > 8 && (
                  <div className="flex-shrink-0 w-16 h-20 bg-gray-100 rounded border flex items-center justify-center text-gray-500 text-sm font-semibold">
                    +{section.books.length - 8}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {sections.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white border rounded-lg">
            No dynamic homepage sections created yet. Click "Add Section" to create your first custom shelf!
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSection ? 'Edit Homepage Section' : 'Create Homepage Section'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {/* Title */}
            <div>
              <label className="text-sm font-medium block mb-2">Section Title *</label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g., Advancing Books"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium block mb-2">Section Description</label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Optional subheading details"
                rows={3}
              />
            </div>

            {/* Search Book */}
            <div>
              <label className="text-sm font-medium block mb-2 font-semibold text-purple-700">Search Book</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search books to add to this section..."
                  className="pl-9 border-purple-300 focus:border-purple-500"
                />
              </div>
              
              {searchResults.length > 0 && (
                <div className="border rounded mt-2 max-h-40 overflow-y-auto bg-white shadow-sm">
                  {searchResults.map(book => (
                    <div
                      key={book._id}
                      className="flex items-center gap-3 p-2 hover:bg-purple-50 cursor-pointer transition"
                      onClick={() => addBook(book)}
                    >
                      <img src={book.coverImage || '/book/book1.jpg'} alt="" className="w-8 h-10 object-cover rounded border" />
                      <div className="text-sm">
                        <p className="font-medium text-gray-800">{book.title}</p>
                        <p className="text-xs text-gray-500">mrp: ₹{book.mrp} • disc: ₹{book.discountedPrice}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Books */}
            <div>
              <label className="text-sm font-medium block mb-2 font-semibold text-gray-800">
                Selected Books ({selectedBooks.length})
              </label>
              <div className="border rounded-lg mt-2 max-h-60 overflow-y-auto bg-gray-50">
                {selectedBooks.map((book, index) => (
                  <div key={book._id} className="flex items-center gap-3 p-2 border-b bg-white last:border-b-0 hover:bg-gray-50 transition">
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => moveBook(index, 'up')}
                        disabled={index === 0}
                        className="text-gray-400 hover:text-purple-600 disabled:opacity-30 text-xs px-1"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBook(index, 'down')}
                        disabled={index === selectedBooks.length - 1}
                        className="text-gray-400 hover:text-purple-600 disabled:opacity-30 text-xs px-1"
                      >
                        ▼
                      </button>
                    </div>
                    <span className="text-gray-400 font-mono text-sm w-6 text-center">{index + 1}</span>
                    <img src={book.coverImage || '/book/book1.jpg'} alt="" className="w-8 h-10 object-cover rounded border" />
                    <span className="text-sm font-medium text-gray-700 flex-1 truncate">{book.title}</span>
                    <button type="button" onClick={() => removeBook(book._id)} className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {selectedBooks.length === 0 && (
                  <div className="text-center py-6 text-gray-400 text-sm">No books selected. Search and add books above!</div>
                )}
              </div>
            </div>

            {/* Display Order */}
            <div>
              <label className="text-sm font-medium block mb-2">Display Order</label>
              <Input
                type="number"
                value={order}
                onChange={e => setOrder(Number(e.target.value))}
                placeholder="e.g. 10, 20"
              />
            </div>

            {/* Active Toggle */}
            <div className="flex items-center gap-2 pt-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <label className="text-sm font-medium">Active (Visible on Homepage)</label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700">
                {editingSection ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
