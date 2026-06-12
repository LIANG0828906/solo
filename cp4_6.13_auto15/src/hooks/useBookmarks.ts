import { useState, useEffect, useCallback } from 'react';
import { bookmarkApi } from '@/api/bookmarkApi';
import type { BookMark, CreateBookmarkDto, UpdateBookmarkDto } from '@/types';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookMark[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookmarks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bookmarkApi.getAll();
      setBookmarks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const addBookmark = useCallback(async (data: CreateBookmarkDto) => {
    setError(null);
    try {
      const newBookmark = await bookmarkApi.create(data);
      setBookmarks((prev) => [newBookmark, ...prev]);
      return newBookmark;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }, []);

  const updateBookmark = useCallback(async (id: string, data: UpdateBookmarkDto) => {
    setError(null);
    try {
      const updated = await bookmarkApi.update(id, data);
      setBookmarks((prev) =>
        prev.map((b) => (b.id === id ? updated : b))
      );
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }, []);

  const deleteBookmark = useCallback(async (id: string) => {
    setError(null);
    try {
      await bookmarkApi.delete(id);
      setBookmarks((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }, []);

  const getBookmarkById = useCallback(
    (id: string) => {
      return bookmarks.find((b) => b.id === id);
    },
    [bookmarks]
  );

  const allTags = Array.from(new Set(bookmarks.flatMap((b) => b.tags)));

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  return {
    bookmarks,
    loading,
    error,
    allTags,
    fetchBookmarks,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    getBookmarkById,
  };
}
