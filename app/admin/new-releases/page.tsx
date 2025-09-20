'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface BookDto { _id: string; title: string; coverImage?: string; discountedPrice: number; mrp: number; newRelease?: boolean; }

export default function AdminNewReleasesPage() {
  const [books, setBooks] = useState<BookDto[]>([]);
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

  const filtered = books.filter(b => b.title.toLowerCase().includes(search.toLowerCase()));

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
      ) : !filtered.length ? (
        <div className="text-gray-600 text-sm">No new release books found.</div>
      ) : (
        <div className="grid gap-5 sm:gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7">
          {filtered.map(book => (
            <div key={book._id} className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow p-3 flex flex-col group">
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
