import React, { createContext, useContext, useReducer, useCallback, useEffect, useMemo } from 'react';

export interface Resource {
  id: string;
  url: string;
  domain: string;
  favicon: string;
  title: string;
  description: string;
  summary: string;
  tags: string[];
  screenshotUrl?: string;
  notes?: string;
  createdAt: number;
}

export interface ImportProgress {
  current: number;
  total: number;
  percentage: number;
}

interface ResourceState {
  resources: Resource[];
  currentResourceId: string | null;
  searchTerm: string;
  filterTags: string[];
  sortBy: 'time' | 'title' | 'domain';
  importProgress: ImportProgress;
  toasts: Array<{ id: string; type: 'success' | 'error' | 'info'; message: string }>;
}

type Action =
  | { type: 'SET_RESOURCES'; payload: Resource[] }
  | { type: 'ADD_RESOURCE'; payload: Resource }
  | { type: 'ADD_RESOURCES_BATCH'; payload: Resource[] }
  | { type: 'UPDATE_RESOURCE'; payload: { id: string; updates: Partial<Resource> } }
  | { type: 'REMOVE_RESOURCE'; payload: string }
  | { type: 'SET_CURRENT_ID'; payload: string | null }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'TOGGLE_FILTER_TAG'; payload: string }
  | { type: 'CLEAR_FILTERS' }
  | { type: 'SET_IMPORT_PROGRESS'; payload: Partial<ImportProgress> }
  | { type: 'PUSH_TOAST'; payload: { type: 'success' | 'error' | 'info'; message: string } }
  | { type: 'POP_TOAST'; payload: string };

const initialState: ResourceState = {
  resources: [],
  currentResourceId: null,
  searchTerm: '',
  filterTags: [],
  sortBy: 'time',
  importProgress: { current: 0, total: 0, percentage: 0 },
  toasts: []
};

function reducer(state: ResourceState, action: Action): ResourceState {
  switch (action.type) {
    case 'SET_RESOURCES':
      return { ...state, resources: action.payload };
    case 'ADD_RESOURCE': {
      if (state.resources.some(r => r.id === action.payload.id)) return state;
      return { ...state, resources: [action.payload, ...state.resources] };
    }
    case 'ADD_RESOURCES_BATCH': {
      const existingIds = new Set(state.resources.map(r => r.id));
      const newOnes = action.payload.filter(r => !existingIds.has(r.id));
      return { ...state, resources: [...newOnes, ...state.resources] };
    }
    case 'UPDATE_RESOURCE':
      return {
        ...state,
        resources: state.resources.map(r =>
          r.id === action.payload.id ? { ...r, ...action.payload.updates } : r
        )
      };
    case 'REMOVE_RESOURCE':
      return {
        ...state,
        resources: state.resources.filter(r => r.id !== action.payload),
        currentResourceId: state.currentResourceId === action.payload ? null : state.currentResourceId
      };
    case 'SET_CURRENT_ID':
      return { ...state, currentResourceId: action.payload };
    case 'SET_SEARCH':
      return { ...state, searchTerm: action.payload };
    case 'TOGGLE_FILTER_TAG': {
      const t = action.payload;
      return {
        ...state,
        filterTags: state.filterTags.includes(t)
          ? state.filterTags.filter(x => x !== t)
          : [...state.filterTags, t]
      };
    }
    case 'CLEAR_FILTERS':
      return { ...state, filterTags: [], searchTerm: '' };
    case 'SET_IMPORT_PROGRESS': {
      const cur = action.payload.current ?? state.importProgress.current;
      const tot = action.payload.total ?? state.importProgress.total;
      return {
        ...state,
        importProgress: {
          current: cur,
          total: tot,
          percentage: tot === 0 ? 0 : Math.round((cur / tot) * 100)
        }
      };
    }
    case 'PUSH_TOAST':
      return { ...state, toasts: [...state.toasts, { id: Math.random().toString(36).slice(2), ...action.payload }] };
    case 'POP_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
    default:
      return state;
  }
}

export interface ResourceContextType extends ResourceState {
  addResource: (r: Resource) => void;
  importResources: (rs: Resource[]) => void;
  setResources: (rs: Resource[]) => void;
  removeResource: (id: string) => void;
  updateResource: (id: string, updates: Partial<Resource>) => void;
  setCurrentResourceId: (id: string | null) => void;
  setSearchTerm: (t: string) => void;
  toggleFilterTag: (t: string) => void;
  clearFilters: () => void;
  setImportProgress: (p: Partial<ImportProgress>) => void;
  toast: (type: 'success' | 'error' | 'info', message: string) => void;
  filteredResources: Resource[];
}

const ResourceContext = createContext<ResourceContextType | null>(null);

export function ResourceProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const addResource = useCallback((r: Resource) => dispatch({ type: 'ADD_RESOURCE', payload: r }), []);
  const importResources = useCallback((rs: Resource[]) => dispatch({ type: 'ADD_RESOURCES_BATCH', payload: rs }), []);
  const setResources = useCallback((rs: Resource[]) => dispatch({ type: 'SET_RESOURCES', payload: rs }), []);
  const removeResource = useCallback((id: string) => dispatch({ type: 'REMOVE_RESOURCE', payload: id }), []);
  const updateResource = useCallback((id: string, updates: Partial<Resource>) => dispatch({ type: 'UPDATE_RESOURCE', payload: { id, updates } }), []);
  const setCurrentResourceId = useCallback((id: string | null) => dispatch({ type: 'SET_CURRENT_ID', payload: id }), []);
  const setSearchTerm = useCallback((t: string) => dispatch({ type: 'SET_SEARCH', payload: t }), []);
  const toggleFilterTag = useCallback((t: string) => dispatch({ type: 'TOGGLE_FILTER_TAG', payload: t }), []);
  const clearFilters = useCallback(() => dispatch({ type: 'CLEAR_FILTERS' }), []);
  const setImportProgress = useCallback((p: Partial<ImportProgress>) => dispatch({ type: 'SET_IMPORT_PROGRESS', payload: p }), []);
  const toast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).slice(2);
    dispatch({ type: 'PUSH_TOAST', payload: { type, message } });
    setTimeout(() => dispatch({ type: 'POP_TOAST', payload: id }), 3000);
  }, []);

  const filteredResources = useMemo(() => {
    let rs = [...state.resources];
    const term = state.searchTerm.trim().toLowerCase();
    if (term) {
      rs = rs.filter(r =>
        r.title.toLowerCase().includes(term) ||
        r.summary.toLowerCase().includes(term) ||
        r.description.toLowerCase().includes(term) ||
        r.url.toLowerCase().includes(term) ||
        r.tags.some(t => t.toLowerCase().includes(term))
      );
    }
    if (state.filterTags.length > 0) {
      const wanted = new Set(state.filterTags.map(t => t.toLowerCase()));
      rs = rs.filter(r => {
        const have = new Set(r.tags.map(t => t.toLowerCase()));
        for (const w of wanted) if (!have.has(w)) return false;
        return true;
      });
    }
    if (state.sortBy === 'title') rs.sort((a, b) => a.title.localeCompare(b.title));
    else if (state.sortBy === 'domain') rs.sort((a, b) => a.domain.localeCompare(b.domain));
    else rs.sort((a, b) => b.createdAt - a.createdAt);
    return rs;
  }, [state.resources, state.searchTerm, state.filterTags, state.sortBy]);

  useEffect(() => {
    fetch('/api/resources')
      .then(r => r.json())
      .then(j => { if (j?.success) setResources(j.data); })
      .catch(() => {});
  }, [setResources]);

  const value: ResourceContextType = {
    ...state,
    addResource, importResources, setResources,
    removeResource, updateResource,
    setCurrentResourceId, setSearchTerm, toggleFilterTag, clearFilters,
    setImportProgress, toast,
    filteredResources
  };

  return <ResourceContext.Provider value={value}>{children}</ResourceContext.Provider>;
}

export function useResourceContext(): ResourceContextType {
  const ctx = useContext(ResourceContext);
  if (!ctx) throw new Error('useResourceContext must be used within ResourceProvider');
  return ctx;
}
