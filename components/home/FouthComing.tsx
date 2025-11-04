"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import BookCard from "@/components/books/BookCard";
import { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ForthComing = () => {
  const [forthComingBooks, setForthComingBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isPaused = useRef(false);
  const direction = useRef<"right" | "left">("right");
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);

  // 📘 Fetch forthcoming books
  useEffect(() => {
    if (typeof window === "undefined") return;

    const load = async () => {
      try {
        const url = new URL("/api/books/", window.location.origin);
        url.searchParams.set("featured", "true");
        url.searchParams.set("limit", "8");

        const res = await fetch(url.toString(), { cache: "no-store" });
        const data = await res.json();

        if (data?.success && data.data?.length > 0) {
          setForthComingBooks(data.data);
          setLoading(false);
        } else {
          setLoading(true);
        }
      } catch (err) {
        console.error("Error fetching forthcoming books:", err);
        setLoading(true);
      }
    };

    load();
  }, []);

  // 🔁 Auto-scroll (same as NewReleases/BestSellers)
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || loading) return;

    const step = 1; // pixels per tick
    const interval = 15; // ms

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
  }, [forthComingBooks, loading]);

  // ⏩ Manual scroll buttons
  const scroll = (direction: "left" | "right") => {
    const container = scrollRef.current;
    if (!container) return;
    isPaused.current = true;
    const scrollAmount = 300;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
    setTimeout(() => (isPaused.current = false), 2000);
  };

  return (
    <section className="py-16 bg-gray-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 🔸 Section Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Forthcoming Books
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Be the first to explore our soon-to-be-released titles
          </p>
        </motion.div>

        {/* 🔸 Left & Right Buttons */}
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

        {/* 🔸 Carousel + Skeleton Loading */}
        <div
          ref={scrollRef}
          className="flex overflow-x-auto overflow-y-hidden space-x-6 pb-4 scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
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

          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-64 h-80 bg-gray-200 rounded-xl overflow-hidden shimmer"
                ></div>
              ))
            : forthComingBooks.map((book, index) => (
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

        {/* 🔸 View All Button */}
        <div className="text-center mt-12">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <Link href={loading ? "#" : "/fouthComing"}>
              <button
                disabled={loading}
                className={`px-8 py-3 font-semibold rounded-lg transition-colors duration-300 ${
                  loading
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-700 text-white"
                }`}
              >
                {loading
                  ? "View All Forthcoming Books..."
                  : "View All Forthcoming Books"}
              </button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ForthComing;
