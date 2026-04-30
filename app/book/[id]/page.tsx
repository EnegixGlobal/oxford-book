"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ShoppingCart, Share2, Heart, ArrowLeft, CheckCircle2, Sparkles, BookOpen, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import BookCard from '@/components/books/BookCard';
import { Textarea } from '@/components/ui/textarea';
import { useCart } from '@/components/providers/CartProvider';
import { useWishlist } from '@/components/providers/WishlistProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { sampleReviews } from '@/lib/sampleData';
import { toast } from 'sonner';

export default function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState('');
  const [reviews, setReviews] = useState(sampleReviews.filter(review => review.bookId === id));
  const { addToCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const [book, setBook] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const { has: hasWishlist, toggle: toggleWishlist } = useWishlist();
  const [sharing, setSharing] = useState(false);
  const [related, setRelated] = useState<any[]>([]);
  const [relatedHeading, setRelatedHeading] = useState<string>('');

  // Related books strategy:
  // 1. Try to fetch other books by the same author (using authorName) excluding current.
  // 2. If that yields zero results, fall back to books in the same category (category slug) excluding current.
  // 3. Limit display to 8 items. Heading changes based on which source succeeded.
  useEffect(() => {
    let active = true;

    const loadRelated = async () => {
      if (!book) return;
      try {
        // First attempt: same author (by name) excluding current
        let chosen: any[] = [];
        let heading = '';
        if (book.author) {
          const r = await fetch(`/api/books?authorName=${encodeURIComponent(book.author)}&limit=8&page=1`, { cache: 'no-store' }).then(r => r.json()).catch(() => null);
          if (r?.success && Array.isArray(r.data)) {
            chosen = r.data.filter((b: any) => (b._id || b.id) !== book.id);
            if (chosen.length > 0) {
              heading = `More by ${book.author}`;
            }
          }
        }
        // Fallback to same category if author results insufficient (0) and we have a category
        if ((!chosen || chosen.length === 0) && book.category) {
          const r2 = await fetch(`/api/books?category=${encodeURIComponent(book.category)}&limit=8&page=1`, { cache: 'no-store' }).then(r => r.json()).catch(() => null);
          if (r2?.success && Array.isArray(r2.data)) {
            const filtered = r2.data.filter((b: any) => (b._id || b.id) !== book.id);
            if (filtered.length) {
              chosen = filtered;
              heading = 'More in this Category';
            }
          }
        }
        if (active) {
          setRelated(chosen.slice(0, 8));
          setRelatedHeading(heading);
        }
      } catch (e) {
        if (active) {
          setRelated([]);
          setRelatedHeading('');
        }
      }
    };
    loadRelated();
    return () => { active = false; };
  }, [book]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/books/${encodeURIComponent(id)}`, { cache: 'no-store' });
        const json = await res.json();
        if (!alive) return;
        if (json?.success && json.data) {
          const b = json.data;
            setBook({
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
              discount: b.discount ?? Math.round(((b.mrp - b.discountedPrice) / (b.mrp || 1)) * 100),
              rating: b.rating || 0,
              reviewCount: b.reviewCount || 0,
              category: b.categorySlug,
              subcategory: b.subcategorySlug,
              ageGroup: b.ageGroup,
              genre: b.genre,
              stock: b.stock,
              anticipated: b.anticipated,
              bestseller: b.bestseller,
              createdAt: b.createdAt,
              coverImage: b.coverImage || '/logo.png',
              inStock: b.inStock,
              featured: !!b.featured,
              totalPages: b.totalPages,
            });
        } else if (json?.data) {
          setBook(json.data);
        } else {
          setBook(null);
        }
      } catch {
        if (alive) setBook(null);
      } finally {
        if (alive) setLoading(false);
      }
    };
    if (id) load();
    return () => { alive = false; };
  }, [id]);

  if (!book && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Book Not Found</h1>
          <Link href="/">
            <Button>Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmitReview = () => {
    if (!user) {
      toast.error('Please login to submit a review');
      return;
    }

    if (!userRating || !userReview.trim()) {
      toast.error('Please provide both rating and review');
      return;
    }

    const newReview = {
      id: Date.now().toString(),
      bookId: book.id,
      userName: user.name,
      rating: userRating,
      comment: userReview,
      date: new Date().toISOString().split('T')[0]
    };

    setReviews(prev => [newReview, ...prev]);
    setUserRating(0);
    setUserReview('');
    toast.success('Review submitted successfully!');
  };

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl text-gray-700">Loading book details...</h1>
        </div>
      </div>
    );
  }

  const discountPercentage = Math.round(((book.mrp - book.discountedPrice) / (book.mrp || 1)) * 100);
  const descLimit = 320;
  const longDescription = (book.description || '').trim();
  const isLong = longDescription.length > descLimit;
  const displayDescription = !isLong || showFullDesc ? longDescription : longDescription.slice(0, descLimit).trim() + '...';
  const formatLabel = (val: string | undefined) => val ? val.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '';
  const highlights: string[] = [
    book.author && `Author: ${book.author}`,
    book.language && `Language: ${formatLabel(book.language)}`,
    book.binding && `Format: ${formatLabel(book.binding)}`,
    book.ageGroup && `Age: ${book.ageGroup}`,
    book.genre && `Genre: ${formatLabel(book.genre)}`,
    discountPercentage > 0 && `Save ${discountPercentage}% (₹${Math.round( book.mrp - book.discountedPrice)})`,
    // (typeof book.stock === 'number') && `Stock: ${book.stock}`, // Removed per request: hide numeric stock
    book.inStock ? 'In Stock – Ready to ship' : 'Currently Unavailable'
  ].filter(Boolean) as string[];

  const handleShare = async () => {
    try {
      setSharing(true);
      const url = typeof window !== 'undefined' ? window.location.href : '';
      if (navigator.share) {
        await navigator.share({ title: book.title, text: `Check out this book: ${book.title}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
      }
    } catch {
      toast.error('Unable to share');
    } finally {
      setSharing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative min-h-screen py-10 overflow-hidden"
    >
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(168,85,247,0.18),transparent_60%),radial-gradient(circle_at_80%_20%,rgba(236,72,153,0.18),transparent_65%)]" />
      <div className="max-w-7xl relative mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/">
            <Button variant="ghost" className="">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          {book.featured && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow">
              <Sparkles className="h-3 w-3" /> Featured
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
          {/* Book Image and Actions */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="sticky top-8">
              <div className="relative group">
                <Image
                  src={book.coverImage}
                  alt={book.title}
                  width={400}
                  height={400}
                  className="w-full h-[420px] rounded-2xl mx-auto object-contain bg-white/70 backdrop-blur shadow-xl shadow-purple-200/40 ring-1 ring-white/60 group-hover:shadow-purple-300/50 transition-shadow"
                  priority
                />
                {discountPercentage > 0 && (
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-gradient-to-r from-rose-600 to-pink-600 text-white text-sm px-3 py-1 shadow-md shadow-rose-300/40">
                      Save {discountPercentage}%
                    </Badge>
                  </div>
                )}
                {!book.inStock && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-gray-700 text-white text-xs px-2 py-1">
                      Out of Stock
                    </Badge>
                  </div>
                )}
              </div>

              <div className="mt-8 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button
                    onClick={() => addToCart(book)}
                    className="w-full bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:opacity-90 text-white text-lg py-5 shadow-lg shadow-purple-300/40 disabled:opacity-60"
                    disabled={!book.inStock}
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    {book.inStock ? "Add to Cart" : "Out of Stock"}
                  </Button>
                  <Button
                    onClick={() => {
                      if (!book.inStock) return;
                      addToCart(book);
                      // Wait for state update and localStorage sync to complete before navigating
                      setTimeout(() => {
                        router.push("/checkout");
                      }, 200);
                    }}
                    className="w-full bg-gradient-to-r from-pink-600 via-rose-600 to-red-600 hover:opacity-90 text-white text-lg py-5 shadow-lg shadow-rose-300/40 disabled:opacity-60"
                    disabled={!book.inStock}
                  >
                    Buy Now
                  </Button>
                </div>

                <div className="flex gap-3 sm:gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className={`flex-1 ${
                      hasWishlist(book.id)
                        ? "border-pink-500 text-pink-600 bg-pink-50"
                        : ""
                    }`}
                    onClick={() => toggleWishlist(book.id)}
                  >
                    <Heart
                      className={`w-4 h-4 mr-2 ${
                        hasWishlist(book.id)
                          ? "fill-pink-500 text-pink-500"
                          : ""
                      }`}
                    />
                    {hasWishlist(book.id) ? "Wishlisted" : "Wishlist"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={handleShare}
                    disabled={sharing}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    {sharing ? "Sharing..." : "Share"}
                  </Button>
                </div>
                {/* Mobile Highlights / Benefits */}
                <div className="block lg:hidden pt-2 space-y-4">
                  <div className="bg-white/70 backdrop-blur rounded-xl p-4 shadow-md ring-1 ring-white/60">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-purple-600" />{" "}
                      Highlights
                    </h3>
                    <ul className="text-xs text-gray-700 grid gap-1.5">
                      {highlights.slice(0, 4).map((h) => (
                        <li key={h} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                          <span className="leading-snug">{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[10px]">
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-gradient-to-br from-purple-50 to-white border border-purple-100">
                      <ShieldCheck className="h-3.5 w-3.5 text-purple-600" />
                      <span>Secure</span>
                    </div>
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-gradient-to-br from-pink-50 to-white border border-pink-100">
                      <Truck className="h-3.5 w-3.5 text-pink-600" />
                      <span>Fast Ship</span>
                    </div>
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-gradient-to-br from-fuchsia-50 to-white border border-fuchsia-100">
                      <RefreshCw className="h-3.5 w-3.5 text-fuchsia-600" />
                      <span>Easy Return</span>
                    </div>
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-gradient-to-br from-rose-50 to-white border border-rose-100">
                      <Sparkles className="h-3.5 w-3.5 text-rose-600" />
                      <span>Quality</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Below-sticky supplemental content (desktop) */}
            <div className="mt-12 hidden lg:block">
              <div className="bg-white/70 backdrop-blur rounded-2xl p-6 shadow-lg shadow-purple-200/30 ring-1 ring-white/60 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-3">
                    <BookOpen className="h-5 w-5 text-purple-600" /> Highlights
                  </h3>
                  <ul className="text-sm text-gray-700 grid grid-cols-1 gap-2">
                    {highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-gradient-to-br from-purple-50 to-white border border-purple-100">
                    <ShieldCheck className="h-4 w-4 text-purple-600 mt-0.5" />
                    <p className="font-medium text-gray-700">Secure checkout</p>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-gradient-to-br from-pink-50 to-white border border-pink-100">
                    <Truck className="h-4 w-4 text-pink-600 mt-0.5" />
                    <p className="font-medium text-gray-700">Fast delivery</p>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-gradient-to-br from-fuchsia-50 to-white border border-fuchsia-100">
                    <RefreshCw className="h-4 w-4 text-fuchsia-600 mt-0.5" />
                    <p className="font-medium text-gray-700">Easy returns</p>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-gradient-to-br from-rose-50 to-white border border-rose-100">
                    <Sparkles className="h-4 w-4 text-rose-600 mt-0.5" />
                    <p className="font-medium text-gray-700">Quality assured</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Book Details */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-8"
          >
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600">
                {book.title}
              </h1>
              <p className="text-lg text-gray-700">
                by{" "}
                <span className="font-semibold text-gray-900">
                  {book.author}
                </span>
              </p>
              <p className="text-sm text-gray-500">{book.publisher}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {book.category && (
                  <Badge
                    variant="secondary"
                    className="bg-purple-100 text-purple-700"
                  >
                    {book.category}
                  </Badge>
                )}
                {book.subcategory && (
                  <Badge
                    variant="secondary"
                    className="bg-pink-100 text-pink-600"
                  >
                    {book.subcategory}
                  </Badge>
                )}
                {book.language && (
                  <Badge
                    variant="outline"
                    className="border-gray-300 text-gray-600"
                  >
                    {book.language}
                  </Badge>
                )}
                {book.ageGroup && (
                  <Badge
                    variant="outline"
                    className="border-purple-200 text-purple-600"
                  >
                    Age: {book.ageGroup}
                  </Badge>
                )}
                {book.genre && (
                  <Badge
                    variant="outline"
                    className="border-pink-200 text-pink-600"
                  >
                    {formatLabel(book.genre)}
                  </Badge>
                )}
                {book.bestseller && (
                  <Badge className="bg-amber-500 text-white">Bestseller</Badge>
                )}
                {book.anticipated && (
                  <Badge className="bg-indigo-500 text-white">
                    Anticipated
                  </Badge>
                )}
              </div>
            </div>

            {/* Rating */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-6 h-6 ${
                      i < Math.floor(book.rating)
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm sm:text-lg font-semibold text-gray-800">
                {book.rating}{" "}
                <span className="font-normal text-gray-500">
                  ({book.reviewCount} reviews)
                </span>
              </span>
            </div>

            {/* Price */}
            <div className="bg-gradient-to-r from-purple-50 via-fuchsia-50 to-pink-50 rounded-xl p-5 sm:p-6 ring-1 ring-purple-100/50 shadow-inner">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                      ₹{Math.round(book.discountedPrice)}
                    </span>
                    {book.mrp > book.discountedPrice && (
                      <span className="text-base sm:text-xl text-gray-500 line-through">
                        ₹{Math.floor(book.mrp)}
                      </span>
                    )}
                    {discountPercentage > 0 && (
                      <span className="text-xs sm:text-sm font-medium text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">
                        -{discountPercentage}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs sm:text-sm text-gray-600">You save</p>
                  <p className="text-base sm:text-lg font-semibold text-green-600">
                    ₹{Math.round(book.mrp - book.discountedPrice)}
                  </p>

                  {discountPercentage > 0 && (
                    <p className="text-[10px] sm:text-xs text-green-500 font-medium">
                      Inclusive of all discounts
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Book Details */}
            <div className="bg-white/80 backdrop-blur rounded-xl p-6 shadow-lg shadow-purple-200/30 ring-1 ring-white/60">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Book Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-sm text-gray-600">ISBN</p>
                  <p className="font-semibold">{book.isbn}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Binding</p>
                  <p className="font-semibold capitalize">
                    {formatLabel(book.binding)}
                  </p>
                </div>
                {book.language && (
                  <div>
                    <p className="text-sm text-gray-600">Language</p>
                    <p className="font-semibold capitalize">
                      {formatLabel(book.language)}
                    </p>
                  </div>
                )}
                {book.totalPages && (
                  <div>
                    <p className="text-sm text-gray-600">Total Pages</p>
                    <p className="font-semibold">{book.totalPages}</p>
                  </div>
                )}
                {book.ageGroup && (
                  <div>
                    <p className="text-sm text-gray-600">Age Group</p>
                    <p className="font-semibold">{book.ageGroup}</p>
                  </div>
                )}
                {book.genre && (
                  <div>
                    <p className="text-sm text-gray-600">Genre</p>
                    <p className="font-semibold capitalize">
                      {formatLabel(book.genre)}
                    </p>
                  </div>
                )}
                {/** Stock count removed per request */}
                {typeof book.discount === "number" && book.discount > 0 && (
                  <div>
                    <p className="text-sm text-gray-600">Discount</p>
                    <p className="font-semibold text-green-600">
                      {book.discount}%
                    </p>
                  </div>
                )}
                {/* {book.createdAt && (
                  <div>
                    <p className="text-sm text-gray-600">Added</p>
                    <p className="font-semibold">
                      {new Date(book.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )} */}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white/80 backdrop-blur rounded-xl p-6 shadow-lg shadow-pink-200/30 ring-1 ring-white/60 relative">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Description
              </h3>
              <div className="relative">
                <AnimatePresence initial={false}>
                  <motion.p
                    key={showFullDesc ? "full" : "truncated"}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-gray-700 leading-relaxed text-sm md:text-base whitespace-pre-line"
                  >
                    {displayDescription || "No description available."}
                  </motion.p>
                </AnimatePresence>
                {isLong && !showFullDesc && (
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white/90 to-transparent pointer-events-none" />
                )}
              </div>
              {isLong && (
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFullDesc((v) => !v)}
                    className="border-dashed"
                  >
                    {showFullDesc ? "Show Less" : "Read More"}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Reviews Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16"
        >
          <div className="bg-white/85 backdrop-blur rounded-2xl p-8 shadow-xl shadow-purple-200/30 ring-1 ring-white/60">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-2">
              Customer Reviews{" "}
              {reviews.length > 0 && (
                <span className="text-sm text-gray-500 font-normal">
                  ({reviews.length})
                </span>
              )}
            </h2>

            {/* Submit Review */}
            {user && (
              <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 via-fuchsia-50 to-pink-50 rounded-xl ring-1 ring-purple-100/40">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Write a Review
                </h3>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Rating</p>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-6 h-6 cursor-pointer ${
                          i < userRating
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                        onClick={() => setUserRating(i + 1)}
                      />
                    ))}
                  </div>
                </div>
                <Textarea
                  placeholder="Share your thoughts about this book..."
                  value={userReview}
                  onChange={(e) => setUserReview(e.target.value)}
                  className="mb-4 focus-visible:ring-purple-500"
                  rows={4}
                />
                <Button
                  onClick={handleSubmitReview}
                  className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:opacity-90 shadow"
                >
                  Submit Review
                </Button>
              </div>
            )}

            <div className="space-y-6">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="border-b border-gray-200/70 pb-6 last:border-b-0"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-1">
                      {review.userName}{" "}
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    </h4>
                    <span className="text-sm text-gray-500">{review.date}</span>
                  </div>
                  <div className="flex items-center mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {review.comment}
                  </p>
                </div>
              ))}
              {reviews.length === 0 && (
                <p className="text-gray-500 text-center py-8">
                  No reviews yet. Be the first to review this book!
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
      {/* Related Books Section */}
      {relatedHeading && related.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mt-20"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-gray-900">
              {relatedHeading}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((r, index) => {
                const mapped: any = {
                  id: r._id || r.id,
                  title: r.title,
                  author: r.authorName || r.author,
                  coverImage: r.coverImage || "/logo.png",
                  mrp:
                    typeof r.mrp === "number" ? r.mrp : r.discountedPrice || 0,
                  discountedPrice:
                    typeof r.discountedPrice === "number"
                      ? r.discountedPrice
                      : r.mrp || 0,
                  rating: r.rating || 0,
                  reviewCount: r.reviewCount || 0,
                  featured: !!r.featured,
                  inStock: r.inStock !== false,
                  slug: r.slug || r._id || r.id,
                };
                return (
                  <div key={mapped.id} className="h-full">
                    <BookCard book={mapped} />
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}