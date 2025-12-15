"use client";
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthProvider';

interface WishlistContextType {
  wishlist: string[]; // store book ids
  loading: boolean;
  add: (bookId: string) => Promise<void>;
  remove: (bookId: string) => Promise<void>;
  toggle: (bookId: string) => Promise<void>;
  has: (bookId: string) => boolean;
  refresh: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
};

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  // NOTE: token may change after login; fetch fresh inside each request instead of capturing stale value.
  const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('bookhaven-token') : null);

  const refresh = useCallback(async () => {
    if (!user) { 
      setWishlist([]);
      return;
    }
    try {
      setLoading(true);
      const token = getToken();
      if (!token) { 
        setWishlist([]);
        return; 
      }
      // Fetch fresh from backend DB
      const res = await fetch('/api/profile/wishlist', { 
        headers: { Authorization: `Bearer ${token}` }, 
        cache: 'no-store' 
      });
      const json = await res.json();
      if (json?.success && Array.isArray(json.data)) {
        // Data could be populated Book documents or just IDs if changed later
        const ids = json.data.map((b: any) => b._id || b.id || b);
        setWishlist(ids);
      } else {
        setWishlist([]);
      }
    } catch {
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  // Listen for logout events to clear wishlist
  useEffect(() => {
    const handleLogout = () => {
      setWishlist([]);
    };

    window.addEventListener('user-logged-out', handleLogout);
    return () => window.removeEventListener('user-logged-out', handleLogout);
  }, []);

  const add = async (bookId: string) => {
    if (!user) { toast.error('Please login to save wishlist'); return; }
    try {
  const token = getToken();
  if (!token) { toast.error('Session expired. Please login again.'); return; }
  const res = await fetch('/api/profile/wishlist', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ bookId }) });
      const json = await res.json();
      if (json.success) {
        setWishlist(prev => prev.includes(bookId) ? prev : [...prev, bookId]);
        toast.success('Added to wishlist');
      } else toast.error(json.message || 'Failed to add');
    } catch { toast.error('Failed to add'); }
  };

  const remove = async (bookId: string) => {
    if (!user) return;
    try {
  const token = getToken();
  if (!token) { toast.error('Session expired. Please login again.'); return; }
  const res = await fetch('/api/profile/wishlist', { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ bookId }) });
      const json = await res.json();
      if (json.success) {
        setWishlist(prev => prev.filter(id => id !== bookId));
        toast.message('Removed from wishlist');
      } else toast.error(json.message || 'Failed to remove');
    } catch { toast.error('Failed to remove'); }
  };

  const toggle = async (bookId: string) => {
    if (wishlist.includes(bookId)) return remove(bookId);
    return add(bookId);
  };

  const has = (bookId: string) => wishlist.includes(bookId);

  return (
    <WishlistContext.Provider value={{ wishlist, loading, add, remove, toggle, has, refresh }}>
      {children}
    </WishlistContext.Provider>
  );
};
