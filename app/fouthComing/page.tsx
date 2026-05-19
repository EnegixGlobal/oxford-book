"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Clock } from "lucide-react";
import BookCard from "@/components/books/BookCard";
import { Button } from "@/components/ui/button";

type SortKey = "newest" | "price-asc" | "price-desc" | "rating-desc";

export default function ForthcomingBooksPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasNext, setHasNext] = useState<boolean>(false);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [sort, setSort] = useState<SortKey>("newest");
  const [listTitle, setListTitle] = useState("Upcoming Titles You Can’t Miss");
  const [listDesc, setListDesc] = useState("Discover our soon-to-be-released books — fresh stories and ideas on their way to you!");

  const limit = 16;

  const load = async (pageToLoad = 1, append = false) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);
      const res = await fetch(
        `/api/books?featured=true&page=${pageToLoad}&limit=${limit}`,
        { cache: "no-store" }
      );
      const json = await res.json();
      console.log("this is json", json);
      const mapItem = (b: any) => ({
        id: b._id || b.id,
        slug: b.slug,
        title: b.title,
        isbn: b.isbn,
        author: b.authorName || b.author,
        publisher: b.publisher || "",
        binding: (b.binding || "paperback").toString(),
        language: b.language || "english",
        description: b.description || "",
        mrp: b.mrp,
        discountedPrice: b.discountedPrice,
        rating: b.rating || 0,
        reviewCount: b.reviewCount || 0,
        category: b.categorySlug,
        subcategory: b.subcategorySlug,
        ageGroup: b.ageGroup || "",
        coverImage: b.coverImage || "/logo.png",
        inStock: b.inStock,
        featured: !!b.featured,
        forthcoming: !!b.forthcoming,
        createdAt: b.createdAt || undefined,
      });
      if (json?.success && Array.isArray(json.data)) {
        const newItems = json.data.map(mapItem);
        setBooks((prev) => (append ? [...prev, ...newItems] : newItems));
        setHasNext(!!json.pagination?.hasNext);
        setTotalItems(Number(json.pagination?.totalItems || newItems.length));
        setPage(pageToLoad);
      } else {
        setBooks([]);
        setHasNext(false);
        setTotalItems(0);
      }
    } catch (err) {
      console.error("Error loading forthcoming books:", err);
      if (!append) setBooks([]);
      setHasNext(false);
      setTotalItems(0);
    } finally {
      if (append) setLoadingMore(false);
      else setLoading(false);
    }
  };

  useEffect(() => {
    // Load dynamic settings
    const loadSettings = async () => {
      try {
        const settingsRes = await fetch("/api/forthcoming-title", { cache: "no-store" });
        const settingsData = await settingsRes.json();
        if (settingsData?.success && settingsData.data) {
          setListTitle(settingsData.data.title || "Upcoming Titles You Can’t Miss");
          setListDesc(settingsData.data.description || "Discover our soon-to-be-released books — fresh stories and ideas on their way to you!");
        }
      } catch (err) {
        console.error("Error loading forthcoming title settings:", err);
      }
    };
    loadSettings();

    let alive = true;
    (async () => {
      if (alive) await load(1, false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const sortedBooks = useMemo(() => {
    const arr = [...books];
    switch (sort) {
      case "price-asc":
        return arr.sort(
          (a, b) => (a.discountedPrice ?? a.mrp) - (b.discountedPrice ?? b.mrp)
        );
      case "price-desc":
        return arr.sort(
          (a, b) => (b.discountedPrice ?? b.mrp) - (a.discountedPrice ?? a.mrp)
        );
      case "rating-desc":
        return arr.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case "newest":
      default:
        return arr;
    }
  }, [books, sort]);

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
              <Clock className="w-4 h-4" />
              <span>Forthcoming Books</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-700">
              {listTitle}
            </h1>
            {listDesc && (
              <p className="mt-3 text-lg md:text-xl text-gray-700 max-w-2xl">
                {listDesc}
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
            <span className="font-semibold text-gray-900">{totalItems}</span>{" "}
            forthcoming books
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
          {loading &&
            Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={`s-${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
              >
                <div className="aspect-[1/1] w-full rounded-lg bg-gray-200 animate-pulse" />
                <div className="mt-3 h-4 w-3/4 rounded bg-gray-200 animate-pulse" />
                <div className="mt-2 h-3 w-1/2 rounded bg-gray-200 animate-pulse" />
                <div className="mt-4 h-8 w-full rounded bg-gray-200 animate-pulse" />
              </motion.div>
            ))}

          {!loading &&
            sortedBooks.map((book, index) => (
              <motion.div
                key={book.slug || book.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: Math.min(index * 0.03, 0.3),
                }}
                className="group"
              >
                <div className="relative">
                  {/* Upcoming tag */}
                  <div className="absolute z-10 top-2 left-0">
                    <span className="inline-flex items-center gap-1 rounded-r-full bg-indigo-600 text-white text-[11px] font-semibold px-2 py-0.5 shadow">
                      <Clock className="w-3 h-3" /> Coming Soon
                    </span>
                  </div>
                  <BookCard book={book} />
                </div>
              </motion.div>
            ))}
        </div>

        {/* Empty state */}
        {!loading && sortedBooks.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center py-16"
          >
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No forthcoming books available
            </h3>
            <p className="text-gray-500">
              Stay tuned for new releases coming soon!
            </p>
          </motion.div>
        )}

        {/* Load more */}
        {!loading && hasNext && (
          <div className="mt-10 flex justify-center">
            <Button
              onClick={() => load(page + 1, true)}
              disabled={loadingMore}
              className="bg-indigo-700 hover:bg-indigo-800"
            >
              {loadingMore ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading more
                </span>
              ) : (
                "Load more"
              )}
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
