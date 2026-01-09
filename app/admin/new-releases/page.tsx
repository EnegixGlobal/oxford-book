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

interface NewReleaseList {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  isActive: boolean;
  books: Book[];
}

export default function AdminNewReleasesPage() {
  const [lists, setLists] = useState<NewReleaseList[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingList, setEditingList] = useState<NewReleaseList | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [selectedBooks, setSelectedBooks] = useState<Book[]>([]);
  
  // Book search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [searching, setSearching] = useState(false);

  const fetchLists = async () => {
    try {
      const res = await fetch('/api/admin/new-releases');
      const data = await res.json();
      if (data.success) {
        setLists(data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch new release lists');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
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
        setSearchResults(data.data.filter((b: Book) => !selectedBooks.find(sb => sb._id === b._id)));
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => searchBooks(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedBooks]);

  const openCreateDialog = () => {
    setEditingList(null);
    setTitle('');
    setDescription('');
    setIsActive(true);
    setSelectedBooks([]);
    setSearchQuery('');
    setDialogOpen(true);
  };

  const openEditDialog = (list: NewReleaseList) => {
    setEditingList(list);
    setTitle(list.title);
    setDescription(list.description || '');
    setIsActive(list.isActive);
    setSelectedBooks(list.books.map((b, i) => ({ ...b, order: b.order ?? i })));
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
      toast.error('Title is required');
      return;
    }

    const payload = {
      id: editingList?._id,
      title,
      description,
      isActive,
      books: selectedBooks.map((b, i) => ({ bookId: b._id, order: i })),
    };

    try {
      const res = await fetch('/api/admin/new-releases', {
        method: editingList ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editingList ? 'List updated' : 'List created');
        setDialogOpen(false);
        fetchLists();
      } else {
        toast.error(data.error || 'Failed to save');
      }
    } catch (error) {
      toast.error('Failed to save');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this new release list?')) return;
    try {
      const res = await fetch(`/api/admin/new-releases?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('List deleted');
        fetchLists();
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
        <h1 className="text-2xl font-bold">New Release Lists</h1>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" /> Create List
        </Button>
      </div>

      <div className="grid gap-4">
        {lists.map(list => (
          <div key={list._id} className="bg-white rounded-lg border p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{list.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded ${list.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {list.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {list.description && <p className="text-gray-600 text-sm mt-1">{list.description}</p>}
                <p className="text-gray-500 text-sm mt-2">{list.books.length} books • slug: {list.slug}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEditDialog(list)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(list._id)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
            
            {list.books.length > 0 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                {list.books.slice(0, 8).map(book => (
                  <div key={book._id} className="flex-shrink-0 w-16">
                    <img
                      src={book.coverImage || '/book/book1.jpg'}
                      alt={book.title}
                      className="w-16 h-20 object-cover rounded"
                    />
                  </div>
                ))}
                {list.books.length > 8 && (
                  <div className="flex-shrink-0 w-16 h-20 bg-gray-100 rounded flex items-center justify-center text-gray-500 text-sm">
                    +{list.books.length - 8}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {lists.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No new release lists yet. Create one to get started.
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingList ? 'Edit New Release List' : 'Create New Release List'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Latest Releases" />
            </div>
            
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description" />
            </div>
            
            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <label className="text-sm">Active</label>
            </div>
            
            <div>
              <label className="text-sm font-medium">Add Books</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search books to add..."
                  className="pl-9"
                />
              </div>
              
              {searchResults.length > 0 && (
                <div className="border rounded mt-2 max-h-40 overflow-y-auto">
                  {searchResults.map(book => (
                    <div
                      key={book._id}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer"
                      onClick={() => addBook(book)}
                    >
                      <img src={book.coverImage || '/book/book1.jpg'} alt="" className="w-8 h-10 object-cover rounded" />
                      <span className="text-sm">{book.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <label className="text-sm font-medium">Selected Books ({selectedBooks.length})</label>
              <div className="border rounded mt-2 max-h-60 overflow-y-auto">
                {selectedBooks.map((book, index) => (
                  <div key={book._id} className="flex items-center gap-2 p-2 border-b last:border-b-0">
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => moveBook(index, 'up')}
                        disabled={index === 0}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBook(index, 'down')}
                        disabled={index === selectedBooks.length - 1}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        ▼
                      </button>
                    </div>
                    <span className="text-gray-400 text-sm w-6">{index + 1}</span>
                    <img src={book.coverImage || '/book/book1.jpg'} alt="" className="w-8 h-10 object-cover rounded" />
                    <span className="text-sm flex-1">{book.title}</span>
                    <button type="button" onClick={() => removeBook(book._id)} className="text-red-500 hover:text-red-700">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {selectedBooks.length === 0 && (
                  <div className="text-center py-4 text-gray-400 text-sm">No books selected</div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editingList ? 'Update' : 'Create'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
