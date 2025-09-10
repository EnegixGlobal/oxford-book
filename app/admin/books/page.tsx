'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BookFormDialog } from '@/components/ui/book-form-dialog';
import { AdminPagination } from '@/components/ui/admin-pagination';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

  const ageOptions = [
    { value: 'all', label: 'All Ages' },
    { value: '0-2', label: '0-2' },
    { value: '3-5', label: '3-5' },
    { value: '6-8', label: '6-8' },
    { value: '9-12', label: '9-12' },
    { value: 'teen', label: 'Teen' },
    { value: 'young-adult', label: 'Young Adult' },
    { value: 'old-man', label: 'Old Man' },
  ];
  const genreOptions = [
    { value: 'all', label: 'All Genres' },
    { value: 'biography-memoir', label: 'Biography & Memoir' },
    { value: 'business', label: 'Business' },
    { value: 'historic-fiction', label: 'Historic Fiction' },
    { value: 'mega-comic', label: 'Mega Comic' },
    { value: 'mystery-thriller', label: 'Mystery Thriller' },
    { value: 'occult-paranormal', label: 'Occult & Paranormal' },
    { value: 'romance', label: 'Romance' },
    { value: 'self', label: 'Self' },
  ];

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

  useEffect(() => {
    loadBooks();
  }, [currentPage, searchTerm, ageGroupFilter, genreFilter]);

  // Reset to first page when search changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-gray-900">Books Management</h1>
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

      <BookFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        mode={dialogMode}
        initialData={selectedBook}
        onSubmit={async (data) => {
          try {
            const payload = {
              title: data.title,
              author: data.author,
              description: data.description,
              stock: Number(data.stock) || 0,
              coverImage: data.coverImage,
              category: data.category,
              subcategory: data.subcategory,
              mrp: Number(data.mrp ?? data.originalPrice ?? 0),
              discountedPrice: Number(data.discountedPrice ?? data.finalPrice ?? 0),
              discount: Number(data.discount ?? 0),
              isbn: data.isbn,
              publisher: data.publisher,
              binding: data.binding,
              language: data.language,
              ageGroup: data.ageGroup || undefined,
              genre: data.genre || undefined,
              featured: !!data.featured,
              anticipated: !!data.anticipated,
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
              {ageOptions.map((o) => (
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
              {genreOptions.map((o) => (
                <SelectItem key={o.value || 'all'} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Books Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age Group</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Genre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {books.map((book) => (
              <tr key={book._id || book.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <img src={book.coverImage || '/logo.png'} alt={book.title} className="h-10 w-8 object-cover rounded" />
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{book.title}</div>
                      <div className="text-sm text-gray-500">ISBN: {book.isbn}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{book.authorName || book.author}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {book.ageGroup ? (
                    <Badge variant="outline">{book.ageGroup}</Badge>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {book.genre ? (
                    <Badge variant="secondary">{String(book.genre).replace('-', ' ')}</Badge>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{book.discountedPrice?.toFixed ? book.discountedPrice.toFixed(2) : book.discountedPrice}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Badge className={(book.inStock ? 'bg-green-500' : 'bg-red-500') + ' text-white'}>
                      {book.inStock ? 'In Stock' : 'Out of Stock'}
                    </Badge>
                    {book.anticipated && (
                      <Badge variant="secondary">Anticipated</Badge>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setDialogMode('edit');
                        setSelectedBook({
                          ...book,
                          author: book.authorName || book.author,
                          originalPrice: book.mrp,
                          finalPrice: book.discountedPrice,
                          category: book.categorySlug,
                          subcategory: book.subcategorySlug,
                          ageGroup: book.ageGroup,
                          genre: book.genre,
                          anticipated: !!book.anticipated,
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

        {/* Pagination */}
        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
        />
      </div>
    </div>
  );
}
