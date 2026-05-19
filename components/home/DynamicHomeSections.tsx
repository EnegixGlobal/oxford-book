'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import BookCard from '@/components/books/BookCard';

interface Section {
  _id: string;
  title: string;
  description?: string;
  books: any[];
}

export default function DynamicHomeSections() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const res = await fetch('/api/homepage-sections', { cache: 'no-store' });
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setSections(data.data);
        }
      } catch (error) {
        console.error('Error loading dynamic home sections:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSections();
  }, []);

  if (loading) {
    return (
      <>
        <style jsx>{`
          .shimmer {
            background: linear-gradient(
              90deg,
              #f0f0f0 25%,
              #e0e0e0 50%,
              #f0f0f0 75%
            );
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
          }
          @keyframes shimmer {
            0% {
              background-position: -200% 0;
            }
            100% {
              background-position: 200% 0;
            }
          }
        `}</style>
        {Array.from({ length: 2 }).map((_, sIdx) => (
          <section key={sIdx} className={`py-16 relative overflow-hidden ${sIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col items-center mb-12">
                <div className="w-56 h-9 bg-gray-200 rounded-lg shimmer mb-3"></div>
                <div className="w-96 h-5 bg-gray-200 rounded shimmer"></div>
              </div>
              <div className="flex overflow-x-auto space-x-6 pb-4" style={{ scrollbarWidth: "none" }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 w-64 h-80 bg-gray-200 rounded-xl overflow-hidden shimmer"
                  ></div>
                ))}
              </div>
            </div>
          </section>
        ))}
      </>
    );
  }

  if (sections.length === 0) return null;

  return (
    <>
      {sections.map((section, idx) => (
        <SectionCarousel key={section._id} section={section} index={idx} />
      ))}
    </>
  );
}

function SectionCarousel({ section, index }: { section: Section; index: number }) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isPaused = useRef(false);
  const direction = useRef<'right' | 'left'>('right');
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll logic matching other carousels
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const step = 1; // pixels per frame
    const interval = 15; // ms delay

    const startScroll = () => {
      autoScrollRef.current = setInterval(() => {
        if (!container || isPaused.current) return;

        const maxScroll = container.scrollWidth - container.clientWidth;

        if (direction.current === 'right') {
          container.scrollLeft += step;
          if (container.scrollLeft >= maxScroll) direction.current = 'left';
        } else {
          container.scrollLeft -= step;
          if (container.scrollLeft <= 0) direction.current = 'right';
        }
      }, interval);
    };

    startScroll();

    const handleMouseEnter = () => (isPaused.current = true);
    const handleMouseLeave = () => (isPaused.current = false);

    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [section.books]);

  const scroll = (scrollDir: 'left' | 'right') => {
    const container = scrollRef.current;
    if (!container) return;
    isPaused.current = true;
    const scrollAmount = 300;
    container.scrollBy({
      left: scrollDir === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
    setTimeout(() => (isPaused.current = false), 2000);
  };

  const bgClass = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';

  return (
    <section className={`py-16 ${bgClass} relative overflow-hidden`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600">
            {section.title}
          </h2>
          {section.description && (
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {section.description}
            </p>
          )}
        </motion.div>

        {/* Navigation Buttons */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 shadow-md p-2 rounded-full hover:bg-purple-100 z-10 transition duration-300"
        >
          <ChevronLeft className="w-6 h-6 text-purple-700" />
        </button>
        <button
          onClick={() => scroll('right')}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 shadow-md p-2 rounded-full hover:bg-purple-100 z-10 transition duration-300"
        >
          <ChevronRight className="w-6 h-6 text-purple-700" />
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

          {section.books.map((book, idx) => (
            <motion.div
              key={book._id || idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.05 }}
              className="flex-shrink-0 w-64"
            >
              <BookCard book={book} showBuyNow />
            </motion.div>
          ))}
        </div>

        {/* 🔸 View All Button */}
        <div className="text-center mt-12">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <Link href={`/homepage-section/${section._id}`}>
              <button
                className="px-8 py-3 font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors duration-300 shadow-lg shadow-purple-600/20 hover:shadow-purple-700/30"
              >
                View All {section.title} Books
              </button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
