"use client";
import React, { useEffect, useState } from 'react';
import { useWishlist } from '@/components/providers/WishlistProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { useCart } from '@/components/providers/CartProvider';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingCart, X } from 'lucide-react';
import BookCard from '@/components/books/BookCard';
import { motion } from 'framer-motion';

interface BookLike { _id?: string; id?: string; title: string; coverImage?: string; discountedPrice?: number; mrp?: number; authorName?: string; }

export default function WishlistPage() {
  const { wishlist, remove, refresh } = useWishlist();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [books, setBooks] = useState<BookLike[]>([]);
  const token = typeof window !== 'undefined' ? localStorage.getItem('bookhaven-token') : null;

  useEffect(() => {
    const load = async () => {
      if (!user) { setBooks([]); return; }
      const res = await fetch('/api/profile/wishlist', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setBooks(json.data);
      }
    };
    load();
  }, [wishlist, user, token]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Login Required</h1>
          <p className="text-gray-600 mb-6">Please log in to view your wishlist.</p>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Heart className="w-7 h-7 text-pink-600" />
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600">My Wishlist</h1>
      </div>
      {books.length === 0 ? (
        <div className="text-center py-24 bg-white/70 backdrop-blur rounded-2xl shadow ring-1 ring-white/60">
          <p className="text-gray-600 mb-6">Your wishlist is empty.</p>
          <Link href="/">
            <Button variant="outline">Browse Books</Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Mobile Horizontal Scroll */}
          <div className="md:hidden -mx-4 px-4 pb-4 overflow-x-auto flex gap-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-purple-300/50 scrollbar-track-transparent" aria-label="Wishlist items horizontal list">
            {books.map(b => {
              const id = b._id || b.id || '';
              const mapped: any = {
                id,
                title: b.title,
                author: b.authorName || 'Unknown',
                coverImage: b.coverImage || '/logo.png',
                mrp: b.mrp ?? b.discountedPrice ?? 0,
                discountedPrice: b.discountedPrice ?? b.mrp ?? 0,
                rating: 0,
                reviewCount: 0,
                featured: false,
                inStock: true,
              };
              return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative snap-start w-40 flex-shrink-0"
                >
                  <button
                    onClick={() => remove(id)}
                    aria-label="Remove from wishlist"
                    title="Remove"
                    className="absolute top-2 right-2 z-10 bg-white/90 hover:bg-white border border-gray-100 rounded-md p-1.5 shadow-sm transition"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                  <BookCard book={mapped} />
                </motion.div>
              );
            })}
          </div>

          {/* Desktop / Tablet Grid */}
            <div className="hidden md:grid gap-6 lg:gap-8 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {books.map(b => {
              const id = b._id || b.id || '';
              const mapped: any = {
                id,
                title: b.title,
                author: b.authorName || 'Unknown',
                coverImage: b.coverImage || '/logo.png',
                mrp: b.mrp ?? b.discountedPrice ?? 0,
                discountedPrice: b.discountedPrice ?? b.mrp ?? 0,
                rating: 0,
                reviewCount: 0,
                featured: false,
                inStock: true,
              };
              return (
                <motion.div key={id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="relative">
                  <button onClick={() => remove(id)} aria-label="Remove from wishlist" title="Remove" className="absolute top-2 right-2 z-10 bg-white/90 hover:bg-white border border-gray-100 rounded-md p-1.5 shadow-sm transition">
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                  <BookCard book={mapped} />
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
