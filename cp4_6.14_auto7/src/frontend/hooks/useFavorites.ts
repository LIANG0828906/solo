import { useState, useEffect, useCallback } from 'react';

const FAVORITES_KEY = 'code_snippet_favorites';

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favoriteIds)));
    } catch {
      console.error('Failed to save favorites to localStorage');
    }
  }, [favoriteIds]);

  const isFavorite = useCallback(
    (id: string) => favoriteIds.has(id),
    [favoriteIds]
  );

  const addFavorite = useCallback((id: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const removeFavorite = useCallback((id: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const toggleFavorite = useCallback(
    (id: string) => {
      if (favoriteIds.has(id)) {
        removeFavorite(id);
        return false;
      } else {
        addFavorite(id);
        return true;
      }
    },
    [favoriteIds, addFavorite, removeFavorite]
  );

  return {
    favoriteIds: Array.from(favoriteIds),
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
  };
}
