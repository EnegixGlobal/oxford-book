'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { Book } from '@/lib/sampleData';

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
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('bookhaven-cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('bookhaven-cart', JSON.stringify(cartItems));
  }, [cartItems]);

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

  const clearCart = () => {
    setCartItems([]);
    toast.success('Cart cleared');
  };

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