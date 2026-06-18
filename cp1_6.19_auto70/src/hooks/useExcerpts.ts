import { useState, useEffect, useCallback } from 'react';
import type { BookCategory, Excerpt, SortOption } from '../types';
import { loadExcerpts, saveExcerpts, generateId } from '../utils/storage';
import { extractKeywords, getRandomColor } from '../utils/textSimilarity';
import toast from 'react-hot-toast';

export function useExcerpts() {
  const [excerpts, setExcerpts] = useState<Excerpt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const data = loadExcerpts();
    setExcerpts(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      saveExcerpts(excerpts);
    }
  }, [excerpts, isLoading]);

  const addExcerpt = useCallback(
    (data: {
      bookTitle: string;
      author: string;
      content: string;
      annotation: string;
      category: BookCategory;
    }) => {
      const tags = extractKeywords(data.content, 5);
      const now = Date.now();
      const newExcerpt: Excerpt = {
        id: generateId(),
        bookTitle: data.bookTitle.trim(),
        author: data.author.trim(),
        content: data.content.trim(),
        annotation: data.annotation.trim(),
        category: data.category,
        tags,
        images: [],
        color: getRandomColor(data.category),
        createdAt: now,
        updatedAt: now,
      };
      setExcerpts((prev) => [newExcerpt, ...prev]);
      toast.success('书摘已添加');
      return newExcerpt;
    },
    []
  );

  const updateExcerpt = useCallback(
    (id: string, updates: Partial<Omit<Excerpt, 'id' | 'createdAt'>>) => {
      setExcerpts((prev) =>
        prev.map((e) => {
          if (e.id !== id) return e;
          let tags = e.tags;
          if (updates.content && updates.content !== e.content) {
            tags = extractKeywords(updates.content, 5);
          }
          let color = e.color;
          if (updates.category && updates.category !== e.category) {
            color = getRandomColor(updates.category);
          }
          return { ...e, ...updates, tags, color, updatedAt: Date.now() };
        })
      );
      toast.success('已更新');
    },
    []
  );

  const deleteExcerpt = useCallback((id: string) => {
    setDeletingId(id);
    setTimeout(() => {
      setExcerpts((prev) => prev.filter((e) => e.id !== id));
      setDeletingId(null);
      toast.success('已删除');
    }, 400);
  }, []);

  const addImage = useCallback((id: string, imageUrl: string) => {
    setExcerpts((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        if (e.images.length >= 5) {
          toast.error('最多5张图片');
          return e;
        }
        return { ...e, images: [...e.images, imageUrl], updatedAt: Date.now() };
      })
    );
  }, []);

  const removeImage = useCallback((id: string, index: number) => {
    setExcerpts((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        return {
          ...e,
          images: e.images.filter((_, i) => i !== index),
          updatedAt: Date.now(),
        };
      })
    );
  }, []);

  const sortExcerpts = useCallback(
    (list: Excerpt[], sortBy: SortOption): Excerpt[] => {
      const sorted = [...list];
      switch (sortBy) {
        case 'newest':
          return sorted.sort((a, b) => b.createdAt - a.createdAt);
        case 'oldest':
          return sorted.sort((a, b) => a.createdAt - b.createdAt);
        case 'title':
          return sorted.sort((a, b) => a.bookTitle.localeCompare(b.bookTitle, 'zh'));
        default:
          return sorted;
      }
    },
    []
  );

  const filterByTag = useCallback((list: Excerpt[], tag: string | null): Excerpt[] => {
    if (!tag) return list;
    return list.filter((e) => e.tags.includes(tag));
  }, []);

  const searchExcerpts = useCallback((list: Excerpt[], query: string): Excerpt[] => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((e) => {
      return (
        e.bookTitle.toLowerCase().includes(q) ||
        e.author.toLowerCase().includes(q) ||
        e.content.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, []);

  return {
    excerpts,
    isLoading,
    deletingId,
    addExcerpt,
    updateExcerpt,
    deleteExcerpt,
    addImage,
    removeImage,
    sortExcerpts,
    filterByTag,
    searchExcerpts,
  };
}
