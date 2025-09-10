'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { sampleBooks } from '@/lib/sampleData';

const BookCarousel = () => {
  const books = sampleBooks.slice(0, 18); // Use first 18 books for more slides
  const booksPerSlide = 6; // 6 on desktop
  const totalSlides = Math.ceil(books.length / booksPerSlide);
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const calculateDiscount = (mrp: number, discountedPrice: number) => {
    if (discountedPrice < mrp) {
      return Math.round(((mrp - discountedPrice) / mrp) * 100);
    }
    return 0;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 4000); // Auto-advance every 4 seconds

    return () => clearInterval(interval);
  }, [totalSlides]);

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

        <div className="overflow-hidden mb-8">
          {/* Books Grid */}
          <motion.div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {Array.from({ length: totalSlides }, (_, slideIndex) => (
              <div key={slideIndex} className="flex-none w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 px-4">
                {books.slice(slideIndex * booksPerSlide, (slideIndex + 1) * booksPerSlide).map((book) => (
                  <motion.div
                    key={book.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="group flex flex-col items-center"
                  >
                    <Link href={`/book/${(book as any).slug ?? book.id}`}>
                      <div className="bg-white rounded-lg shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden w-44">
                        <div className="relative aspect-[1/1] overflow-hidden">
                          <Image
                            src={book.coverImage}
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
                            by {book.author}
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
            ))}
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
            {Array.from({ length: totalSlides }, (_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'bg-fuchsia-600 scale-125'
                    : 'bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
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
