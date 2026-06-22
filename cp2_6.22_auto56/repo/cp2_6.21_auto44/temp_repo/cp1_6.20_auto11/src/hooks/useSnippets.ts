import { useState, useEffect, useCallback, useRef } from 'react';
import type { Snippet, CreateSnippetDto } from '../types';

const PAGE_SIZE = 20;

export function useSnippets(search: string, tag: string, lang: string) {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(1);
  const loadingRef = useRef(false);

  const fetchSnippets = useCallback(async (reset = false) => {
    if (loadingRef.current) return;
    
    const page = reset ? 1 : pageRef.current;
    if (reset) {
      pageRef.current = 1;
    }

    loadingRef.current = true;
    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (search) params.append('search', search);
      if (tag) params.append('tag', tag);
      if (lang) params.append('lang', lang);

      const res = await fetch(`/api/snippets?${params.toString()}`);
      const data = await res.json();

      if (reset) {
        setSnippets(data.snippets);
      } else {
        setSnippets(prev => [...prev, ...data.snippets]);
      }
      
      setHasMore(data.hasMore);
      pageRef.current = page + 1;
    } catch (err) {
      console.error('Failed to fetch snippets:', err);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [search, tag, lang]);

  useEffect(() => {
    setSnippets([]);
    setHasMore(true);
    pageRef.current = 1;
    loadingRef.current = false;
    fetchSnippets(true);
  }, [search, tag, lang, fetchSnippets]);

  const loadMore = useCallback(() => {
    if (!loadingRef.current && hasMore) {
      fetchSnippets(false);
    }
  }, [hasMore, fetchSnippets]);

  const createSnippet = useCallback(async (dto: CreateSnippetDto): Promise<Snippet | null> => {
    try {
      const res = await fetch('/api/snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      if (res.ok) {
        const snippet: Snippet = await res.json();
        setSnippets(prev => [snippet, ...prev]);
        return snippet;
      }
    } catch (err) {
      console.error('Failed to create snippet:', err);
    }
    return null;
  }, []);

  const likeSnippet = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/snippets/${id}/like`, { method: 'POST' });
      if (res.ok) {
        const updated: Snippet = await res.json();
        setSnippets(prev => prev.map(s => s.id === id ? updated : s));
        return updated;
      }
    } catch (err) {
      console.error('Failed to like snippet:', err);
    }
    return null;
  }, []);

  const favoriteSnippet = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/snippets/${id}/favorite`, { method: 'POST' });
      if (res.ok) {
        const updated: Snippet = await res.json();
        setSnippets(prev => prev.map(s => s.id === id ? updated : s));
        return updated;
      }
    } catch (err) {
      console.error('Failed to favorite snippet:', err);
    }
    return null;
  }, []);

  return {
    snippets,
    loading,
    hasMore,
    loadMore,
    createSnippet,
    likeSnippet,
    favoriteSnippet,
  };
}

export function useFavorites() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFavorites = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/snippets?favorites=true');
        const data = await res.json();
        setSnippets(data.snippets);
      } catch (err) {
        console.error('Failed to fetch favorites:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
  }, []);

  const favoriteSnippet = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/snippets/${id}/favorite`, { method: 'POST' });
      if (res.ok) {
        const updated: Snippet = await res.json();
        if (!updated.isFavorited) {
          setSnippets(prev => prev.filter(s => s.id !== id));
        }
        return updated;
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
    return null;
  }, []);

  return { snippets, loading, favoriteSnippet };
}

export function useSnippetDetail(id: string) {
  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/snippets/${id}`);
        if (res.ok) {
          const data: Snippet = await res.json();
          setSnippet(data);
        }
      } catch (err) {
        console.error('Failed to fetch snippet detail:', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDetail();
  }, [id]);

  const likeSnippet = useCallback(async (snippetId: string) => {
    try {
      const res = await fetch(`/api/snippets/${snippetId}/like`, { method: 'POST' });
      if (res.ok) {
        const updated: Snippet = await res.json();
        setSnippet(updated);
        return updated;
      }
    } catch (err) {
      console.error('Failed to like snippet:', err);
    }
    return null;
  }, []);

  const favoriteSnippet = useCallback(async (snippetId: string) => {
    try {
      const res = await fetch(`/api/snippets/${snippetId}/favorite`, { method: 'POST' });
      if (res.ok) {
        const updated: Snippet = await res.json();
        setSnippet(updated);
        return updated;
      }
    } catch (err) {
      console.error('Failed to favorite snippet:', err);
    }
    return null;
  }, []);

  return { snippet, loading, likeSnippet, favoriteSnippet };
}
