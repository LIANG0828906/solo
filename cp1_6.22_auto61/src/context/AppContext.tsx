import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { BookmarkNode, SearchResult } from '@/types';
import { fetchBookmarks } from '@/utils/api';

function findNodeById(roots: BookmarkNode[], id: string): BookmarkNode | null {
  for (const root of roots) {
    if (root.id === id) return root;
    if (root.children.length > 0) {
      const found = findNodeById(root.children, id);
      if (found) return found;
    }
  }
  return null;
}

function updateNodeInTree(roots: BookmarkNode[], id: string, updates: Partial<BookmarkNode>): BookmarkNode[] {
  return roots.map(node => {
    if (node.id === id) {
      return { ...node, ...updates, updatedAt: new Date().toISOString() };
    }
    if (node.children.length > 0) {
      return { ...node, children: updateNodeInTree(node.children, id, updates) };
    }
    return node;
  });
}

function deleteNodeFromTree(roots: BookmarkNode[], id: string): BookmarkNode[] {
  return roots
    .filter(node => node.id !== id)
    .map(node => ({
      ...node,
      children: deleteNodeFromTree(node.children, id),
    }));
}

function findAncestorIds(roots: BookmarkNode[], id: string, ancestors: string[] = []): string[] | null {
  for (const root of roots) {
    if (root.id === id) return ancestors;
    if (root.children.length > 0) {
      const found = findAncestorIds(root.children, id, [...ancestors, root.id]);
      if (found) return found;
    }
  }
  return null;
}

function addNodesToTree(roots: BookmarkNode[], newNodes: BookmarkNode[], parentId: string | null): BookmarkNode[] {
  if (parentId === null) {
    return [...roots, ...newNodes];
  }
  return roots.map(node => {
    if (node.id === parentId) {
      return { ...node, children: [...node.children, ...newNodes], updatedAt: new Date().toISOString() };
    }
    if (node.children.length > 0) {
      return { ...node, children: addNodesToTree(node.children, newNodes, parentId) };
    }
    return node;
  });
}

interface AppContextValue {
  bookmarks: BookmarkNode[];
  selectedId: string | null;
  expandedIds: Set<string>;
  searchQuery: string;
  searchResults: SearchResult[];
  activeTagFilter: string | null;
  loading: boolean;
  setBookmarks: (roots: BookmarkNode[]) => void;
  selectNode: (id: string | null) => void;
  toggleExpand: (id: string) => void;
  expandAllAncestors: (id: string) => void;
  setSearchQuery: (q: string) => void;
  setSearchResults: (results: SearchResult[]) => void;
  setActiveTagFilter: (tag: string | null) => void;
  refreshBookmarks: () => Promise<void>;
  updateBookmarkLocal: (id: string, updates: Partial<BookmarkNode>) => void;
  deleteBookmarkLocal: (id: string) => void;
  addBookmarksLocal: (newBookmarks: BookmarkNode[], parentId: string | null) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [bookmarks, setBookmarks] = useState<BookmarkNode[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const selectNode = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const expandAllAncestors = useCallback((id: string) => {
    const ancestors = findAncestorIds(bookmarks, id);
    if (ancestors && ancestors.length > 0) {
      setExpandedIds(prev => {
        const next = new Set(prev);
        ancestors.forEach(a => next.add(a));
        return next;
      });
    }
  }, [bookmarks]);

  const refreshBookmarks = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchBookmarks();
      setBookmarks(result.roots);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateBookmarkLocal = useCallback((id: string, updates: Partial<BookmarkNode>) => {
    setBookmarks(prev => updateNodeInTree(prev, id, updates));
  }, []);

  const deleteBookmarkLocal = useCallback((id: string) => {
    setBookmarks(prev => deleteNodeFromTree(prev, id));
    setSelectedId(prev => (prev === id ? null : prev));
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const addBookmarksLocal = useCallback((newBookmarks: BookmarkNode[], parentId: string | null) => {
    setBookmarks(prev => addNodesToTree(prev, newBookmarks, parentId));
    if (parentId !== null) {
      setExpandedIds(prev => {
        const next = new Set(prev);
        next.add(parentId);
        return next;
      });
    }
  }, []);

  useEffect(() => {
    refreshBookmarks();
  }, [refreshBookmarks]);

  const value: AppContextValue = {
    bookmarks,
    selectedId,
    expandedIds,
    searchQuery,
    searchResults,
    activeTagFilter,
    loading,
    setBookmarks,
    selectNode,
    toggleExpand,
    expandAllAncestors,
    setSearchQuery,
    setSearchResults,
    setActiveTagFilter,
    refreshBookmarks,
    updateBookmarkLocal,
    deleteBookmarkLocal,
    addBookmarksLocal,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
