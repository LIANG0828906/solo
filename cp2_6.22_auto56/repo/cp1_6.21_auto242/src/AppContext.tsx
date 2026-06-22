import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { AppContextType, Event } from './types';
import { searchEvents } from './data/events';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedCivilizationId, setSelectedCivilizationId] = useState<string | null>(null);
  const [selectedCivilizationIds, setSelectedCivilizationIds] = useState<string[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = useMemo<Event[]>(() => {
    return searchEvents(searchQuery);
  }, [searchQuery]);

  const selectCivilization = useCallback((id: string | null) => {
    setSelectedCivilizationId(id);
  }, []);

  const toggleComparisonCivilization = useCallback((id: string) => {
    setSelectedCivilizationIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((c) => c !== id);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  }, []);

  const clearComparisonCivilizations = useCallback(() => {
    setSelectedCivilizationIds([]);
  }, []);

  const selectEvent = useCallback((id: string | null) => {
    setSelectedEventId(id);
    setIsDetailPanelOpen(id !== null);
  }, []);

  const highlightEvent = useCallback((id: string | null) => {
    setHighlightedEventId(id);
  }, []);

  const closeDetailPanel = useCallback(() => {
    setIsDetailPanelOpen(false);
    setSelectedEventId(null);
  }, []);

  const handleSetSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const value = useMemo<AppContextType>(
    () => ({
      selectedCivilizationId,
      selectedCivilizationIds,
      selectedEventId,
      highlightedEventId,
      isDetailPanelOpen,
      searchQuery,
      searchResults,
      selectCivilization,
      toggleComparisonCivilization,
      selectEvent,
      highlightEvent,
      closeDetailPanel,
      setSearchQuery: handleSetSearchQuery,
      clearComparisonCivilizations,
    }),
    [
      selectedCivilizationId,
      selectedCivilizationIds,
      selectedEventId,
      highlightedEventId,
      isDetailPanelOpen,
      searchQuery,
      searchResults,
      selectCivilization,
      toggleComparisonCivilization,
      selectEvent,
      highlightEvent,
      closeDetailPanel,
      handleSetSearchQuery,
      clearComparisonCivilizations,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
