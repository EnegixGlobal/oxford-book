"use client";

import { motion } from "framer-motion";
import BookCard from "@/components/books/BookCard";
import { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BookDto {
  _id: string;
  title: string;
  slug: string;
  coverImage?: string;
  discountedPrice: number;
  mrp: number;
  discount: number;
}

interface BookListData {
  _id: string;
  title: string;
  description?: string;
  books: BookDto[];
}

interface DynamicBookListProps {
  slug?: string;
}

const DynamicBookList = ({ slug }: DynamicBookListProps) => {
  const [listData, setListData] = useState<BookListData | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isPaused = useRef(false);
  const direction = useRef<"right" | "left">("right");
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadList = async () => {
      try {
        const url = slug ? `/api/booklists?slug=${slug}` : `/api/booklists`;
        const res = await fetch(url, { cache: "no-store" });
        const data = await res.json();
        if (data?.success && data.data) {
          // If slug provided, data.data is single object; otherwise take first active list
          const list = slug ? data.data : (Array.isArray(data.data) ? data.data[0] : data.data);
          if (list) setListData(list);
        }
      } catch (error) {
        console.error("Failed to load book list:", error);
      }
    };
    loadList();
  }, [slug]);

  // Auto scroll
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !listData?.books.length) return;

    const step = 1;
    const interval = 15;

    const startScroll = () => {
      autoScrollRef.current = setInterval(() => {
        if (!container || isPaused.current) return;

        const maxScroll = container.scrollWidth - container.clientWidth;

        if (direction.current === "right") {
          container.scrollLeft += step;
          if (container.scrollLeft >= maxScroll) direction.current = "left";
        } else {
          container.scrollLeft -= step;
          if (container.scrollLeft <= 0) direction.current = "right";
        }
      }, interval);
    };

    startScroll();

    const handleMouseEnter = () => (isPaused.current = true);
    const handleMouseLeave = () => (isPaused.current = false);

    container.addEventListener("mouseenter", handleMouseEnter);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);
      container.removeEventListener("mouseenter", handleMouseEnter);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [listData]);

  const scroll = (dir: "left" | "right") => {
    const container = scrollRef.current;
    if (!container) return;
    isPaused.current = true;
    const scrollAmount = 300;
    container.scrollBy({
      left: dir === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
    setTimeout(() => (isPaused.current = false), 2000);
  };

  if (!listData || !listData.books.length) return null;

  return (
    <section className="py-16 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600">
              {listData.title}
            </span>
          </h2>
          {listData.description && (
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {listData.description}
            </p>
          )}
        </motion.div>

        {/* Left/Right Buttons */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 shadow-md p-2 rounded-full hover:bg-purple-100 z-10"
        >
          <ChevronLeft className="w-6 h-6 text-purple-700" />
        </button>
        <button
          onClick={() => scroll("right")}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 shadow-md p-2 rounded-full hover:bg-purple-100 z-10"
        >
          <ChevronRight className="w-6 h-6 text-purple-700" />
        </button>

        {/* Carousel */}
        <div
          ref={scrollRef}
          className="flex overflow-x-auto overflow-y-hidden space-x-6 pb-4 scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          {listData.books.map((book, index) => (
            <motion.div
              key={book._id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.05 }}
              className="flex-shrink-0 w-64"
            >
              <BookCard book={book as any} showBuyNow />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DynamicBookList;

