'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useCart } from '@/components/providers/CartProvider';
import BookCard from '@/components/books/BookCard';
import { useEffect, useState } from 'react';

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, getTotalPrice, getTotalItems } = useCart();
  const [recommendedBooks, setRecommendedBooks] = useState<any[]>([]);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecs = async () => {
      setRecError(null);
      setRecLoading(true);
      try {
        const exclude = cartItems.map(ci => (ci as any)._id || ci.id).filter(Boolean);
        const res = await fetch('/api/books/recommended', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ excludeIds: exclude, limit: 8 })
        });
        const json = await res.json();
        if (json.success) {
          setRecommendedBooks(json.data || []);
        } else {
          setRecError(json.message || 'Failed to load');
        }
      } catch {
        setRecError('Failed to load');
      } finally {
        setRecLoading(false);
      }
    };
    fetchRecs();
  }, [cartItems]);

  if (cartItems.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8 sm:py-16"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ShoppingBag className="w-16 h-16 sm:w-24 sm:h-24 mx-auto text-gray-400 mb-6 sm:mb-8" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
          <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">Start shopping to add some amazing books to your cart!</p>
          <Link href="/">
            <Button className="bg-purple-600 hover:bg-purple-700 px-6 py-2 sm:px-8 sm:py-3">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center w-full">
            <Link href="/" className="mb-3 sm:mb-0">
              <Button variant="ghost" className="sm:mr-4 text-sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Continue Shopping
              </Button>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Your Cart ({getTotalItems()} items)
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
      {cartItems.map((item, index) => (
              <motion.div
        key={item.id ? `cart-${item.id}` : `cart-idx-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-lg p-4 sm:p-6"
              >
                <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4">
                  <Image
                    src={item.coverImage}
                    alt={item.title}
                    width={80}
                    height={112}
                    className="w-16 h-20 sm:w-20 sm:h-28 object-cover rounded-lg mx-auto sm:mx-0"
                  />
                  
                  <div className="flex-grow w-full text-center sm:text-left">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-gray-600 mb-2">by {item.author}</p>
                    <p className="text-sm text-gray-500 mb-3">{item.publisher} • {item.binding}</p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="font-semibold text-lg min-w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-center sm:text-right">
                          <p className="text-lg font-bold text-purple-600">
                            ₹{item.discountedPrice * item.quantity}
                          </p>
                          {item.mrp > item.discountedPrice && (
                            <p className="text-sm text-gray-500 line-through">
                              ₹{item.mrp * item.quantity}
                            </p>
                          )}
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-1 order-first lg:order-last"
          >
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:sticky lg:top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal ({getTotalItems()} items)</span>
                  <span className="font-semibold">₹{getTotalPrice()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-semibold text-green-600">FREE</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-lg font-bold text-purple-600">₹{getTotalPrice()}</span>
                  </div>
                </div>
              </div>
              
              <Link href="/checkout" className="block">
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white text-lg py-4 sm:py-6 mb-4">
                  Proceed to Checkout
                </Button>
              </Link>
              
              <Link href="/" className="block">
                <Button variant="outline" className="w-full mb-4">
                  Continue Shopping
                </Button>
              </Link>
              
              <p className="text-sm text-gray-500 text-center">
                Free shipping on all orders. Secure checkout guaranteed.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Recommended Books Section */}
        {(recLoading || recError || recommendedBooks.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 sm:mt-16"
          >
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Recommended Books</h2>
              <p className="text-gray-600 text-sm sm:text-base">You might also like these amazing books</p>
            </div>
            {recLoading && (
              <div className="text-center text-sm text-gray-500 py-6">Loading recommendations...</div>
            )}
            {recError && !recLoading && (
              <div className="text-center text-sm text-red-600 py-6">{recError}</div>
            )}
            {!recLoading && !recError && (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {recommendedBooks.map((book, index) => (
                  <motion.div
                    key={(book as any)._id ? `rec-${(book as any)._id}` : book.id ? `rec-${book.id}` : `rec-idx-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="h-full"
                  >
                    <BookCard book={{
                      // adapt DB shape to BookCard expected sample shape
                      id: (book as any)._id || book.id,
                      title: book.title,
                      isbn: book.isbn || 'NA',
                      author: (book as any).authorName || book.author || 'Unknown',
                      publisher: book.publisher || 'Unknown',
                      binding: (book.binding || 'paperback') as any,
                      weight: '0',
                      language: book.language || 'english',
                      description: book.description || '',
                      mrp: book.mrp,
                      discountedPrice: book.discountedPrice,
                      rating: book.rating || 0,
                      reviewCount: book.reviewCount || 0,
                      category: (book as any).categorySlug || book.category || 'general',
                      subcategory: (book as any).subcategorySlug,
                      ageGroup: (book as any).ageGroup,
                      coverImage: book.coverImage || '/frame.png',
                      inStock: book.inStock !== false,
                      featured: (book as any).featured || false,
                    }} />
                  </motion.div>
                ))}
              </div>
            )}
            
            <div className="text-center mt-6 sm:mt-8">
              <Link href="/">
                <Button variant="outline" size="lg" className="px-6 sm:px-8">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Browse More Books
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}