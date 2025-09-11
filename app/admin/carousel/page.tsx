'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { AdminPagination } from '@/components/ui/admin-pagination';
import { toast } from 'sonner';

type Book = {
  _id: string;
  title: string;
  slug?: string;
  authorName?: string;
  coverImage?: string;
  mrp: number;
  discountedPrice: number;
  featured?: boolean;
};

const fetchBooks = async (page = 1, limit = 12, search = '') => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('bookhaven-token') : null;
  const url = new URL('/api/admin/books', window.location.origin);
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));
  if (search) url.searchParams.set('search', search);
  const res = await fetch(url.toString(), { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  return res.json();
};

const updateFeatured = async (id: string, featured: boolean) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('bookhaven-token') : null;
  const url = `/api/admin/books?id=${id}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ featured }),
  });
  return res.json();
};

export default function CarouselAdminPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const limit = 12;

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetchBooks(page, limit, search);
      if (res?.success) {
        setBooks(res.data || []);
        setTotalPages(res.pagination?.totalPages || 1);
        setTotalItems(res.pagination?.totalItems || 0);
      } else {
        toast.error(res?.message || 'Failed to load books');
      }
    } catch {
      toast.error('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const featuredCount = useMemo(() => books.filter(b => b.featured).length, [books]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-2">
            <Star className="w-8 h-8 text-yellow-500" /> Carousel / Featured Books
          </h1>
          <p className="text-gray-500">Toggle books to appear in the homepage Featured carousel.</p>
        </div>
        <div className="text-sm text-gray-600">Selected: <span className="font-semibold">{featuredCount}</span></div>
      </div>

      <div className="flex w-full gap-3 items-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search by title, author, ISBN"
            className="pl-10"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Featured</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {books.map((b) => (
              <tr key={b._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={b.coverImage || '/logo.png'} alt={b.title} className="h-12 w-9 object-cover rounded" />
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 line-clamp-2 max-w-[360px]">{b.title}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{b.authorName || '—'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <span className="text-fuchsia-600 font-semibold">₹{b.discountedPrice}</span>
                    <span className="text-gray-400 line-through">₹{b.mrp}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={!!b.featured}
                      onCheckedChange={async (val) => {
                        const prev = b.featured;
                        setBooks((arr) => arr.map(x => x._id === b._id ? { ...x, featured: !!val } : x));
                        const res = await updateFeatured(b._id, !!val);
                        if (!res?.success) {
                          setBooks((arr) => arr.map(x => x._id === b._id ? { ...x, featured: prev } : x));
                          toast.error(res?.message || 'Update failed');
                        } else {
                          toast.success(!!val ? 'Marked as featured' : 'Removed from featured');
                        }
                      }}
                    />
                    {b.featured ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded">
                        <Star className="w-3 h-3" /> Featured
                      </span>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AdminPagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={limit}
        onPageChange={setPage}
      />
    </div>
  );
}
