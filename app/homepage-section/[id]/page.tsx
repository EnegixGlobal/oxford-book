'use client';

import { useEffect, useState, useMemo, use } from 'react';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import BookCard from '@/components/books/BookCard';

type SortKey = 'newest' | 'price-asc' | 'price-desc' | 'rating-desc';

interface Book {
  _id: string;
  title: string;
  slug: string;
  authorName?: string;
  coverImage?: string;
  mrp: number;
  discountedPrice: number;
  discount: number;
  inStock: boolean;
  stock: number;
  rating?: number;
}

interface Section {
  _id: string;
  title: string;
  description?: string;
  books: Book[];
}

export default function HomepageSectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [section, setSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>('newest');

  useEffect(() => {
    const fetchSection = async () => {
      try {
        const res = await fetch(`/api/homepage-sections?id=${id}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.success && data.data) {
          setSection(data.data);
        }
      } catch (error) {
        console.error('Failed to load dynamic section books:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSection();
  }, [id]);

  const sortedBooks = useMemo(() => {
    if (!section?.books) return [];
    const arr = [...section.books];
    switch (sort) {
      case 'price-asc':
        return arr.sort((a, b) => a.discountedPrice - b.discountedPrice);
      case 'price-desc':
        return arr.sort((a, b) => b.discountedPrice - a.discountedPrice);
      case 'rating-desc':
        return arr.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'newest':
      default:
        return arr;
    }
  }, [section, sort]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-16 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!section) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-16 text-center text-gray-500">
        Section not found.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50"
    >
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-indigo-200/60 via-blue-200/50 to-purple-200/60" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 relative">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur px-3 py-1 text-indigo-700 font-semibold shadow-sm mb-4">
              <BookOpen className="w-4 h-4" />
              <span>Special Collection</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-700">
              {section.title}
            </h1>
            {section.description && (
              <p className="mt-3 text-lg md:text-xl text-gray-700 max-w-2xl">
                {section.description}
              </p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/80 backdrop-blur rounded-xl p-4 shadow-sm border border-gray-100 -mt-8 mb-8"
        >
          <div className="text-gray-700">
            <span className="font-semibold text-gray-900">{section.books.length}</span> books in this collection
          </div>
          <div className="flex items-center gap-3">
            <label htmlFor="sort" className="text-sm text-gray-600">
              Sort by
            </label>
            <select
              id="sort"
              className="rounded-md border-gray-300 text-sm focus:ring-indigo-600 focus:border-indigo-600"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating-desc">Rating</option>
            </select>
          </div>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedBooks.map((book) => (
            <div key={book._id}>
              <BookCard book={book as any} showBuyNow />
            </div>
          ))}
        </div>

        {sortedBooks.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No books found in this dynamic collection.
          </div>
        )}
      </div>
    </motion.div>
  );
}
