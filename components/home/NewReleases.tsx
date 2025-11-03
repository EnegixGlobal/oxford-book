"use client";
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import BookCard from '@/components/books/BookCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BookDto {
  _id: string;
  title: string;
  slug: string;
  coverImage?: string;
  discountedPrice: number;
  mrp: number;
  discount: number;
}

export default function NewReleases() {
  const [books, setBooks] = useState<BookDto[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null); 

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch('/api/books?newRelease=true&limit=12', { cache: 'no-store' });
        const json = await res.json();
        // console.log("this is book data", json)
        if (mounted && json?.success && Array.isArray(json.data)) {
          setBooks(json.data);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.9;
      scrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (loading && books.length === 0) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <div className="h-8 w-56 mx-auto bg-purple-200/40 rounded animate-pulse mb-4" />
            <div className="h-4 w-72 mx-auto bg-gray-200/40 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-lg bg-gray-200/40 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!books.length) return null;

  return (
    <section className="py-16 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Latest <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600">New</span> Releases
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Fresh arrivals just added to the catalog
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center justify-end mb-8"
        >
          <Link href="/new-releases" className="text-sm font-medium text-purple-600 hover:text-purple-700">View all</Link>
        </motion.div>

        {/*  Horizontal scroll layout added here */}
        <div className="relative">
          {/* Left scroll button */}
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-white shadow-md hover:bg-purple-50 text-purple-600 rounded-full p-2 z-10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Scrollable book list */}
          <div
            ref={scrollRef}
            className="flex overflow-x-auto overflow-y-hidden space-x-4 pb-4 scroll-smooth"
            style={{
              scrollbarWidth: 'none',          // Firefox ke liye
              msOverflowStyle: 'none',         // IE ke liye
            }}
          >
            {/* Chrome ke liye scrollbar hide */}
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>

            {books.map((b, idx) => {
              const mapped: any = {
                id: b._id,
                title: b.title,
                author: (b as any).authorName || 'Unknown',
                coverImage: b.coverImage || '/logo.png',
                mrp: b.mrp,
                discountedPrice: b.discountedPrice,
                rating: 0,
                reviewCount: 0,
                featured: false,
                inStock: true,
              };
              return (
                <motion.div
                  key={b._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="flex-shrink-0 w-56"
                >
                  <div className="w-full">
                    <div className="relative">
                      {/* NEW badge overlay (specific to new releases) */}
                      {/* <div className="absolute top-2 right-2 z-10">
                        <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-semibold px-2 py-1 rounded shadow">NEW</span>
                      </div> */}
                      {/* Discount badge removed here to avoid duplication; BookCard already shows discount */}
                      <BookCard book={mapped} showBuyNow showReviewSnippet={false} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Right scroll button */}
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-white shadow-md hover:bg-purple-50 text-purple-600 rounded-full p-2 z-10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </section>
  );
}
