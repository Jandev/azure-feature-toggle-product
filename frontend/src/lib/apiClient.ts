/**
 * API Client Utility
 * Handles all HTTP requests to the backend API with authentication
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

console.log('[ApiClient] API_BASE_URL configured as:', API_BASE_URL);

export class ApiError extends Error {
  status: number;
  response?: unknown;

  constructor(message: string, status: number, response?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.response = response;
  }
}

interface RequestOptions extends RequestInit {
  token?: string;
  customHeaders?: Record<string, string>;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, customHeaders, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
    ...(customHeaders || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`[ApiClient] ${fetchOptions.method || 'GET'} ${url}`);

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  console.log(`[ApiClient] Response: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    let errorData: unknown;

    try {
      errorData = await response.json();
      console.error('[ApiClient] Error response:', errorData);
      if (errorData && typeof errorData === 'object' && 'message' in errorData) {
        errorMessage = String((errorData as { message: string }).message);
      }
    } catch {
      // If response is not JSON, use the default error message
    }

    throw new ApiError(errorMessage, response.status, errorData);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json();
  console.log('[ApiClient] Response data:', data);
  return data;
}

export const apiClient = {
  get: <T>(endpoint: string, token?: string, customHeaders?: Record<string, string>) =>
    request<T>(endpoint, { method: 'GET', token, customHeaders }),

  post: <T>(endpoint: string, data?: unknown, token?: string) =>
    request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      token,
    }),

  put: <T>(endpoint: string, data?: unknown, token?: string) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      token,
    }),

  delete: <T>(endpoint: string, token?: string) =>
    request<T>(endpoint, { method: 'DELETE', token }),
};
