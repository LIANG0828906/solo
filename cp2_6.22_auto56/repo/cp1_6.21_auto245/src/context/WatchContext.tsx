import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Show, SearchResult, FilterStatus, SortBy } from '../types';
import { getShows, searchShows as apiSearchShows, addShow as apiAddShow } from '../api/client';

interface WatchContextType {
  shows: Show[];
  searchKeyword: string;
  searchResults: SearchResult[];
  isLoading: boolean;
  isSearching: boolean;
  filterStatus: FilterStatus;
  sortBy: SortBy;
  setSearchKeyword: (keyword: string) => void;
  setFilterStatus: (status: FilterStatus) => void;
  setSortBy: (sort: SortBy) => void;
  refreshShows: () => Promise<void>;
  searchShows: (query: string) => Promise<SearchResult[]>;
  addShow: (show: SearchResult) => Promise<Show | null>;
  isShowAdded: (tmdbId: number) => boolean;
}

const WatchContext = createContext<WatchContextType | undefined>(undefined);

export const useWatchContext = () => {
  const context = useContext(WatchContext);
  if (!context) {
    throw new Error('useWatchContext must be used within a WatchProvider');
  }
  return context;
};

interface WatchProviderProps {
  children: ReactNode;
}

export const WatchProvider: React.FC<WatchProviderProps> = ({ children }) => {
  const [shows, setShows] = useState<Show[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortBy>('addedAt');

  const refreshShows = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getShows();
      setShows(data);
    } catch (error) {
      console.error('Failed to fetch shows:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchShows = useCallback(async (query: string): Promise<SearchResult[]> => {
    if (!query.trim()) {
      setSearchResults([]);
      return [];
    }
    setIsSearching(true);
    try {
      const results = await apiSearchShows(query);
      setSearchResults(results);
      return results;
    } catch (error) {
      console.error('Failed to search shows:', error);
      setSearchResults([]);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  const addShow = useCallback(async (result: SearchResult): Promise<Show | null> => {
    try {
      const newShow = await apiAddShow({
        tmdbId: result.tmdbId,
        name: result.name,
        posterPath: result.posterPath,
        firstAirDate: result.firstAirDate,
        overview: result.overview,
        genres: [],
        totalEpisodes: 0,
        totalSeasons: 0,
      });
      setShows(prev => [...prev, newShow]);
      return newShow;
    } catch (error) {
      console.error('Failed to add show:', error);
      return null;
    }
  }, []);

  const isShowAdded = useCallback((tmdbId: number): boolean => {
    return shows.some(show => show.tmdbId === tmdbId);
  }, [shows]);

  useEffect(() => {
    refreshShows();
  }, [refreshShows]);

  const value: WatchContextType = {
    shows,
    searchKeyword,
    searchResults,
    isLoading,
    isSearching,
    filterStatus,
    sortBy,
    setSearchKeyword,
    setFilterStatus,
    setSortBy,
    refreshShows,
    searchShows,
    addShow,
    isShowAdded,
  };

  return <WatchContext.Provider value={value}>{children}</WatchContext.Provider>;
};
