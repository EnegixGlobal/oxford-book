'use client';

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  phone?: string;
  address?: string;
  joinDate: string;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  register: (name: string, email: string, password: string, phone?: string, address?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Handle session expiration - clear session and redirect to login
  const handleSessionExpired = useCallback((isAdmin: boolean = false) => {
    setUser(null);
    // Clear user data from localStorage (keep cart/shipping for guest checkout)
    const savedCart = localStorage.getItem('bookhaven-cart');
    const savedShipping = localStorage.getItem('bookhaven-shipping');
    localStorage.clear();
    if (savedCart) localStorage.setItem('bookhaven-cart', savedCart);
    if (savedShipping) localStorage.setItem('bookhaven-shipping', savedShipping);
    
    // Dispatch event to clear wishlist (WishlistProvider will listen)
    window.dispatchEvent(new CustomEvent('user-logged-out'));
    
    // Show notification
    toast.error('Your session has expired. Please log in again.');
    
    // Redirect to appropriate login page
    if (isAdmin || pathname?.startsWith('/admin')) {
      router.push('/admin');
    } else {
      router.push('/');
    }
  }, [pathname, router]);

  // Validate session by checking with the server (cookies are sent automatically)
  const validateSession = async (): Promise<User | null> => {
    try {
      const response = await fetch('/api/auth/profile', {
        credentials: 'include', // Important: Send cookies
        cache: 'no-store'
      });

      if (response.status === 401) {
        return null;
      }

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          return {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role,
            phone: data.user.phone,
            address: data.user.address,
            joinDate: data.user.joinDate,
            isActive: data.user.isActive,
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Session validation error:', error);
      return null;
    }
  };

  useEffect(() => {
    // Check if user is logged in on mount by validating session
    const initAuth = async () => {
      const userData = await validateSession();
      if (userData) {
        setUser(userData);
        // Store user data in localStorage for quick access (not sensitive)
        localStorage.setItem('bookhaven-user', JSON.stringify(userData));
      }
      
      setLoading(false);
    };

    initAuth();

    // Listen for session expired events (from fetch interceptor)
    const handleSessionExpiredEvent = () => {
      const currentUser = user || JSON.parse(localStorage.getItem('bookhaven-user') || 'null');
      const isAdmin = currentUser?.role === 'admin' || pathname?.startsWith('/admin') || false;
      handleSessionExpired(isAdmin);
    };

    window.addEventListener('session-expired', handleSessionExpiredEvent);

    return () => {
      window.removeEventListener('session-expired', handleSessionExpiredEvent);
    };
  }, [handleSessionExpired, pathname]);

  // Set up periodic session validation (check every 5 minutes)
  useEffect(() => {
    if (!user) return;

    intervalRef.current = setInterval(async () => {
      const currentUser = user; // Capture current user value
      const userData = await validateSession();
      if (!userData) {
        handleSessionExpired(currentUser.role === 'admin');
      } else {
        // Update user data if changed
        setUser(userData);
        localStorage.setItem('bookhaven-user', JSON.stringify(userData));
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user, handleSessionExpired]);

  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<boolean> => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: Receive cookies
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const userData = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          phone: data.user.phone,
          address: data.user.address,
          joinDate: data.user.joinDate,
          isActive: data.user.isActive,
        };
        
        setUser(userData);
        // Store user data in localStorage for quick access (cookie is HTTP-only)
        localStorage.setItem('bookhaven-user', JSON.stringify(userData));
        return true;
      }
      
      // Show error message
      if (data.message) {
        toast.error(data.message);
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, phone?: string, address?: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: Receive cookies
        body: JSON.stringify({ name, email, password, phone, address }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const userData = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          phone: data.user.phone,
          address: data.user.address,
          joinDate: data.user.joinDate,
          isActive: data.user.isActive,
        };
        
        setUser(userData);
        // Store user data in localStorage for quick access (cookie is HTTP-only)
        localStorage.setItem('bookhaven-user', JSON.stringify(userData));
        return true;
      }
      
      // If response not ok, show error message from server
      const errorMessage = data.message || 'Registration failed';
      toast.error(errorMessage);
      if (data.errors && Array.isArray(data.errors)) {
        // Show validation errors if present
        data.errors.forEach((err: any) => {
          if (err.message) {
            toast.error(err.message);
          }
        });
      }
      
      return false;
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const wasAdmin = user?.role === 'admin';
    
    // Clear validation interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    try {
      // Call logout endpoint to clear session in MongoDB and cookie
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include', // Send cookies
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    setUser(null);
    // Clear user data from localStorage (keep cart/shipping for guest checkout)
    const savedCart = localStorage.getItem('bookhaven-cart');
    const savedShipping = localStorage.getItem('bookhaven-shipping');
    localStorage.clear();
    if (savedCart) localStorage.setItem('bookhaven-cart', savedCart);
    if (savedShipping) localStorage.setItem('bookhaven-shipping', savedShipping);
    
    // Dispatch event to clear wishlist (WishlistProvider will listen)
    window.dispatchEvent(new CustomEvent('user-logged-out'));
    
    // If on admin pages or admin just logged out, redirect home
    try {
      if (pathname?.startsWith('/admin') || wasAdmin) {
        router.push('/');
      }
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;