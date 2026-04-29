'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, BookOpen } from 'lucide-react';
import BookCard from '@/components/books/BookCard';

type SortKey = 'default' | 'price-asc' | 'price-desc';

interface BookDto {
  _id: string;
  title: string;
  slug: string;
  authorName?: string;
  coverImage?: string;
  discountedPrice: number;
  mrp: number;
  discount: number;
  inStock?: boolean;
  rating?: number;
}

interface BookListData {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  books: BookDto[];
}

export default function BookListPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [listData, setListData] = useState<BookListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>('default');

  useEffect(() => {
    if (!slug) return;
    const fetchList = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/booklists?slug=${slug}`, { cache: 'no-store' });
        const data = await res.json();
        if (data?.success && data.data) {
          setListData(data.data);
        } else {
          setListData(null);
        }
      } catch {
        setListData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchList();
  }, [slug]);

  const sortedBooks = useMemo(() => {
    if (!listData?.books) return [];
    const arr = [...listData.books];
    switch (sort) {
      case 'price-asc':
        return arr.sort((a, b) => (a.discountedPrice ?? a.mrp) - (b.discountedPrice ?? b.mrp));
      case 'price-desc':
        return arr.sort((a, b) => (b.discountedPrice ?? b.mrp) - (a.discountedPrice ?? a.mrp));
      default:
        return arr;
    }
  }, [listData, sort]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50"
    >
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-fuchsia-100/60 via-pink-100/50 to-purple-100/60" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 relative">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur px-3 py-1 text-purple-700 font-semibold shadow-sm mb-4">
              <BookOpen className="w-4 h-4" />
              <span>Book Collection</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
              {loading ? (
                <span className="inline-block w-64 h-10 rounded-lg bg-gray-200 animate-pulse" />
              ) : (
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600">
                  {listData?.title || 'Book List'}
                </span>
              )}
            </h1>
            {!loading && listData?.description && (
              <p className="mt-3 text-lg md:text-xl text-gray-700 max-w-2xl">
                {listData.description}
              </p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Toolbar */}
        {!loading && listData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/80 backdrop-blur rounded-xl p-4 shadow-sm border border-gray-100 -mt-6 mb-8"
          >
            <div className="text-gray-700">
              <span className="font-semibold text-gray-900">{sortedBooks.length}</span> books in this list
            </div>
            <div className="flex items-center gap-3">
              <label htmlFor="sort" className="text-sm text-gray-600">Sort by</label>
              <select
                id="sort"
                className="rounded-md border border-gray-300 text-sm px-2 py-1 focus:ring-fuchsia-600 focus:border-fuchsia-600 outline-none"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
              >
                <option value="default">Default Order</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </motion.div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={`sk-${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
              >
                <div className="aspect-square w-full rounded-lg bg-gray-200 animate-pulse" />
                <div className="mt-3 h-4 w-3/4 rounded bg-gray-200 animate-pulse" />
                <div className="mt-2 h-3 w-1/2 rounded bg-gray-200 animate-pulse" />
                <div className="mt-4 h-8 w-full rounded bg-gray-200 animate-pulse" />
              </motion.div>
            ))}
          </div>
        )}

        {/* Books Grid */}
        {!loading && sortedBooks.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedBooks.map((book, index) => (
              <motion.div
                key={book._id || book.slug || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.4) }}
              >
                <BookCard book={book as any} showBuyNow />
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && sortedBooks.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center py-24"
          >
            <BookOpen className="w-16 h-16 mx-auto text-purple-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No books found</h3>
            <p className="text-gray-500">This list doesn't have any books yet. Check back soon!</p>
          </motion.div>
        )}

        {/* Not Found */}
        {!loading && !listData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center py-24"
          >
            <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">List not found</h3>
            <p className="text-gray-500">The book list you're looking for doesn't exist.</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
