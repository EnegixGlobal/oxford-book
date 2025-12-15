/**
 * Utility functions for making authenticated API requests
 */

import { getToken, isTokenExpired } from './utils';

/**
 * Wrapper for fetch that automatically handles authentication and token expiration
 * Redirects to login page on 401 responses
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();
  
  // Check if token is expired before making request
  if (token && isTokenExpired(token)) {
    // Token expired - trigger logout
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('session-expired');
      window.dispatchEvent(event);
    }
    
    return new Response(
      JSON.stringify({ success: false, message: 'Token expired' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Add authorization header if token exists
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 responses (unauthorized/expired token)
  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('session-expired');
      window.dispatchEvent(event);
    }
  }

  return response;
}

/**
 * Get headers with authentication token
 */
export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

