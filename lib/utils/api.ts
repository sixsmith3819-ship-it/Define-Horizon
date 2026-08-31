/**
 * Utility functions for making authenticated API requests
 */

/**
 * Get the authentication token from localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

/**
 * Make an authenticated fetch request
 * @param url - The API endpoint URL
 * @param options - Standard fetch options
 * @returns Promise with the fetch response
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAuthToken();

  if (!token) {
    throw new Error('Authentication required - Please log in again');
  }

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Handle API response with error parsing
 * @param response - The fetch response
 * @returns Promise with the parsed JSON data
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || `Request failed with status ${response.status}`);
  }

  return response.json();
}

/**
 * Make an authenticated API request with automatic error handling
 * @param url - The API endpoint URL
 * @param options - Standard fetch options
 * @returns Promise with the parsed response data
 */
export async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await authenticatedFetch(url, options);
  return handleApiResponse<T>(response);
}