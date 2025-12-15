'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type { Book } from '@/lib/sampleData';
import { useAuth } from './AuthProvider';

interface CartItem extends Book {
  quantity: number;
  // ensure every cart item has a stable id even if source book used _id
  id: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (book: Book) => void;
  removeFromCart: (bookId: string) => void;
  updateQuantity: (bookId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: React.ReactNode;
}

const CartProvider = ({ children }: CartProviderProps) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const syncingRef = useRef(false);
  const lastSyncedCartRef = useRef<string>('');
  const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('bookhaven-token') : null);

  // Helper to convert server cart items to CartItem format
  const normalizeCartItem = (item: any): CartItem => {
    return {
      ...item,
      id: item.bookId || item.id || item._id || '',
      discountedPrice: item.price || item.discountedPrice || 0,
      mrp: item.mrp || item.price || 0,
    } as CartItem;
  };

  // Merge two carts intelligently (prefer server data, but merge quantities)
  const mergeCarts = (serverCart: any[], localCart: CartItem[]): CartItem[] => {
    const mergedMap = new Map<string, CartItem>();

    // First, add all server cart items
    serverCart.forEach(item => {
      const normalized = normalizeCartItem(item);
      mergedMap.set(normalized.id, normalized);
    });

    // Then, merge with local cart (add items not in server, or update quantities if different)
    localCart.forEach(localItem => {
      const existing = mergedMap.get(localItem.id);
      if (existing) {
        // Item exists in both - use server data but merge quantity if local is higher
        if (localItem.quantity > existing.quantity) {
          existing.quantity = localItem.quantity;
        }
      } else {
        // Item only in local cart - add it
        mergedMap.set(localItem.id, localItem);
      }
    });

    return Array.from(mergedMap.values());
  };

  // Load cart from server
  const loadCartFromServer = useCallback(async (): Promise<CartItem[]> => {
    const token = getToken();
    if (!token || !user) return [];

    try {
      const response = await fetch('/api/profile/cart', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          return data.data.map(normalizeCartItem);
        }
      }
    } catch (error) {
      console.error('Failed to load cart from server:', error);
    }
    return [];
  }, [user]);

  // Sync cart to server
  const syncCartToServer = useCallback(async (items: CartItem[]) => {
    if (!user || syncingRef.current) return;

    const token = getToken();
    if (!token) return;

    syncingRef.current = true;
    try {
      const payload = items.map(item => ({
        bookId: item.id,
        title: item.title || '',
        price: item.discountedPrice || (item as any).price || 0,
        quantity: item.quantity,
        coverImage: item.coverImage || '',
        authorName: (item as any).authorName || '',
        isbn: (item as any).isbn || ''
      }));

      await fetch('/api/profile/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ items: payload })
      });
    } catch (error) {
      console.error('Failed to sync cart to server:', error);
    } finally {
      syncingRef.current = false;
    }
  }, [user]);

  // Load cart on mount and when user changes
  useEffect(() => {
    const loadCart = async () => {
      setIsLoading(true);
      
      if (user) {
        // User is logged in - fetch fresh from backend DB
        const serverCart = await loadCartFromServer();
        
        setCartItems(serverCart);
        
        // Store in localStorage for fast access
        localStorage.setItem('bookhaven-cart', JSON.stringify(serverCart));
        lastSyncedCartRef.current = JSON.stringify(serverCart.map(i => ({ id: i.id, qty: i.quantity })).sort((a, b) => a.id.localeCompare(b.id)));
      } else {
        // User not logged in - clear cart
        setCartItems([]);
        localStorage.removeItem('bookhaven-cart');
        lastSyncedCartRef.current = '';
      }
      
      setIsLoading(false);
    };

    loadCart();
  }, [user, loadCartFromServer]);

  // Listen for logout events to clear cart
  useEffect(() => {
    const handleLogout = () => {
      setCartItems([]);
      localStorage.removeItem('bookhaven-cart');
      lastSyncedCartRef.current = '';
    };

    window.addEventListener('user-logged-out', handleLogout);
    return () => window.removeEventListener('user-logged-out', handleLogout);
  }, []);

  // Save cart to localStorage whenever it changes and sync to server
  useEffect(() => {
    if (isLoading || !user) return;
    
    // Store in localStorage for fast access
    localStorage.setItem('bookhaven-cart', JSON.stringify(cartItems));
    
    // Sync to server if user is logged in (debounce slightly to avoid too many requests)
    const currentCartStr = JSON.stringify(cartItems.map(i => ({ id: i.id, qty: i.quantity })).sort((a, b) => a.id.localeCompare(b.id)));
    
    // Only sync if cart actually changed
    if (currentCartStr !== lastSyncedCartRef.current) {
      const timeoutId = setTimeout(() => {
        syncCartToServer(cartItems).then(() => {
          lastSyncedCartRef.current = currentCartStr;
        });
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [cartItems, user, isLoading, syncCartToServer]);

  const addToCart = (book: Book | (Book & { _id?: any })) => {
    setCartItems(prevItems => {
      // derive a stable id (support backend _id or isbn fallback)
      const rawId: any = (book as any).id ?? (book as any)._id ?? (book as any).isbn;
      const normalizedId = typeof rawId === 'string' ? rawId : rawId?.toString?.() || `tmp-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

      const existingItem = prevItems.find(item => item.id === normalizedId);
      if (existingItem) {
        toast.success(`Updated quantity for "${book.title}"`);
        return prevItems.map(item =>
          item.id === normalizedId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      toast.success(`"${book.title}" added to cart`);
      // ensure we store the normalized id even if original lacked id
      return [...prevItems, { ...book, id: normalizedId, quantity: 1 } as CartItem];
    });
  };

  // One-time normalization for any legacy items without id (to avoid merging)
  useEffect(() => {
    setCartItems(prev => {
      let changed = false;
      const mapped = prev.map(it => {
        if (!it.id) {
          changed = true;
          return { ...it, id: `fix-${Date.now()}-${Math.random().toString(36).slice(2,8)}` };
        }
        return it;
      });
      return changed ? mapped : prev;
    });
  }, []);

  const removeFromCart = (bookId: string) => {
    setCartItems(prevItems => {
      const item = prevItems.find(item => item.id === bookId);
      if (item) {
        toast.success(`"${item.title}" removed from cart`);
      }
      return prevItems.filter(item => item.id !== bookId);
    });
  };

  const updateQuantity = (bookId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(bookId);
      return;
    }

    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === bookId 
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = useCallback(async () => {
    setCartItems([]);
    localStorage.removeItem('bookhaven-cart');
    lastSyncedCartRef.current = '';
    
    // Clear cart on server if user is logged in
    if (user) {
      const token = getToken();
      if (token) {
        try {
          await fetch('/api/profile/cart', {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (error) {
          console.error('Failed to clear cart on server:', error);
        }
      }
    }
    
    toast.success('Cart cleared');
  }, [user]);

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.discountedPrice * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalPrice,
        getTotalItems
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;