'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Star, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/components/providers/CartProvider';
import type { Book } from '@/lib/sampleData';
import { sampleReviews } from '@/lib/sampleData';

interface BookCardProps {
  book: Book;
  showBuyNow?: boolean; // when true, render a Buy Now button below Add to Cart
  showReviewSnippet?: boolean; // controls rendering of small latest review block (disabled in uniform grids)
}

const BookCard = ({ book, showBuyNow = true, showReviewSnippet = false }: BookCardProps) => {

  const { addToCart } = useCart();
  // Lazy import useRouter to avoid circular during SSR if needed
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const router = require('next/navigation').useRouter?.();

  // Get reviews for this book
  const bookReviews = sampleReviews.filter(review => review.bookId === book.id);
  const latestReview = bookReviews.length > 0 ? bookReviews[0] : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(book);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(book);
    router?.push('/checkout');
  };

  const discountPercentage = Math.round(((book.mrp - book.discountedPrice) / book.mrp) * 100);

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="group"
    >
      {/*  horizontal scroll container */}
      <div className="flex flex-row overflow-x-auto space-x-4 scrollbar-hide p-2">
        <Link href={`/book/${(book as any).slug ?? book.id}`}>
          <div className="rounded-md overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col max-w-sm min-h-[430px]">
            {/* Book Cover */}
            <div className="relative aspect-[1/1] overflow-hidden">
              <Image
                src={book.coverImage}
                alt={book.title}
                width={300}
                height={300}
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
              />

              {/* //Remove Descount tag */}
              {/* <div className="absolute top-3 left-3 ">
                {discountPercentage > 0 && (
                  <Badge className="bg-red-500 hover:bg-red-500 text-white">
                    {discountPercentage}% OFF
                  </Badge>
                )}
              </div> */}
              {/* <div className="absolute top-3 right-3 ">
                {book.featured && 
                  <Badge className="bg-purple-600 hover:bg-purple-600 text-white">
                    Featured
                  </Badge>
                }
              </div> */}
            </div>

            {/* Book Info */}
            <div className="p-3 flex-grow flex flex-col">
              <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-purple-600 transition-colors min-h-[40px]">
                {book.title}
              </h3>

              <p className="text-xs text-gray-600 mb-2 min-h-[16px]">by {book.author}</p>

              {/* Rating */}
              <div className="flex items-center mb-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${i < Math.floor(book.rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                        }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-600 ml-1">
                  {book.rating} ({book.reviewCount})
                </span>
              </div>

              {/* Customer Review Section */}
              {showReviewSnippet && latestReview && (
                <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-2.5 h-2.5 ${i < latestReview.rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                            }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-600 ml-1 font-medium">
                      {latestReview.userName}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 line-clamp-2 italic">
                    &ldquo;{latestReview.comment}&rdquo;
                  </p>
                  {bookReviews.length > 1 && (
                    <p className="text-xs text-purple-600 mt-1">
                      +{bookReviews.length - 1} more reviews
                    </p>
                  )}
                </div>
              )}

              {/* Price and Add to Cart */}
              <div className="mt-auto">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-base font-bold text-purple-600">
                      ₹{Math.floor(book.discountedPrice)}
                    </span>
                    {book.mrp > book.discountedPrice && (
                      <span className="text-xs text-gray-500 line-through ml-1">
                        ₹{book.mrp}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {/* Add to Cart – 60% */}
                  <Button
                    onClick={handleAddToCart}
                    className="w-[55%] bg-fuchsia-700 hover:bg-fuchsia-900 text-white transition-colors duration-300"
                    size="sm"
                    disabled={!book.inStock}
                  >
                    <img
                      src="/icons/basket.png"
                      alt="Cart"
                      className="w-5 h-5 mr-1"
                    />
                    {book.inStock ? "Add to Cart" : "Out of Stock"}
                  </Button>

                  {/* Buy Now – 40% */}
                  {showBuyNow && (
                    <Button
                      onClick={handleBuyNow}
                      disabled={!book.inStock}
                      size="sm"
                      className="w-[45%] bg-gradient-to-r from-pink-600 via-rose-600 to-red-600 hover:opacity-90 text-white font-medium transition-colors duration-300"
                    >
                      <img
                        src="/icons/shopping-bag.png"
                        alt="Buy Now"
                        className="w-5 h-5 mr-1"
                      />
                      Buy Now
                    </Button>
                  )}
                </div>

              </div>
            </div>
          </div>
        </Link>
      </div>

    </motion.div>
  );
};

export default BookCard;
