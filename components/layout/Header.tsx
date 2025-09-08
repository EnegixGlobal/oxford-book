'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, User, Search, Menu, X, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/components/providers/CartProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import NavigationMenu from './NavigationMenu';
import AuthModal from '@/components/auth/AuthModal';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { getTotalItems } = useCart();
  const { user, logout } = useAuth();

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

            {/* Desktop Navigation */}
            

            {/* Search Bar */}
            <div className="hidden md:flex items-center space-x-4 flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search for books, authors, or ISBN..."
                  className="pl-10 pr-4 py-2 w-full border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="hidden sm:inline text-sm text-gray-600">
                    Hello, {user.name}
                  </span>
                  {user.role === 'admin' && (
                    <Link href="/admin">
                      <Button variant="ghost" size="sm">
                        Admin
                      </Button>
                    </Link>
                  )}
                  <Link href="/profile">
                    <Button variant="ghost" size="sm">
                      <User className="w-4 h-4" />
                      <span className="ml-2 hidden sm:inline">Profile</span>
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={logout}>
                    <LogOut className="w-4 h-4" />
                    <span className="ml-2 hidden sm:inline">Logout</span>
                  </Button>
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

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search books..."
                className="pl-10 pr-4 py-2 w-full"
              />
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white border-t"
            >
              <NavigationMenu mobile />
            </motion.div>
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