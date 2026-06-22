import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import axios from 'axios';
import type { Snippet, CreateSnippetRequest, ToastMessage } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface CollectionContextValue {
  snippets: Snippet[];
  allTags: string[];
  searchQuery: string;
  selectedTags: string[];
  sortBy: 'createdAt_desc' | 'createdAt_asc' | 'title_asc';
  toasts: ToastMessage[];
  loading: boolean;
  filteredSnippets: Snippet[];
  setSearchQuery: (q: string) => void;
  setSelectedTags: (tags: string[]) => void;
  setSortBy: (s: 'createdAt_desc' | 'createdAt_asc' | 'title_asc') => void;
  toggleTag: (tag: string) => void;
  createSnippet: (req: CreateSnippetRequest) => Promise<Snippet | null>;
  deleteSnippet: (id: string) => Promise<boolean>;
  refreshSnippets: () => Promise<void>;
  refreshTags: () => Promise<void>;
  showToast: (message: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
}

const CollectionContext = createContext<CollectionContextValue | undefined>(undefined);

export const CollectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'createdAt_desc' | 'createdAt_asc' | 'title_asc'>('createdAt_desc');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'success') => {
    const id = uuidv4();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refreshSnippets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get<Snippet[]>('/api/snippets');
      setSnippets(res.data);
    } catch (err) {
      console.error('Failed to load snippets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshTags = useCallback(async () => {
    try {
      const res = await axios.get<string[]>('/api/tags');
      setAllTags(res.data);
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  }, []);

  useEffect(() => {
    refreshSnippets();
    refreshTags();
  }, [refreshSnippets, refreshTags]);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const createSnippet = useCallback(async (req: CreateSnippetRequest): Promise<Snippet | null> => {
    try {
      const res = await axios.post<Snippet>('/api/snippets', req);
      if (res.status === 201) {
        setSnippets((prev) => [res.data, ...prev]);
        await refreshTags();
        return res.data;
      }
      return null;
    } catch (err) {
      console.error('Failed to create snippet:', err);
      showToast('保存失败', 'error');
      return null;
    }
  }, [refreshTags, showToast]);

  const deleteSnippet = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await axios.delete(`/api/snippets/${id}`);
      if (res.status === 204) {
        setSnippets((prev) => prev.filter((s) => s.id !== id));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to delete snippet:', err);
      showToast('删除失败', 'error');
      return false;
    }
  }, [showToast]);

  const filteredSnippets = useMemo(() => {
    let result = [...snippets];

    if (searchQuery.trim()) {
      const keyword = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(keyword) ||
          s.plainText.toLowerCase().includes(keyword)
      );
    }

    if (selectedTags.length > 0) {
      result = result.filter((s) =>
        selectedTags.every((t) => s.tags.includes(t))
      );
    }

    switch (sortBy) {
      case 'createdAt_asc':
        result.sort((a, b) => a.createdAt - b.createdAt);
        break;
      case 'title_asc':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'createdAt_desc':
      default:
        result.sort((a, b) => b.createdAt - a.createdAt);
    }

    return result;
  }, [snippets, searchQuery, selectedTags, sortBy]);

  const value = useMemo<CollectionContextValue>(
    () => ({
      snippets,
      allTags,
      searchQuery,
      selectedTags,
      sortBy,
      toasts,
      loading,
      filteredSnippets,
      setSearchQuery,
      setSelectedTags,
      setSortBy,
      toggleTag,
      createSnippet,
      deleteSnippet,
      refreshSnippets,
      refreshTags,
      showToast,
      removeToast,
    }),
    [
      snippets,
      allTags,
      searchQuery,
      selectedTags,
      sortBy,
      toasts,
      loading,
      filteredSnippets,
      toggleTag,
      createSnippet,
      deleteSnippet,
      refreshSnippets,
      refreshTags,
      showToast,
      removeToast,
    ]
  );

  return (
    <CollectionContext.Provider value={value}>
      {children}
    </CollectionContext.Provider>
  );
};

export const useCollection = (): CollectionContextValue => {
  const ctx = useContext(CollectionContext);
  if (!ctx) {
    throw new Error('useCollection must be used within CollectionProvider');
  }
  return ctx;
};

export default CollectionContext;
