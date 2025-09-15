'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, User, Search, Menu, X, LogOut, Shield } from 'lucide-react';
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

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { getTotalItems } = useCart();
  const { user, logout } = useAuth();

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
                <div className="flex items-center space-x-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        <span className="hidden sm:inline max-w-[120px] truncate text-left">{user.name}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel className="text-xs font-medium text-gray-500">Account</DropdownMenuLabel>
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
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={logout} className="flex items-center gap-2 text-red-600 focus:text-red-700">
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

      </header>

      {/* Mobile Side Drawer & Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Overlay */}
            <motion.button
              key="overlay"
              aria-label="Close navigation menu"
              className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              key="drawer"
              id="mobile-nav-drawer"
              role="dialog"
              aria-modal="true"
              className="fixed top-0 left-0 h-full w-72 max-w-full bg-white shadow-xl z-50 flex flex-col lg:hidden"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'tween', duration: 0.28 }}
            >
              <div className="flex items-center justify-between px-4 h-16 border-b">
                <Link href="/" className="flex items-center space-x-2" onClick={() => setIsMenuOpen(false)}>
                  <Image src="/oxford-logo.png" alt="Oxford Logo" width={110} height={36} className="h-9 w-auto" />
                </Link>
                <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(false)}>
                  <X className="w-5 h-5" />
                  <span className="sr-only">Close menu</span>
                </Button>
              </div>
              <div className="overflow-y-auto flex-1">
                <NavigationMenu mobile />
              </div>
              <div className="p-4 border-t space-y-2">
                {user ? (
                  <>
                    <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="block w-full text-left text-sm font-medium text-gray-700 hover:text-purple-600">Profile</Link>
                    {user.role === 'admin' && (
                      <Link href="/admin" onClick={() => setIsMenuOpen(false)} className="block w-full text-left text-sm font-medium text-gray-700 hover:text-purple-600">Admin Dashboard</Link>
                    )}
                    <button
                      onClick={() => { logout(); setIsMenuOpen(false); }}
                      className="w-full text-left text-sm font-medium text-red-600 hover:text-red-700"
                    >Logout</button>
                  </>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full"
                    onClick={() => { setIsAuthModalOpen(true); setIsMenuOpen(false); }}
                  >Login / Register</Button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
};

export default Header;