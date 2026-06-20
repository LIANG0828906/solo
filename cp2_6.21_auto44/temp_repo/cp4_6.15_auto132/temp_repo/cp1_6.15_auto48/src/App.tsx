import React, { useReducer, useCallback, useEffect, useMemo } from 'react';
import { History, Undo2, Redo2, Clock } from 'lucide-react';
import ColorPicker from '@/components/ColorPicker';
import PreviewPane from '@/components/PreviewPane';
import CodePanel from '@/components/CodePanel';
import CollectionPanel from '@/components/CollectionPanel';
import {
  type GradientScheme,
  type HistoryEntry,
  createDefaultScheme,
  generateColorStops,
  formatTimestamp,
} from '@/utils/history';
import {
  pushState as pushHistoryState,
  undo as historyUndo,
  redo as historyRedo,
  type HistoryStack,
  createHistoryStack,
} from '@/utils/history';

interface AppState {
  currentScheme: GradientScheme;
  collections: GradientScheme[];
  historyStack: HistoryStack;
  selectedForCompare: string[];
  isCompareMode: boolean;
  isHistoryPanelOpen: boolean;
}

type AppAction =
  | { type: 'UPDATE_SCHEME'; payload: Partial<GradientScheme> }
  | { type: 'ADD_TO_COLLECTION' }
  | { type: 'REMOVE_FROM_COLLECTION'; payload: string }
  | { type: 'REORDER_COLLECTION'; payload: { fromIndex: number; toIndex: number } }
  | { type: 'SELECT_FOR_COMPARE'; payload: string }
  | { type: 'TOGGLE_COMPARE_MODE' }
  | { type: 'TOGGLE_HISTORY_PANEL' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'RESTORE_FROM_HISTORY'; payload: number }
  | { type: 'LOAD_SCHEME'; payload: GradientScheme };

function loadCollections(): GradientScheme[] {
  try {
    const data = localStorage.getItem('gradientcraft_collections');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveCollections(collections: GradientScheme[]) {
  try {
    localStorage.setItem('gradientcraft_collections', JSON.stringify(collections));
  } catch {
    // ignore
  }
}

const initialState: AppState = {
  currentScheme: createDefaultScheme(),
  collections: loadCollections(),
  historyStack: createHistoryStack(),
  selectedForCompare: [],
  isCompareMode: false,
  isHistoryPanelOpen: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'UPDATE_SCHEME': {
      const updatedScheme = { ...state.currentScheme, ...action.payload };
      const newStack = pushHistoryState(
        state.historyStack,
        'update',
        updatedScheme,
        state.collections
      );
      return { ...state, currentScheme: updatedScheme, historyStack: newStack };
    }

    case 'ADD_TO_COLLECTION': {
      const newScheme = { ...state.currentScheme, createdAt: Date.now() };
      const newCollections = [...state.collections, newScheme];
      saveCollections(newCollections);
      const newStack = pushHistoryState(state.historyStack, 'create', newScheme, newCollections);
      return { ...state, collections: newCollections, historyStack: newStack };
    }

    case 'REMOVE_FROM_COLLECTION': {
      const newCollections = state.collections.filter((c) => c.id !== action.payload);
      saveCollections(newCollections);
      const removed = state.collections.find((c) => c.id === action.payload);
      const newStack = pushHistoryState(
        state.historyStack,
        'delete',
        removed || state.currentScheme,
        newCollections
      );
      return {
        ...state,
        collections: newCollections,
        selectedForCompare: state.selectedForCompare.filter((id) => id !== action.payload),
        historyStack: newStack,
      };
    }

    case 'REORDER_COLLECTION': {
      const { fromIndex, toIndex } = action.payload;
      const newCollections = [...state.collections];
      const [moved] = newCollections.splice(fromIndex, 1);
      newCollections.splice(toIndex, 0, moved);
      saveCollections(newCollections);
      return { ...state, collections: newCollections };
    }

    case 'SELECT_FOR_COMPARE': {
      const id = action.payload;
      const isSelected = state.selectedForCompare.includes(id);
      if (isSelected) {
        return {
          ...state,
          selectedForCompare: state.selectedForCompare.filter((sid) => sid !== id),
        };
      }
      if (state.selectedForCompare.length >= 2) {
        return {
          ...state,
          selectedForCompare: [state.selectedForCompare[1], id],
        };
      }
      return {
        ...state,
        selectedForCompare: [...state.selectedForCompare, id],
      };
    }

    case 'TOGGLE_COMPARE_MODE': {
      return { ...state, isCompareMode: !state.isCompareMode };
    }

    case 'TOGGLE_HISTORY_PANEL': {
      return { ...state, isHistoryPanelOpen: !state.isHistoryPanelOpen };
    }

    case 'UNDO': {
      const newStack = historyUndo(state.historyStack);
      const entry = state.historyStack.entries[newStack.currentIndex];
      if (entry) {
        return {
          ...state,
          historyStack: newStack,
          currentScheme: { ...entry.scheme },
          collections: entry.collectionsSnapshot.map((c) => ({ ...c })),
        };
      }
      return { ...state, historyStack: newStack };
    }

    case 'REDO': {
      const newStack = historyRedo(state.historyStack);
      const entry = state.historyStack.entries[newStack.currentIndex];
      if (entry) {
        return {
          ...state,
          historyStack: newStack,
          currentScheme: { ...entry.scheme },
          collections: entry.collectionsSnapshot.map((c) => ({ ...c })),
        };
      }
      return { ...state, historyStack: newStack };
    }

    case 'RESTORE_FROM_HISTORY': {
      const entry = state.historyStack.entries[action.payload];
      if (entry) {
        return {
          ...state,
          currentScheme: { ...entry.scheme },
          collections: entry.collectionsSnapshot.map((c) => ({ ...c })),
        };
      }
      return state;
    }

    case 'LOAD_SCHEME': {
      return { ...state, currentScheme: { ...action.payload } };
    }

    default:
      return state;
  }
}

const HistoryTimeline: React.FC<{
  entries: HistoryEntry[];
  currentIndex: number;
  onRestore: (index: number) => void;
}> = ({ entries, currentIndex, onRestore }) => {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Clock size={24} className="mx-auto mb-2 opacity-40" />
        <p className="text-xs">暂无操作记录</p>
      </div>
    );
  }

  const typeLabels: Record<string, string> = {
    create: '新增方案',
    update: '修改方案',
    delete: '删除方案',
  };

  const typeColors: Record<string, string> = {
    create: 'bg-green-400',
    update: 'bg-blue-400',
    delete: 'bg-red-400',
  };

  return (
    <div className="relative pl-6 space-y-4">
      <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-200" />
      {entries.map((entry, index) => (
        <div
          key={entry.id}
          onClick={() => onRestore(index)}
          className={`relative cursor-pointer group transition-all duration-200 ${
            index === currentIndex ? 'opacity-100' : 'opacity-60 hover:opacity-100'
          }`}
        >
          <div
            className={`absolute left-[-22px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${
              typeColors[entry.type] || 'bg-gray-400'
            } ${index === currentIndex ? 'ring-2 ring-brand-300 ring-offset-1' : ''}`}
          />
          <div className="glass-card rounded-lg p-2 glass-card-hover">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-600">{typeLabels[entry.type] || entry.type}</span>
              <span className="text-[10px] text-gray-400">{formatTimestamp(entry.timestamp)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-12 h-4 rounded"
                style={{
                  background:
                    entry.scheme.gradientType === 'linear'
                      ? `linear-gradient(${entry.scheme.direction}deg, ${generateColorStops(entry.scheme.startColor, entry.scheme.endColor, entry.scheme.steps)})`
                      : entry.scheme.gradientType === 'radial'
                      ? `radial-gradient(circle, ${generateColorStops(entry.scheme.startColor, entry.scheme.endColor, entry.scheme.steps)})`
                      : `conic-gradient(from ${entry.scheme.direction}deg, ${generateColorStops(entry.scheme.startColor, entry.scheme.endColor, entry.scheme.steps)})`,
                }}
              />
              <span className="text-[10px] text-gray-400 truncate">{entry.scheme.name}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const handleSchemeChange = useCallback(
    (updates: Partial<GradientScheme>) => {
      dispatch({ type: 'UPDATE_SCHEME', payload: updates });
    },
    []
  );

  const handleAddToCollection = useCallback(() => {
    dispatch({ type: 'ADD_TO_COLLECTION' });
  }, []);

  const handleRemoveFromCollection = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_FROM_COLLECTION', payload: id });
  }, []);

  const handleSelectForCompare = useCallback((id: string) => {
    dispatch({ type: 'SELECT_FOR_COMPARE', payload: id });
  }, []);

  const handleToggleCompareMode = useCallback(() => {
    dispatch({ type: 'TOGGLE_COMPARE_MODE' });
  }, []);

  const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
    dispatch({ type: 'REORDER_COLLECTION', payload: { fromIndex, toIndex } });
  }, []);

  const handleLoadScheme = useCallback((scheme: GradientScheme) => {
    dispatch({ type: 'LOAD_SCHEME', payload: scheme });
  }, []);

  const handleRestoreFromHistory = useCallback((index: number) => {
    dispatch({ type: 'RESTORE_FROM_HISTORY', payload: index });
  }, []);

  const handleUndo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const handleRedo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  const handleToggleHistoryPanel = useCallback(() => {
    dispatch({ type: 'TOGGLE_HISTORY_PANEL' });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  const canUndo = state.historyStack.currentIndex > 0;
  const canRedo = state.historyStack.currentIndex < state.historyStack.entries.length - 1;

  const historyPanel = useMemo(
    () => (
      <div
        className={`fixed left-0 top-0 h-full w-[260px] z-40 glass-card rounded-r-2xl shadow-2xl flex flex-col transition-transform duration-300 ${
          state.isHistoryPanelOpen ? 'animate-slide-in-left' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-gray-200/30 flex items-center justify-between">
          <h3 className="font-display font-semibold text-gray-800 text-base flex items-center gap-2">
            <History size={16} className="text-brand-500" />
            操作历史
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <HistoryTimeline
            entries={state.historyStack.entries}
            currentIndex={state.historyStack.currentIndex}
            onRestore={handleRestoreFromHistory}
          />
        </div>

        <div className="p-3 border-t border-gray-200/30 flex gap-2">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-medium transition-all ${
              canUndo
                ? 'bg-brand-50 text-brand-600 hover:bg-brand-100 interactive-element'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Undo2 size={14} />
            撤销
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-medium transition-all ${
              canRedo
                ? 'bg-violet-50 text-violet-600 hover:bg-violet-100 interactive-element'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Redo2 size={14} />
            恢复
          </button>
        </div>
      </div>
    ),
    [
      state.isHistoryPanelOpen,
      state.historyStack.entries,
      state.historyStack.currentIndex,
      handleRestoreFromHistory,
      handleUndo,
      handleRedo,
      canUndo,
      canRedo,
    ]
  );

  return (
    <div className="min-h-screen flex flex-col font-body">
      <header className="glass-card border-b border-gray-200/30 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleHistoryPanel}
            className="p-2 rounded-xl hover:bg-white/50 transition-colors interactive-element"
            title="操作历史"
          >
            <History size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="font-display font-bold text-lg bg-gradient-to-r from-brand-500 to-violet-500 bg-clip-text text-transparent">
              GradientCraft
            </h1>
            <p className="text-[10px] text-gray-400 -mt-0.5 hidden sm:block">渐变色彩搭配工具</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className={`p-2 rounded-xl transition-all ${
              canUndo ? 'hover:bg-white/50 text-gray-600 interactive-element' : 'text-gray-300 cursor-not-allowed'
            }`}
            title="撤销 (Ctrl+Z)"
          >
            <Undo2 size={16} />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className={`p-2 rounded-xl transition-all ${
              canRedo ? 'hover:bg-white/50 text-gray-600 interactive-element' : 'text-gray-300 cursor-not-allowed'
            }`}
            title="恢复 (Ctrl+Shift+Z)"
          >
            <Redo2 size={16} />
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col p-4 sm:p-6 gap-4 sm:gap-5 max-w-6xl mx-auto w-full">
        <ColorPicker scheme={state.currentScheme} onChange={handleSchemeChange} />
        <PreviewPane scheme={state.currentScheme} />
        <CodePanel scheme={state.currentScheme} />
      </main>

      {historyPanel}
      <CollectionPanel
        collections={state.collections}
        selectedForCompare={state.selectedForCompare}
        isCompareMode={state.isCompareMode}
        onToggle={() => {}}
        onAdd={handleAddToCollection}
        onRemove={handleRemoveFromCollection}
        onSelectForCompare={handleSelectForCompare}
        onToggleCompareMode={handleToggleCompareMode}
        onReorder={handleReorder}
        onLoadScheme={handleLoadScheme}
      />
    </div>
  );
}
