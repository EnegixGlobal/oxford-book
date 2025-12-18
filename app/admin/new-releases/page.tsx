'use client';

import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type Book = {
  _id: string;
  title: string;
  authorName?: string;
  coverImage?: string;
  mrp: number;
  discountedPrice: number;
  newRelease?: boolean;
  newReleaseOrder?: number;
};

const updateNewReleaseOrder = async (id: string, newReleaseOrder: number) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('bookhaven-token') : null;
  const url = `/api/admin/books?id=${id}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ newReleaseOrder }),
  });
  return res.json();
};

export default function AdminNewReleasesPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch(`/api/books?newRelease=true&limit=100`, { cache: 'no-store' });
        const json = await res.json();
        if (mounted && json?.success && Array.isArray(json.data)) {
          setBooks(json.data);
        }
      } finally { if (mounted) setLoading(false); }
    };
    load();
    return () => { mounted = false; };
  }, []);

  // Sort books: new releases by order, then by title
  const sortedBooks = useMemo(() => {
    const filtered = books.filter(b => b.title.toLowerCase().includes(search.toLowerCase()));
    return filtered.sort((a, b) => {
      if (a.newRelease && b.newRelease) {
        const orderA = a.newReleaseOrder ?? 9999;
        const orderB = b.newReleaseOrder ?? 9999;
        if (orderA !== orderB) return orderA - orderB;
      }
      return (a.title || '').localeCompare(b.title || '');
    });
  }, [books, search]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">New Releases</h1>
          <p className="text-sm text-gray-500 mt-1">Books recently added / flagged as new release.</p>
        </div>
        <div className="w-full sm:w-64">
          <Input placeholder="Search new releases" value={search} onChange={(e) => setSearch(e.target.value)} className="bg-white" />
        </div>
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm">Loading...</div>
      ) : !sortedBooks.length ? (
        <div className="text-gray-600 text-sm">No new release books found.</div>
      ) : (
        <div className="grid gap-5 sm:gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7">
          {sortedBooks.map(book => (
            <div key={book._id} className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow p-3 flex flex-col group relative">
              {/* Order input - only visible for new releases */}
              {book.newRelease && (
                <div className="absolute top-2 right-2 z-10">
                  <Input
                    type="number"
                    min="0"
                    value={book.newReleaseOrder ?? 0}
                    onChange={async (e) => {
                      const newOrder = parseInt(e.target.value) || 0;
                      const prev = book.newReleaseOrder;
                      setBooks((arr) => arr.map(x => x._id === book._id ? { ...x, newReleaseOrder: newOrder } : x));
                      const res = await updateNewReleaseOrder(book._id, newOrder);
                      if (!res?.success) {
                        setBooks((arr) => arr.map(x => x._id === book._id ? { ...x, newReleaseOrder: prev } : x));
                        toast.error(res?.message || 'Failed to update order');
                      } else {
                        toast.success('Order updated');
                      }
                    }}
                    className="w-12 h-6 text-xs text-center p-0 bg-white/90 border-blue-300"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md bg-gray-100">
                <img src={book.coverImage || '/logo.png'} alt={book.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                {book.newRelease && <span className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-semibold px-2 py-1 rounded">NEW</span>}
              </div>
              <h3 className="mt-3 text-[13px] font-medium text-gray-800 line-clamp-2 min-h-[2.1rem]">{book.title}</h3>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-sm font-semibold text-purple-700">₹{book.discountedPrice}</span>
                {book.discountedPrice < book.mrp && (
                  <span className="text-[11px] text-gray-400 line-through">₹{book.mrp}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
