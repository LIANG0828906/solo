import { useAuth } from './useAuth';
import { useCallback } from 'react';

interface ApiOptions extends RequestInit {
  requireAuth?: boolean;
}

export const useApi = () => {
  const { token, logout } = useAuth();

  const request = useCallback(
    async <T>(url: string, options: ApiOptions = {}): Promise<T> => {
      const { requireAuth = true, headers, ...rest } = options;
      const finalHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(headers as Record<string, string>),
      };
      if (requireAuth && token) {
        finalHeaders['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(url, {
        ...rest,
        headers: finalHeaders,
      });
      if (response.status === 401 && requireAuth) {
        logout();
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }
      return data as T;
    },
    [token, logout]
  );

  return { request };
};
