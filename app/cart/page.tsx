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

  const steps = ['Cart', 'Checkout'];
  const currentStep = 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative min-h-screen py-10 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(168,85,247,0.18),transparent_60%),radial-gradient(circle_at_85%_30%,rgba(236,72,153,0.18),transparent_65%)]" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header & Steps */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600">
              Your Cart <span className="text-gray-400 text-base font-normal">({getTotalItems()} items)</span>
            </h1>
            <p className="text-sm text-gray-600 mt-1">Review your selected books and proceed to secure checkout.</p>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium">
            {steps.map((s, i) => {
              const active = i === currentStep;
              const done = i < currentStep;
              return (
                <div key={s} className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center border text-xs ${active ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white border-transparent shadow-lg shadow-purple-300/40' : done ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-500 border-gray-300'} transition-colors`}>{i+1}</div>
                  <span className={`hidden sm:inline ${active ? 'text-purple-700' : done ? 'text-green-600' : 'text-gray-500'}`}>{s}</span>
                  {i < steps.length - 1 && <div className={`w-10 h-[2px] rounded-full ${i < currentStep ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-300'}`} />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-5">
      {cartItems.map((item, index) => (
              <motion.div
        key={item.id ? `cart-${item.id}` : `cart-idx-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/85 backdrop-blur rounded-2xl shadow-xl shadow-purple-200/40 p-4 sm:p-6 border border-white/60"
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
                        <Button variant="outline" size="sm" onClick={() => updateQuantity(item.id, item.quantity - 1)} className="hover:border-purple-400"> <Minus className="w-4 h-4" /></Button>
                        <span className="font-semibold text-lg min-w-8 text-center">{item.quantity}</span>
                        <Button variant="outline" size="sm" onClick={() => updateQuantity(item.id, item.quantity + 1)} className="hover:border-purple-400"> <Plus className="w-4 h-4" /></Button>
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
                        
                        <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full">
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
            <div className="bg-gradient-to-b from-white/95 via-white/90 to-white/70 rounded-2xl p-4 sm:p-6 lg:sticky lg:top-8 shadow-xl shadow-pink-200/40 border border-white/60">
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
                <Button className="w-full bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:opacity-90 text-white text-lg py-4 sm:py-6 mb-4 shadow-lg shadow-purple-300/40">
                  Proceed to Checkout
                </Button>
              </Link>
              
              <Link href="/" className="block">
                <Button variant="outline" className="w-full mb-4">
                  Continue Shopping
                </Button>
              </Link>
              
              <p className="text-xs sm:text-sm text-gray-500 text-center">
                Free shipping & secure checkout. No hidden fees.
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