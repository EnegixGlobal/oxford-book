'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, ShoppingCart, Share2, Heart, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useCart } from '@/components/providers/CartProvider';
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

  const [book, setBook] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

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
            rating: b.rating || 0,
            reviewCount: b.reviewCount || 0,
            category: b.categorySlug,
            subcategory: b.subcategorySlug,
            coverImage: b.coverImage || '/logo.png',
            inStock: b.inStock,
            featured: !!b.featured,
          });
        } else if (json?.data) {
          // sample fallback shape already compatible
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Books
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Book Image and Actions */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="sticky top-8">
              <div className="relative">
                <Image
                  src={book.coverImage}
                  alt={book.title}
                  width={400}
                  height={600}
                  className="w-full max-w-md mx-auto rounded-2xl shadow-2xl h-auto object-cover"
                  priority
                />
                {discountPercentage > 0 && (
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-red-500 text-white text-lg px-3 py-1">
                      {discountPercentage}% OFF
                    </Badge>
                  </div>
                )}
              </div>
              
              <div className="mt-8 space-y-4">
                <Button
                  onClick={() => addToCart(book)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white text-lg py-6"
                  disabled={!book.inStock}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {book.inStock ? 'Add to Cart' : 'Out of Stock'}
                </Button>
                
                <div className="flex gap-4">
                  <Button variant="outline" className="flex-1">
                    <Heart className="w-4 h-4 mr-2" />
                    Wishlist
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
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
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {book.title}
              </h1>
              <p className="text-xl text-gray-700 mb-2">by {book.author}</p>
              <p className="text-lg text-gray-600">{book.publisher}</p>
            </div>

            {/* Rating */}
            <div className="flex items-center">
              <div className="flex items-center mr-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-6 h-6 ${
                      i < Math.floor(book.rating) 
                        ? 'text-yellow-400 fill-current' 
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-lg font-semibold text-gray-800">
                {book.rating} ({book.reviewCount} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="bg-purple-50 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-3xl font-bold text-purple-600">
                    ₹{book.discountedPrice}
                  </span>
                  {book.mrp > book.discountedPrice && (
                    <span className="text-xl text-gray-500 line-through ml-4">
                      ₹{book.mrp}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">You save</p>
                  <p className="text-lg font-semibold text-green-600">
                    ₹{book.mrp - book.discountedPrice}
                  </p>
                </div>
              </div>
            </div>

            {/* Book Details */}
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Book Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">ISBN</p>
                  <p className="font-semibold">{book.isbn}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Binding</p>
                  <p className="font-semibold">{book.binding}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Weight</p>
                  <p className="font-semibold">{book.weight}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Language</p>
                  <p className="font-semibold">{book.language}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Description</h3>
              <p className="text-gray-700 leading-relaxed">{book.description}</p>
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
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Customer Reviews</h2>

            {/* Submit Review */}
            {user && (
              <div className="mb-8 p-6 bg-purple-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Write a Review</h3>
                
                {/* Rating Input */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Rating</p>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-6 h-6 cursor-pointer ${
                          i < userRating 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-300'
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
                  className="mb-4"
                  rows={4}
                />
                
                <Button 
                  onClick={handleSubmitReview}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Submit Review
                </Button>
              </div>
            )}

            {/* Reviews List */}
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{review.userName}</h4>
                    <span className="text-sm text-gray-500">{review.date}</span>
                  </div>
                  <div className="flex items-center mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-gray-700">{review.comment}</p>
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
    </motion.div>
  );
}