'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BookCard from '@/components/books/BookCard';
import { useEffect, useRef, useState } from 'react';

const MostAnticipatedBooks = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/books?anticipated=true&limit=16', { cache: 'no-store' });
        const json = await res.json();
        if (!alive) return;
        if (json?.success && Array.isArray(json.data)) {
          const mapped = json.data.map((b: any) => ({
            id: b._id || b.id,
            slug: b.slug,
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
            anticipated: !!b.anticipated,
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
  }, []);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Most <span className="text-fuchsia-600">Anticipated</span> Books
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover the books everyone&apos;s talking about
          </p>
        </motion.div>

        {/* View All on right */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center justify-end mb-8"
        >
          <Link href="/anticipated">
            <Button variant="outline" className="flex items-center gap-2">
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>

        {/* Books Horizontal Scroll */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative"
        >
          <div
            ref={scrollRef}
            className="flex space-x-6 overflow-x-auto pb-4 scroll-smooth"
          >
            {books.map((book, index) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex-shrink-0 w-60"
              >
                <BookCard book={book} showBuyNow />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MostAnticipatedBooks;
