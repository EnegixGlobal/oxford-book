'use client';

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isTokenExpired, getToken } from '@/lib/utils';
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
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, phone?: string, address?: string) => Promise<boolean>;
  logout: () => void;
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
    // Clear all user-related data from localStorage
    localStorage.removeItem('bookhaven-user');
    localStorage.removeItem('bookhaven-token');
    localStorage.removeItem('bookhaven-shipping');
    localStorage.removeItem('bookhaven-cart');
    
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

  // Validate token by checking with the server
  const validateToken = async (): Promise<boolean> => {
    const token = getToken();
    
    // Check if token exists and is not expired
    if (!token || isTokenExpired(token)) {
      return false;
    }

    try {
      const response = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        cache: 'no-store'
      });

      if (response.status === 401) {
        return false;
      }

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  };

  useEffect(() => {
    // Check if user is logged in on mount and validate token
    const initAuth = async () => {
      const savedUser = localStorage.getItem('bookhaven-user');
      const token = getToken();
      
      if (savedUser && token) {
        // Check if token is expired client-side first
        if (isTokenExpired(token)) {
          handleSessionExpired(JSON.parse(savedUser).role === 'admin');
          setLoading(false);
          return;
        }

        // Validate token with server
        const isValid = await validateToken();
        if (isValid) {
          setUser(JSON.parse(savedUser));
        } else {
          handleSessionExpired(JSON.parse(savedUser).role === 'admin');
        }
      }
      
      setLoading(false);
    };

    initAuth();

    // Listen for session expired events (from fetch interceptor)
    const handleSessionExpiredEvent = () => {
      const currentUser = JSON.parse(localStorage.getItem('bookhaven-user') || 'null');
      if (currentUser) {
        handleSessionExpired(currentUser.role === 'admin');
      }
    };

    window.addEventListener('session-expired', handleSessionExpiredEvent);

    return () => {
      window.removeEventListener('session-expired', handleSessionExpiredEvent);
    };
  }, [handleSessionExpired]);

  // Set up periodic token validation (check every 5 minutes)
  useEffect(() => {
    if (!user) return;

    intervalRef.current = setInterval(async () => {
      const currentUser = user; // Capture current user value
      const token = getToken();
      if (!token || isTokenExpired(token)) {
        handleSessionExpired(currentUser.role === 'admin');
        return;
      }

      const isValid = await validateToken();
      if (!isValid) {
        handleSessionExpired(currentUser.role === 'admin');
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user, handleSessionExpired]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
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
        localStorage.setItem('bookhaven-user', JSON.stringify(userData));
        localStorage.setItem('bookhaven-token', data.token);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
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
        body: JSON.stringify({ name, email, password, phone, address }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Check if token exists (it should for successful registration)
        if (!data.token) {
          console.error('Registration successful but no token received');
          toast.error('Registration successful, but failed to log in. Please try logging in manually.');
          return false;
        }

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
        localStorage.setItem('bookhaven-user', JSON.stringify(userData));
        localStorage.setItem('bookhaven-token', data.token);
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

  const logout = () => {
    const wasAdmin = user?.role === 'admin';
    setUser(null);
    // Clear all user-related data from localStorage
    localStorage.removeItem('bookhaven-user');
    localStorage.removeItem('bookhaven-token');
    localStorage.removeItem('bookhaven-shipping');
    localStorage.removeItem('bookhaven-cart');
    
    // Dispatch event to clear wishlist (WishlistProvider will listen)
    window.dispatchEvent(new CustomEvent('user-logged-out'));
    
    // Clear validation interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
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