'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, User, Search, Menu, X, LogOut, Shield, Heart } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/components/providers/CartProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import NavigationMenu from './NavigationMenu';
import AuthModal from '@/components/auth/AuthModal';
import { useWishlist } from '@/components/providers/WishlistProvider';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { getTotalItems } = useCart();
  const { user, logout } = useAuth();
  const { wishlist } = useWishlist();

  // book data check
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // 🔍 handleSearch function
  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (term.trim().length > 1) {
      const url = new URL('/api/books', window.location.origin);
      url.searchParams.set('search', term);

      // smart logic: agar chhoti search hai, limit lagao
      if (term.length < 3) url.searchParams.set('limit', '8');

      try {
        const res = await fetch(url.toString(), { cache: 'no-store' });
        const data = await res.json();
        setSearchResults(data?.data || []);
      } catch (error) {
        console.error(error);
      }
    } else {
      setSearchResults([]);
    }
  };

  // Lock body scroll when drawer is open & handle ESC key
  useEffect(() => {
    if (isMenuOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsMenuOpen(false);
      };
      window.addEventListener('keydown', handleKey);
      return () => {
        document.body.style.overflow = original;
        window.removeEventListener('keydown', handleKey);
      };
    }
  }, [isMenuOpen]);

  return (
    <>
      <header className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/oxford-logo.png"
                alt="Oxford Logo"
                width={120}
                height={40}
                className="h-10 w-auto"
              />
            </Link>

            {/* Desktop Search Bar */}
            <div className="hidden md:flex items-center space-x-4 flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search for books, authors, or ISBN..."
                  className="pl-10 pr-4 py-2 w-full border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                  onChange={handleSearch}
                  value={searchTerm}
                />

                {/* Desktop Live Search */}
                {searchTerm.length > 1 && searchResults.length > 0 && (
                  <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                    {searchResults.map((book: any) => (
                      <Link
                        key={book._id}
                        href={`/book/${book._id}`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50"
                        onClick={() => setSearchTerm('')}
                      >
                        {book.title}
                      </Link>
                    ))}
                  </div>
                )}
                {searchTerm.length > 1 && searchResults.length === 0 && (
                  <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-md shadow-sm text-sm text-gray-500 p-2">
                    No books found.
                  </div>
                )}
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-4">
              {/* Wishlist */}
              <Link href="/wishlist" className="hidden sm:block">
                <Button variant="ghost" size="sm" className="relative">
                  <Heart className="w-5 h-5" />
                  {wishlist.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-pink-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {wishlist.length}
                    </span>
                  )}
                  <span className="ml-2 hidden lg:inline">Wishlist</span>
                </Button>
              </Link>

              {user ? (
                <div className="flex items-center space-x-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        <span className="hidden sm:inline max-w-[120px] truncate text-left">
                          {user.name}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel className="text-xs font-medium text-gray-500">
                        Account
                      </DropdownMenuLabel>
                      {user.role === 'admin' && (
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-fuchsia-600" />
                            <span>Admin</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>Profile</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/wishlist" className="flex items-center gap-2">
                          <Heart className="w-4 h-4 text-pink-600" />
                          <span>Wishlist</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={logout}
                        className="flex items-center gap-2 text-red-600 focus:text-red-700"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAuthModalOpen(true)}
                >
                  <User className="w-5 h-5" />
                  <span className="ml-2 hidden sm:inline">Login</span>
                </Button>
              )}

              {(!user || user.role !== 'admin') && (
                <Link href="/cart">
                  <Button variant="ghost" size="sm" className="relative">
                    <ShoppingCart className="w-5 h-5" />
                    {getTotalItems() > 0 && (
                      <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {getTotalItems()}
                      </span>
                    )}
                    <span className="ml-2 hidden sm:inline">Cart</span>
                  </Button>
                </Link>
              )}

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                aria-haspopup="dialog"
                aria-expanded={isMenuOpen}
                aria-controls="mobile-nav-drawer"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </div>
          </div>

          {/*  Mobile Search  */}
          <div className="md:hidden pb-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search books..."
              className="pl-10 pr-4 py-2 w-full"
              onChange={handleSearch}       
              value={searchTerm}           
            />

            {/*  Mobile search results */}
            {searchTerm.length > 1 && searchResults.length > 0 && (
              <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                {searchResults.map((book: any) => (
                  <Link
                    key={book._id}
                    href={`/book/${book._id}`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50"
                    onClick={() => setSearchTerm('')}
                  >
                    {book.title}
                  </Link>
                ))}
              </div>
            )}
            {searchTerm.length > 1 && searchResults.length === 0 && (
              <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-md shadow-sm text-sm text-gray-500 p-2">
                No books found.
              </div>
            )}
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
};

export default Header;
