'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Build many cycles for the band so it feels infinite without frequent re-anchoring
function nineCycles(totalSlides: number) {
  // at least 9 cycles or more depending on slides (keep it odd to center easily)
  return Math.max(9, totalSlides >= 3 ?  nineRound(totalSlides) : 9);
}

function nineRound(n: number) {
  // round up to the next odd number >= 9
  const base = Math.max(9, n);
  return base % 2 === 1 ? base : base + 1;
}
// Fetch featured books from API so admin carousel selections reflect here

const BookCarousel = () => {
  const [books, setBooks] = useState<any[]>([]);
  const booksPerSlide = 6; // 6 on desktop
  const totalSlides = useMemo(() => Math.ceil(books.length / booksPerSlide), [books.length]);
  // Infinite carousel state uses cloned first/last slides with index starting at 1 (first real slide)
  const [index, setIndex] = useState(1);
  const [withTransition, setWithTransition] = useState(false);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const [offsetPct, setOffsetPct] = useState(0); // 0..100 within a slide
  const [basePct, setBasePct] = useState(0); // accumulated offset to avoid visual jumps when resetting index
  const secondsPerSlide = 10; // matches your desired speed
  const speedPctPerSec = 100 / secondsPerSlide;

  // Build slides content for each slide page
  const slideContent = useMemo(() => {
    if (!books.length) return [] as any[][];
    const slides: any[][] = [];
    for (let i = 0; i < totalSlides; i++) {
      const page: any[] = [];
      for (let j = 0; j < booksPerSlide; j++) {
        const idx = (i * booksPerSlide + j) % books.length;
        page.push(books[idx]);
      }
      slides.push(page);
    }
    return slides;
  }, [books, totalSlides]);

  // Build a long band: many cycles of slides so it never feels like there are only 2 clones
  const cycles = totalSlides >= 1 ?  nineCycles(totalSlides) : 0;
  const displayCount = totalSlides >= 1 ? totalSlides * cycles : 0;
  const midCycleStart = totalSlides >= 1 ? totalSlides * Math.floor(cycles / 2) : 0;
  const translatePct = totalSlides >= 1 ? basePct + index * 100 + offsetPct : 0;

  const nextSlide = () => {
    if (totalSlides <= 1) return; // nothing to slide
    // snap to next slide and reset fractional offset
    setWithTransition(true);
    setOffsetPct(0);
    setIndex((prev) => {
      const ni = prev + 1;
      const minIndex = totalSlides; // keep some headroom before start
      const maxIndex = displayCount - totalSlides - 1; // and before end
      if (ni >= maxIndex) {
        const shift = totalSlides * Math.floor(cycles / 2);
        // re-anchor back by many slides to stay in the middle
        setWithTransition(false);
        requestAnimationFrame(() => setWithTransition(true));
        setBasePct((b) => b + shift * 100);
        return ni - shift;
      }
      return ni;
    });
  };

  const prevSlide = () => {
    if (totalSlides <= 1) return;
    setWithTransition(true);
    setOffsetPct(0);
    setIndex((prev) => {
      const ni = prev - 1;
      const minIndex = totalSlides;
      if (ni <= minIndex) {
        const shift = totalSlides * Math.floor(cycles / 2);
        setWithTransition(false);
        requestAnimationFrame(() => setWithTransition(true));
        setBasePct((b) => b - shift * 100);
        return ni + shift;
      }
      return ni;
    });
  };

  const goToSlide = (dotIndex: number) => {
    if (totalSlides <= 1) return;
    setWithTransition(true);
    setOffsetPct(0);
    // place near the middle cycle
    setIndex(midCycleStart + (dotIndex % totalSlides));
  };

  const calculateDiscount = (mrp: number, discountedPrice: number) => {
    if (discountedPrice < mrp) {
      return Math.round(((mrp - discountedPrice) / mrp) * 100);
    }
    return 0;
  };

  useEffect(() => {
    // load featured books
    const load = async () => {
      try {
        const url = new URL('/api/books', window.location.origin);
        url.searchParams.set('featured', 'true');
        url.searchParams.set('limit', '24');
        const res = await fetch(url.toString(), { cache: 'no-store' });
        const data = await res.json();
        if (data?.success) setBooks(data.data || []);
      } catch {
        // ignore
      }
    };
    load();
  }, []);

  // Initialize index to middle cycle when slides computed
  useEffect(() => {
    if (totalSlides >= 1 && displayCount > 0) {
      setWithTransition(false);
      setOffsetPct(0);
      setBasePct(0);
      setIndex(midCycleStart);
      requestAnimationFrame(() => setWithTransition(true));
    }
  }, [totalSlides, displayCount, midCycleStart]);

  // Continuous autoplay via requestAnimationFrame
  useEffect(() => {
  if (totalSlides <= 0 || paused) return;
    let mounted = true;
    const tick = (ts: number) => {
      if (!mounted) return;
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = Math.min((ts - (lastTsRef.current ?? ts)) / 1000, 0.1); // seconds, clamp to avoid jumps
      lastTsRef.current = ts;
      setWithTransition(false); // rely on manual transform updates, no CSS transition
      setOffsetPct((prev) => {
        let next = prev + speedPctPerSec * dt;
        if (next >= 100) {
          next -= 100;
          setIndex((old) => {
            const ni = old + 1;
            const minIndex = totalSlides;
            const maxIndex = displayCount - totalSlides - 1;
            if (ni >= maxIndex) {
              const shift = totalSlides * Math.floor(cycles / 2);
              setBasePct((b) => b + shift * 100);
              return ni - shift;
            }
            return ni;
          });
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTsRef.current = null;
    };
  }, [totalSlides, paused, speedPctPerSec]);

  // No clone-boundary correction needed with multi-cycle band; re-anchoring handled inline

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Featured <span className="text-fuchsia-600">Books</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover our handpicked selection of bestselling books
          </p>
        </motion.div>

        <div
          className="overflow-hidden mb-8"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Books Grid */}
          <motion.div
            className="flex ease-in-out"
            style={{
              transform: `translateX(-${translatePct}%)`,
              transition: withTransition && totalSlides >= 1 ? 'transform 500ms' : 'none',
            }}
          >
            {Array.from({ length: displayCount }, (_, displayIndex) => {
              if (totalSlides === 0) return null;
              // Map display index (with clones) to real slide index for any totalSlides >= 1
              const realSlideIndex = ((displayIndex % totalSlides) + totalSlides) % totalSlides;
              const pageBooks = slideContent[realSlideIndex] || [];
              return (
                <div key={`slide-${displayIndex}`} className="flex-none w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 px-4">
      {pageBooks.map((book, pos) => (
                  <motion.div
    key={`${(book._id || book.id)}-${displayIndex}-${pos}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="group flex flex-col items-center"
                  >
          <Link href={`/book/${(book as any).slug ?? book._id ?? book.id}`}>
                      <div className="bg-white rounded-lg shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden w-44">
                        <div className="relative aspect-[1/1] overflow-hidden">
                          <Image
              src={book.coverImage || '/logo.png'}
                            alt={book.title}
                            fill
                            className="object-cover"
                          />
                          {calculateDiscount(book.mrp, book.discountedPrice) > 0 && (
                            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                              -{calculateDiscount(book.mrp, book.discountedPrice)}%
                            </div>
                          )}
                        </div>
                        <div className="p-4 text-center">
                          <h3 className="font-semibold text-sm md:text-base text-gray-900 truncate mb-1">
                            {book.title}
                          </h3>
                          <p className="text-slate-500 text-xs md:text-sm mb-3">
                            by {book.authorName || (book as any).author}
                          </p>
                          <div className="flex items-center justify-center space-x-2">
                            <span className="text-fuchsia-600 font-semibold">
                              ₹{book.discountedPrice}
                            </span>
                            {book.discountedPrice < book.mrp && (
                              <span className="line-through text-slate-400 text-sm">
                                ₹{book.mrp}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                  ))}
                </div>
              );
            })}
          </motion.div>
        </div>

        {/* Navigation Controls - Below Carousel */}
        <div className="flex items-center justify-center space-x-8">
          <button
            onClick={prevSlide}
            className="w-10 h-10 rounded-full bg-white/80 hover:bg-white shadow-lg transition-all duration-300 hover:scale-110 flex items-center justify-center"
            aria-label="Previous books"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>

          {/* Dots Indicator */}
          <div className="flex space-x-2">
    {Array.from({ length: totalSlides }, (_, dot) => (
              <button
                key={dot}
                onClick={() => goToSlide(dot)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
      (totalSlides >= 1 ? ((index + totalSlides) % totalSlides) : -1) === dot
                    ? 'bg-fuchsia-600 scale-125'
                    : 'bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Go to slide ${dot + 1}`}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            className="w-10 h-10 rounded-full bg-white/80 hover:bg-white shadow-lg transition-all duration-300 hover:scale-110 flex items-center justify-center"
            aria-label="Next books"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default BookCarousel;
