'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import BookCard from '@/components/books/BookCard';

const LABELS: Record<string, string> = {
  'biography-memoir': 'Biography & Memoir',
  'business': 'Business',
  'historic-fiction': 'Historic Fiction',
  'mega-comic': 'Mega Comic',
  'mystery-thriller': 'Mystery Thriller',
  'occult-paranormal': 'Occult & Paranormal',
  'romance': 'Romance',
  'self': 'Self',
};

export default function GenrePage({ params }: { params: Promise<{ genre: string }> }) {
  const { genre } = React.use(params);
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/books?genre=${encodeURIComponent(genre)}&limit=40`, { cache: 'no-store' });
        const json = await res.json();
        if (!alive) return;
        if (json?.success && Array.isArray(json.data)) {
          const mapped = json.data.map((b: any) => ({
            id: b._id || b.id,
            title: b.title,
            isbn: b.isbn,
            author: b.authorName || b.author,
            publisher: b.publisher || '',
            binding: (b.binding || 'paperback').toString(),
            weight: '',
            language: b.language || 'english',
            description: b.description || '',
            mrp: b.mrp,
            discountedPrice: b.discountedPrice,
            rating: b.rating || 0,
            reviewCount: b.reviewCount || 0,
            category: b.categorySlug,
            subcategory: b.subcategorySlug,
            ageGroup: b.ageGroup || '',
            coverImage: b.coverImage || '/logo.png',
            inStock: b.inStock,
            featured: !!b.featured,
          }));
          setBooks(mapped);
        } else if (Array.isArray(json)) {
          setBooks(json as any[]);
        } else {
          setBooks([]);
        }
      } catch {
        if (alive) setBooks([]);
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => { alive = false; };
  }, [genre]);

  const displayName = LABELS[genre] || 'Genre';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{displayName}</h1>
          <p className="text-xl text-gray-600">Top picks in this genre</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {books.map((book, index) => (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <BookCard book={book} />
            </motion.div>
          ))}
        </div>

        {!loading && books.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">No books found for this genre.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
