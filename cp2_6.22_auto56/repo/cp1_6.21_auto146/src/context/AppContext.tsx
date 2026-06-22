import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import type { Snippet, RelationGraph } from '../types';
import {
  getSnippets,
  addSnippet as apiAdd,
  updateSnippet as apiUpdate,
  deleteSnippet as apiDelete,
  generateRelationGraph,
} from '../api/snippetApi';

interface AppContextType {
  snippets: Snippet[];
  selectedId: string | null;
  selectedSnippet: Snippet | undefined;
  searchKeyword: string;
  relationGraph: RelationGraph | null;
  isEditing: boolean;
  setSelectedId: (id: string | null) => void;
  setSearchKeyword: (keyword: string) => void;
  setIsEditing: (editing: boolean) => void;
  addSnippet: (snippet: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt'>) => Snippet;
  updateSnippet: (id: string, updates: Partial<Snippet>) => void;
  deleteSnippet: (id: string) => void;
  generateGraph: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [relationGraph, setRelationGraph] = useState<RelationGraph | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const initialSnippets = getSnippets();
    setSnippets(initialSnippets);
    if (initialSnippets.length > 0) {
      setSelectedId(initialSnippets[0].id);
    }
  }, []);

  const selectedSnippet = useMemo(
    () => snippets.find((s) => s.id === selectedId),
    [snippets, selectedId]
  );

  const addSnippet = useCallback(
    (snippet: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newSnippet = apiAdd(snippet);
      setSnippets(getSnippets());
      return newSnippet;
    },
    []
  );

  const updateSnippet = useCallback((id: string, updates: Partial<Snippet>) => {
    apiUpdate(id, updates);
    setSnippets(getSnippets());
  }, []);

  const deleteSnippet = useCallback(
    (id: string) => {
      apiDelete(id);
      setSnippets(getSnippets());
      if (selectedId === id) {
        setSelectedId(null);
        setIsEditing(false);
      }
    },
    [selectedId]
  );

  const generateGraph = useCallback(() => {
    const graph = generateRelationGraph();
    setRelationGraph(graph);
  }, []);

  return (
    <AppContext.Provider
      value={{
        snippets,
        selectedId,
        selectedSnippet,
        searchKeyword,
        relationGraph,
        isEditing,
        setSelectedId,
        setSearchKeyword,
        setIsEditing,
        addSnippet,
        updateSnippet,
        deleteSnippet,
        generateGraph,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
};
