'use client';

import { useEffect } from 'react';
import { isTokenExpired, getToken } from '@/lib/utils';

/**
 * Global fetch interceptor component
 * Intercepts all fetch requests and handles 401 responses
 */
export default function FetchInterceptor() {
  useEffect(() => {
    // Store original fetch
    const originalFetch = window.fetch;

    // Override fetch
    window.fetch = async function (...args) {
      // Check token expiration before making request
      const token = getToken();
      if (token && isTokenExpired(token)) {
        // Token expired - dispatch event
        window.dispatchEvent(new CustomEvent('session-expired'));
      }

      // Call original fetch
      const response = await originalFetch(...args);

      // Check for 401 status after response
      if (response.status === 401) {
        const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
        const options = args[1] || {};
        const headers = options.headers || {};
        
        // Skip login/signup endpoints
        if (url.includes('/api/auth/login') || url.includes('/api/auth/signup')) {
          return response;
        }

        // Check if this request had an authorization header
        let hasAuthHeader = false;
        if (headers instanceof Headers) {
          hasAuthHeader = headers.has('Authorization') || headers.has('authorization');
        } else if (typeof headers === 'object') {
          const headerObj = headers as Record<string, string>;
          hasAuthHeader = !!(headerObj['Authorization'] || headerObj['authorization']);
        }

        // Dispatch session expired event for:
        // 1. Requests with Authorization header
        // 2. API routes (excluding auth routes)
        if (hasAuthHeader || (url.startsWith('/api/') && !url.includes('/api/auth/'))) {
          window.dispatchEvent(new CustomEvent('session-expired'));
        }
      }

      return response;
    };

    // Cleanup: restore original fetch
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}

