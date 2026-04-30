'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart,
  User,
  Search,
  Menu,
  X,
  LogOut,
  Shield,
  Heart,
} from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/components/providers/CartProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { useWishlist } from '@/components/providers/WishlistProvider';
import { motion, AnimatePresence } from 'framer-motion';
import NavigationMenu from './NavigationMenu';
import AuthModal from '../auth/AuthModal';

const Header = () => {
  const router = useRouter();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const { getTotalItems } = useCart();
  const { user, logout } = useAuth();
  const { wishlist } = useWishlist();

  // Search states
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);

  // Search handler
  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (term.trim().length > 1) {
      try {
        const url = new URL('/api/books', window.location.origin);
        url.searchParams.set('search', term);

        const res = await fetch(url.toString(), { cache: 'no-store' });
        const data = await res.json();
        setSearchResults(data?.data || []);
      } catch (err) {
        console.error(err);
      }
    } else {
      setSearchResults([]);
    }
  };

  // Enter key navigation
  const handleEnterPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchResults.length > 0) {
      setIsNavigating(true);
      router.push(`/book/${searchResults[0]._id}`);
      setSearchTerm('');
    }
  };

  // Lock scroll when menu open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white shadow">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            {!isSearchOpen && (
              <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
                <Image
                  src="/oxford-logo.png"
                  alt="Oxford Logo"
                  width={120}
                  height={40}
                  className="h-10 w-auto"
                />
              </Link>
            )}

            {/* Search Bar */}
            <div className={`${isSearchOpen ? 'flex' : 'hidden'} md:flex items-center space-x-4 flex-1 max-w-md mx-4 md:mx-8 relative`}>
              <div className="relative w-full flex items-center">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search for books, authors, or ISBN..."
                  className="pl-10 pr-10 py-2 w-full border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                  onChange={handleSearch}
                  onKeyDown={handleEnterPress}
                  value={searchTerm}
                  autoFocus={isSearchOpen}
                />
                {isSearchOpen && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 md:hidden"
                    onClick={() => setIsSearchOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}

                {/* Live Search Results */}
                {searchTerm.length > 1 && !isNavigating && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-[60] max-h-60 overflow-y-auto">
                    {searchResults.length > 0 ? (
                      searchResults.map((book) => (
                        <Link
                          key={book._id}
                          href={`/book/${book._id}`}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50"
                          onClick={() => {
                            setSearchTerm('');
                            setIsSearchOpen(false);
                          }}
                        >
                          {book.title}
                        </Link>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-500">
                        No results found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Actions */}
            <div className={`${isSearchOpen ? 'hidden' : 'flex'} items-center space-x-2 sm:space-x-4`}>
              {/* Mobile Search Toggle */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => {
                  setIsSearchOpen(true);
                  setIsMenuOpen(false);
                }}
              >
                <Search className="w-5 h-5" />
              </Button>

              {/* Wishlist */}
              <Link href="/wishlist" className="hidden sm:block">
                <Button variant="ghost" size="sm" className="relative">
                  <Heart className="w-5 h-5" />
                  {wishlist.length > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 text-xs bg-pink-600 text-white rounded-full flex items-center justify-center">
                      {wishlist.length}
                    </span>
                  )}
                </Button>
              </Link>

              {/* User */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <User className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Account</DropdownMenuLabel>

                    {user.role === 'admin' && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin">
                          <Shield className="w-4 h-4 mr-2" /> Admin
                        </Link>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem asChild>
                      <Link href="/profile">Profile</Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={logout}
                    >
                      <LogOut className="w-4 h-4 mr-2" /> Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAuthModalOpen(true)}
                >
                  <User className="w-5 h-5" />
                </Button>
              )}

              {/* Cart */}
              <Link href="/cart">
                <Button variant="ghost" size="sm" className="relative">
                  <ShoppingCart className="w-5 h-5" />
                  {getTotalItems() > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 text-xs bg-purple-600 text-white rounded-full flex items-center justify-center">
                      {getTotalItems()}
                    </span>
                  )}
                </Button>
              </Link>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => {
                  setIsMenuOpen(!isMenuOpen);
                  setIsSearchOpen(false);
                }}
              >
                <Menu className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        <AnimatePresence>
          {isMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMenuOpen(false)}
                className="fixed inset-0 bg-black/50 z-[60] lg:hidden"
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 h-full w-[280px] bg-white z-[70] shadow-xl lg:hidden overflow-y-auto"
              >
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b flex items-center justify-between">
                    <span className="font-bold text-lg text-purple-600">Menu</span>
                    <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(false)}>
                      <X className="w-6 h-6" />
                    </Button>
                  </div>
                  <div className="flex-1">
                    <NavigationMenu mobile />
                  </div>
                  <div className="p-4 border-t space-y-2">
                    {!user && (
                      <Button 
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsAuthModalOpen(true);
                        }}
                      >
                        Login / Register
                      </Button>
                    )}
                    <Link href="/wishlist" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" className="w-full flex items-center gap-2">
                        <Heart className="w-4 h-4 text-pink-600" />
                        Wishlist
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
};

export default Header;