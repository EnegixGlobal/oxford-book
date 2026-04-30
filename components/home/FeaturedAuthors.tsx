'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AuthorDto {
  _id?: string;
  name: string;
  slug: string;
  nationality?: string;
  biography?: string;
  profileImage?: string;
  booksCount?: number;
}

const FeaturedAuthors = () => {
  const [authors, setAuthors] = useState<AuthorDto[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isPaused = useRef(false);
  const direction = useRef<'right' | 'left'>('right');
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);

  // 📚 Fetch featured authors
  useEffect(() => {
    const loadAuthors = async () => {
      try {
        const res = await fetch('/api/authors?limit=12', { cache: 'no-store' });
        const json = await res.json();
        console.log('author', json)
        if (json?.success && Array.isArray(json.data)) {
          setAuthors(json.data);
        }
      } catch (error) {
        console.error(error);
      }
    };
    loadAuthors();
  }, []);

  // 🔁 Auto scroll with reverse motion
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const step = 1; // pixels per frame (smoothness)
    const interval = 15; // ms delay (lower = smoother)

    const startScroll = () => {
      autoScrollRef.current = setInterval(() => {
        if (!container || isPaused.current) return;

        const maxScroll = container.scrollWidth - container.clientWidth;

        if (direction.current === 'right') {
          container.scrollLeft += step;
          if (container.scrollLeft >= maxScroll) {
            direction.current = 'left'; // reverse
          }
        } else {
          container.scrollLeft -= step;
          if (container.scrollLeft <= 0) {
            direction.current = 'right'; // reverse
          }
        }
      }, interval);
    };

    startScroll();

    const handleMouseEnter = () => (isPaused.current = true);
    const handleMouseLeave = () => (isPaused.current = false);

    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [authors]);

  // Manual scroll
  const scroll = (dir: 'left' | 'right') => {
    const container = scrollRef.current;
    if (!container) return;
    isPaused.current = true; // pause while manual scroll
    const scrollAmount = 300;
    container.scrollBy({
      left: dir === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
    setTimeout(() => (isPaused.current = false), 2000);
  };

  if (!authors.length) return null;

  return (
    <section className="py-16 bg-gray-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Featured <span className="text-fuchsia-600">Authors</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover the brilliant minds crafting stories that inspire and captivate
          </p>
        </motion.div>

        {/* Left / Right Buttons */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 shadow-md p-2 rounded-full hover:bg-fuchsia-100 z-10"
        >
          <ChevronLeft className="w-6 h-6 text-fuchsia-700" />
        </button>
        <button
          onClick={() => scroll('right')}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 shadow-md p-2 rounded-full hover:bg-fuchsia-100 z-10"
        >
          <ChevronRight className="w-6 h-6 text-fuchsia-700" />
        </button>

        {/* Carousel */}
        <div
          ref={scrollRef}
          className="flex overflow-x-auto overflow-y-hidden space-x-6 pb-4 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          {authors.map((author, index) => (
            <motion.div
              key={author._id || author.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="flex-shrink-0 w-48 group text-center"
            >
              <Link href={`/author/${author.slug}`} className="block">
                <div className="relative mb-4">
                  <div className="w-32 h-32 mx-auto rounded-full overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow duration-300 flex items-center justify-center bg-fuchsia-100 text-fuchsia-600">
                    {author.profileImage ? (
                      <Image
                        src={author.profileImage}
                        alt={`Portrait of ${author.name}`}
                        width={128}
                        height={128}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <span className="text-4xl font-bold uppercase">
                        {author.name.charAt(0)}
                      </span>
                    )}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-fuchsia-600 transition-colors duration-300">
                  {author.name}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {(author.biography || '').length > 60 ? `${author.biography?.substring(0, 60)}...` : (author.biography || '')}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* View All */}
        <div className="text-center mt-12">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <Link href="/authors">
              <button className="inline-flex items-center px-8 py-3 bg-fuchsia-600 text-white font-semibold rounded-lg hover:bg-fuchsia-700 transition-colors duration-300">
                View All Authors
                <svg
                  className="ml-2 w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedAuthors;