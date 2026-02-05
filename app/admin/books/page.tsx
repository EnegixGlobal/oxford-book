'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BookFormDialog } from '@/components/ui/book-form-dialog';
import { AdminPagination } from '@/components/ui/admin-pagination';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type MetaEntity = {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
};

// API helpers
const fetchBooks = async (page = 1, limit = 10, search = '', ageGroup = 'all', genre = 'all') => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('bookhaven-token') : null;
  const url = new URL('/api/admin/books', window.location.origin);
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));
  if (search) url.searchParams.set('search', search);
  if (ageGroup && ageGroup !== 'all') url.searchParams.set('ageGroup', ageGroup);
  if (genre && genre !== 'all') url.searchParams.set('genre', genre);
  const res = await fetch(url.toString(), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.json();
};

const createBook = async (data: any) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('bookhaven-token') : null;
  const res = await fetch('/api/admin/books', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  return res.json();
};

const updateBook = async (id: string, data: any) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('bookhaven-token') : null;
  const url = `/api/admin/books?id=${id}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  return res.json();
};

const deleteBook = async (id: string) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('bookhaven-token') : null;
  const url = `/api/admin/books?id=${id}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.json();
};

export default function BooksPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [books, setBooks] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [ageGroupFilter, setAgeGroupFilter] = useState('all');
  const [genreFilter, setGenreFilter] = useState('all');
  const [ageFilterOptions, setAgeFilterOptions] = useState<{ value: string; label: string }[]>([
    { value: 'all', label: 'All Ages' },
  ]);
  const [genreFilterOptions, setGenreFilterOptions] = useState<{ value: string; label: string }[]>([
    { value: 'all', label: 'All Genres' },
  ]);
  const [formAgeOptions, setFormAgeOptions] = useState<{ value: string; label: string }[]>([]);
  const [formGenreOptions, setFormGenreOptions] = useState<{ value: string; label: string }[]>([]);
  const [ageGroups, setAgeGroups] = useState<MetaEntity[]>([]);
  const [genres, setGenres] = useState<MetaEntity[]>([]);
  const [metaLoading, setMetaLoading] = useState(false);
  const [ageFormSaving, setAgeFormSaving] = useState(false);
  const [genreFormSaving, setGenreFormSaving] = useState(false);
  const createEmptyAgeForm = () => ({ name: '', description: '', sortOrder: '0', isActive: true });
  const createEmptyGenreForm = () => ({ name: '', description: '', sortOrder: '0', isActive: true });
  const [ageForm, setAgeForm] = useState(() => createEmptyAgeForm());
  const [genreForm, setGenreForm] = useState(() => createEmptyGenreForm());
  const [editingAgeId, setEditingAgeId] = useState<string | null>(null);
  const [editingGenreId, setEditingGenreId] = useState<string | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const bulkInputRef = useRef<HTMLInputElement>(null);
  const [bulkResult, setBulkResult] = useState<{
    createdCount: number;
    failedCount: number;
    failed: { row: number; reason: string }[];
  } | null>(null);
  const [bulkResultOpen, setBulkResultOpen] = useState(false);

  const getAuthHeaders = (): HeadersInit => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('bookhaven-token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const resolveEntityId = (entity: MetaEntity) => {
    const value = entity._id || entity.id;
    return value ? String(value) : '';
  };

  const loadBooks = async () => {
    try {
      setLoading(true);
      const result = await fetchBooks(currentPage, itemsPerPage, searchTerm, ageGroupFilter, genreFilter);
      if (result?.success) {
        setBooks(result.data || []);
        setTotalItems(result.pagination?.totalItems || 0);
        setTotalPages(result.pagination?.totalPages || 1);
      } else {
        toast.error(result?.message || 'Failed to load books');
      }
    } catch (e) {
      toast.error('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  const loadMetadata = useCallback(async () => {
    try {
      setMetaLoading(true);
      const headers = getAuthHeaders();
      const [ageRes, genreRes] = await Promise.all([
        fetch('/api/admin/age-groups?includeInactive=true', { headers }),
        fetch('/api/admin/genres?includeInactive=true', { headers }),
      ]);
      const ageJson = await ageRes.json();
      const genreJson = await genreRes.json();
      if (!ageJson?.success) throw new Error(ageJson?.message || 'Failed to load age groups');
      if (!genreJson?.success) throw new Error(genreJson?.message || 'Failed to load genres');
      const ageData: MetaEntity[] = Array.isArray(ageJson.data) ? ageJson.data : [];
      const genreData: MetaEntity[] = Array.isArray(genreJson.data) ? genreJson.data : [];
      const toOption = (item: MetaEntity) => ({ value: item.slug, label: item.name });
      const activeAgeOptions = ageData.filter((item) => item.isActive !== false).map(toOption);
      const activeGenreOptions = genreData.filter((item) => item.isActive !== false).map(toOption);
      setAgeGroups(ageData);
      setGenres(genreData);
      setAgeFilterOptions([{ value: 'all', label: 'All Ages' }, ...activeAgeOptions]);
      setGenreFilterOptions([{ value: 'all', label: 'All Genres' }, ...activeGenreOptions]);
      setFormAgeOptions(activeAgeOptions);
      setFormGenreOptions(activeGenreOptions);
    } catch (error: any) {
      console.error('Metadata load error:', error);
      toast.error(error?.message || 'Failed to load age/genre lists');
    } finally {
      setMetaLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBooks();
  }, [currentPage, searchTerm, ageGroupFilter, genreFilter]);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  const resetAgeForm = () => {
    setAgeForm(createEmptyAgeForm());
    setEditingAgeId(null);
  };

  const resetGenreForm = () => {
    setGenreForm(createEmptyGenreForm());
    setEditingGenreId(null);
  };

  const handleAgeFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!ageForm.name.trim()) {
      toast.error('Age group name is required');
      return;
    }
    try {
      setAgeFormSaving(true);
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      };
      const payload = {
        name: ageForm.name.trim(),
        description: ageForm.description.trim() ? ageForm.description.trim() : undefined,
        sortOrder: Number(ageForm.sortOrder) || 0,
        isActive: ageForm.isActive,
      };
      const url = editingAgeId ? `/api/admin/age-groups?id=${editingAgeId}` : '/api/admin/age-groups';
      const method = editingAgeId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!json?.success) throw new Error(json?.message || 'Unable to save age group');
      toast.success(editingAgeId ? 'Age group updated' : 'Age group added');
      resetAgeForm();
      await loadMetadata();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save age group');
    } finally {
      setAgeFormSaving(false);
    }
  };

  const handleGenreFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!genreForm.name.trim()) {
      toast.error('Genre name is required');
      return;
    }
    try {
      setGenreFormSaving(true);
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      };
      const payload = {
        name: genreForm.name.trim(),
        description: genreForm.description.trim() ? genreForm.description.trim() : undefined,
        sortOrder: Number(genreForm.sortOrder) || 0,
        isActive: genreForm.isActive,
      };
      const url = editingGenreId ? `/api/admin/genres?id=${editingGenreId}` : '/api/admin/genres';
      const method = editingGenreId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!json?.success) throw new Error(json?.message || 'Unable to save genre');
      toast.success(editingGenreId ? 'Genre updated' : 'Genre added');
      resetGenreForm();
      await loadMetadata();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save genre');
    } finally {
      setGenreFormSaving(false);
    }
  };

  const handleAgeEdit = (item: MetaEntity) => {
    const id = resolveEntityId(item);
    setEditingAgeId(id || null);
    setAgeForm({
      name: item.name || '',
      description: item.description || '',
      sortOrder: String(item.sortOrder ?? 0),
      isActive: item.isActive !== false,
    });
  };

  const handleGenreEdit = (item: MetaEntity) => {
    const id = resolveEntityId(item);
    setEditingGenreId(id || null);
    setGenreForm({
      name: item.name || '',
      description: item.description || '',
      sortOrder: String(item.sortOrder ?? 0),
      isActive: item.isActive !== false,
    });
  };

  const handleDeleteAgeGroup = async (id: string) => {
    if (!confirm('Delete this age group? This cannot be undone.')) return;
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/admin/age-groups?id=${id}`, { method: 'DELETE', headers });
      const json = await res.json();
      if (!json?.success) throw new Error(json?.message || 'Unable to delete age group');
      toast.success('Age group deleted');
      if (editingAgeId === id) resetAgeForm();
      await loadMetadata();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete age group');
    }
  };

  const handleDeleteGenre = async (id: string) => {
    if (!confirm('Delete this genre? This cannot be undone.')) return;
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/admin/genres?id=${id}`, { method: 'DELETE', headers });
      const json = await res.json();
      if (!json?.success) throw new Error(json?.message || 'Unable to delete genre');
      toast.success('Genre deleted');
      if (editingGenreId === id) resetGenreForm();
      await loadMetadata();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete genre');
    }
  };

  // Reset to first page when search changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Helper to insert break opportunity every 13 characters
  const wrapTitle = (title: string) => {
    if (!title) return '';
    return title.match(/.{1,13}/g)?.join('\u200b') || title; // zero-width space allows wrap
  };

  const downloadCsvTemplate = () => {
    const headers = [
      'title',
      'author',
      'isbn',
      'mrp',
      'discountedPrice',
      'stock',
      'description',
      'coverImage',
      'category',
      'subcategory',
      'ageGroup',
      'genre',
      'discount',
      'publisher',
      'binding',
      'language',
      'featured',
      'anticipated',
      'newRelease',
      'awardWinner',
      'schoolLibrary',
    ];

    const example = [
      'Closer To Love',
      'Vex King',
      '9781035015313',
      '599.00',
      '570',
      '3',
      'Are you ready to experience true unconditional love? Do you wish you could create stronger relationships, heal yourself and experience genuine affection?',
      'https://example.com/path/to/cover.jpg',
      'Fiction',
      'Relationship',
      'Young Adult',
      'Mystery Thriller',
      '20.00',
      'Pan Macmillan',
      'Paperback',
      'English',
      'yes',
      'no',
      'yes',
      'no',
      'no',
    ];

    const escapeCell = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csv =
      headers.join(',') +
      '\n' +
      example.map((cell) => escapeCell(cell)).join(',');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'books-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleBulkFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.csv') && !lower.endsWith('.xlsx')) {
      toast.error('Please upload a CSV or XLSX file exported from Excel (.csv or .xlsx)');
      return;
    }

    try {
      setBulkUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      const headers = getAuthHeaders();
      const res = await fetch('/api/admin/books/bulk', {
        method: 'POST',
        headers,
        body: formData,
      });
      const json = await res.json();
      if (!json?.success) {
        toast.error(json?.message || 'Bulk upload failed');
        return;
      }
      const created = json.createdCount || 0;
      const failed = json.failedCount || 0;
      setBulkResult({
        createdCount: created,
        failedCount: failed,
        failed: Array.isArray(json.failed) ? json.failed : [],
      });
      setBulkResultOpen(true);
      toast.success(
        failed
          ? `Bulk upload complete. Created ${created}, ${failed} rows failed.`
          : `Bulk upload complete. Created ${created} books.`
      );
      await loadBooks();
    } catch (error) {
      console.error(error);
      toast.error('Bulk upload failed');
    } finally {
      setBulkUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-4xl font-bold text-gray-900">Books Management</h1>
        <div className="flex items-center gap-2">
          <input
            ref={bulkInputRef}
            type="file"
            accept=".csv,.xlsx"
            className="hidden"
            onChange={handleBulkFileChange}
          />
          <Button
            variant="outline"
            type="button"
            onClick={downloadCsvTemplate}
          >
            Download CSV template
          </Button>
          <Button
            variant="outline"
            disabled={bulkUploading}
            onClick={() => bulkInputRef.current?.click()}
          >
            <Plus className="w-4 h-4 mr-2" />
            {bulkUploading ? 'Uploading…' : 'Upload CSV'}
          </Button>
          <Button
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => {
              setDialogMode('add');
              setSelectedBook(null);
              setIsDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Book
          </Button>
        </div>
      </div>

      <BookFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        mode={dialogMode}
        initialData={selectedBook}
        ageOptions={formAgeOptions}
        genreOptions={formGenreOptions}
        onSubmit={async (data) => {
          try {
            let mrp = Number(data.mrp ?? data.originalPrice ?? 0);
            let discountedPrice = Number(data.discountedPrice ?? data.finalPrice ?? 0);
            const discount = Number(data.discount ?? 0);

            // Calculate discountedPrice from mrp and discount if discount is provided
            if (discount > 0 && mrp > 0) {
              discountedPrice = Math.round(mrp * (1 - discount / 100));
            }
            // If discount is provided but we have discountedPrice, calculate mrp
            else if (discount > 0 && discountedPrice > 0 && mrp === 0) {
              mrp = Math.round(discountedPrice / (1 - discount / 100));
            }

            const payload = {
              title: data.title,
              author: data.author || undefined,
              authorId: data.authorId,
              description: data.description,
              stock: Number(data.stock) || 0,
              coverImage: data.coverImage,
              category: data.category,
              subcategory: data.subcategory,
              mrp: mrp,
              discountedPrice: discountedPrice,
              discount: discount,
              discountType: data.discountType || 'percentage',
              discountAmount: data.discountAmount || 0,
              hsnCode: data.hsnCode || undefined,
              totalPages: data.totalPages || undefined,
              isbn: data.isbn,
              publisher: data.publisher,
              binding: data.binding,
              language: data.language,
              ageGroup: data.ageGroup || undefined,
              genre: data.genre || undefined,
              featured: !!data.featured,
              anticipated: !!data.anticipated,
              newRelease: !!data.newRelease,
              awardWinner: !!data.awardWinner,
              schoolLibrary: !!data.schoolLibrary,
            };
            const res = dialogMode === 'add'
              ? await createBook(payload)
              : await updateBook(selectedBook?._id || selectedBook?.id, payload);
            if (res?.success) {
              toast.success(dialogMode === 'add' ? 'Book added successfully!' : 'Book updated successfully!');
              setIsDialogOpen(false);
              setSelectedBook(null);
              loadBooks();
            } else {
              toast.error(res?.message || 'Operation failed');
            }
          } catch (e) {
            toast.error('Operation failed');
          }
        }}
      />

      {/* Search Bar */}
      <div className="flex w-full gap-3 items-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search books..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <div className="w-[200px]">
          <Select
            value={ageGroupFilter}
            onValueChange={(v) => {
              setAgeGroupFilter(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Age Group" />
            </SelectTrigger>
            <SelectContent>
              {ageFilterOptions.map((o) => (
                <SelectItem key={o.value || 'all'} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-[220px]">
          <Select
            value={genreFilter}
            onValueChange={(v) => {
              setGenreFilter(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Genre" />
            </SelectTrigger>
            <SelectContent>
              {genreFilterOptions.map((o) => (
                <SelectItem key={o.value || 'all'} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Books Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[750px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Age Group</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Genre</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {books.map((book) => (
                <tr key={book._id || book.id} className="hover:bg-gray-50 align-top">
                  <td className="px-4 md:px-6 py-4 text-sm text-gray-900 max-w-[350px] break-words whitespace-normal">
                    <div className="flex items-start gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={book.coverImage || '/logo.png'} alt={book.title} className="h-12 w-9 object-cover rounded shrink-0" />
                      <div className="space-y-1 min-w-0">
                        <div className="font-medium leading-snug break-words break-all">{/* title wraps */}
                          {wrapTitle(book.title)}
                        </div>
                        <div className="text-[11px] text-gray-500">ISBN: {book.isbn}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-normal text-sm text-gray-500 max-w-[140px] break-words">{book.authorName || book.author}</td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                    {book.ageGroup ? <Badge variant="outline">{book.ageGroup}</Badge> : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                    {book.genre ? <Badge variant="secondary">{String(book.genre).replace('-', ' ')}</Badge> : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{book.discountedPrice?.toFixed ? book.discountedPrice.toFixed(2) : book.discountedPrice}</td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={(book.inStock ? 'bg-green-500' : 'bg-red-500') + ' text-white'}>
                        {book.inStock ? 'In Stock' : 'Out of Stock'}
                      </Badge>
                      {book.anticipated && <Badge variant="secondary">Anticipated</Badge>}
                      {book.newRelease && <Badge className="bg-blue-600 text-white">New Release</Badge>}
                      {book.awardWinner && <Badge className="bg-yellow-600 text-white">Award Winner</Badge>}
                      {book.schoolLibrary && <Badge className="bg-indigo-600 text-white">School Library</Badge>}
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDialogMode('edit');
                          setSelectedBook({
                            ...book,
                            author: book.authorName || book.author,
                            authorId: book.authorId || book.author?._id || book.author?._id,
                            originalPrice: book.mrp,
                            finalPrice: book.discountedPrice,
                            category: book.categorySlug,
                            subcategory: book.subcategorySlug,
                            ageGroup: book.ageGroup,
                            genre: book.genre,
                            anticipated: !!book.anticipated,
                            newRelease: !!book.newRelease,
                            awardWinner: !!book.awardWinner,
                            schoolLibrary: !!book.schoolLibrary,
                          });
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={async () => {
                          if (confirm('Are you sure you want to delete this book?')) {
                            const res = await deleteBook(book._id || book.id);
                            if (res?.success) {
                              toast.success('Book deleted successfully!');
                              loadBooks();
                            } else {
                              toast.error(res?.message || 'Delete failed');
                            }
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
        />
      </div>
      <AlertDialog open={bulkResultOpen} onOpenChange={setBulkResultOpen}>
        <AlertDialogContent className="max-w-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Bulk upload summary</AlertDialogTitle>
            <AlertDialogDescription>
              {bulkResult
                ? `Created ${bulkResult.createdCount} books. ${bulkResult.failedCount} rows failed.`
                : 'No bulk upload result to display.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {bulkResult && bulkResult.failedCount > 0 && (
            <div className="mt-3 max-h-64 overflow-y-auto rounded border bg-gray-50 px-3 py-2 text-sm text-gray-700">
              {bulkResult.failed.map((f, idx) => (
                <div key={`${f.row}-${idx}`} className="py-1 border-b last:border-b-0 border-gray-200">
                  <span className="font-semibold">Row {f.row}:</span> {f.reason}
                </div>
              ))}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction onClick={() => setBulkResultOpen(false)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
