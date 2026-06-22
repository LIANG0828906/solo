import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface Sample {
  id: string;
  name: string;
  filename: string;
  url: string;
  duration: number;
  bpm: number;
  key: string;
  tags: string[];
  waveformData: number[];
  createdAt: string;
}

export interface MixerTrack {
  id: string;
  sampleId: string;
  sample: Sample | null;
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  loopStart: number;
  loopEnd: number;
}

export interface Filters {
  bpmMin: number | null;
  bpmMax: number | null;
  keys: string[];
  tags: string[];
}

interface AppContextType {
  samples: Sample[];
  setSamples: (samples: Sample[]) => void;
  selectedSampleId: string | null;
  setSelectedSampleId: (id: string | null) => void;
  selectedSample: Sample | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filters: Filters;
  setFilters: (filters: Filters) => void;
  mixerTracks: MixerTrack[];
  addTrack: (sample: Sample) => void;
  removeTrack: (trackId: string) => void;
  updateTrack: (trackId: string, updates: Partial<MixerTrack>) => void;
  isMixerMinimized: boolean;
  setIsMixerMinimized: (v: boolean) => void;
  isMobileDrawerOpen: boolean;
  setIsMobileDrawerOpen: (v: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({
    bpmMin: null,
    bpmMax: null,
    keys: [],
    tags: []
  });
  const [mixerTracks, setMixerTracks] = useState<MixerTrack[]>([]);
  const [isMixerMinimized, setIsMixerMinimized] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const selectedSample = samples.find(s => s.id === selectedSampleId) || null;

  const addTrack = useCallback((sample: Sample) => {
    setMixerTracks(prev => {
      if (prev.length >= 6) return prev;
      if (prev.some(t => t.sampleId === sample.id)) return prev;
      const newTrack: MixerTrack = {
        id: `track-${Date.now()}`,
        sampleId: sample.id,
        sample,
        volume: 80,
        pan: 0,
        muted: false,
        solo: false,
        loopStart: 0,
        loopEnd: sample.duration
      };
      return [...prev, newTrack];
    });
  }, []);

  const removeTrack = useCallback((trackId: string) => {
    setMixerTracks(prev => prev.filter(t => t.id !== trackId));
  }, []);

  const updateTrack = useCallback((trackId: string, updates: Partial<MixerTrack>) => {
    setMixerTracks(prev =>
      prev.map(t => t.id === trackId ? { ...t, ...updates } : t)
    );
  }, []);

  return (
    <AppContext.Provider value={{
      samples,
      setSamples,
      selectedSampleId,
      setSelectedSampleId,
      selectedSample,
      searchQuery,
      setSearchQuery,
      filters,
      setFilters,
      mixerTracks,
      addTrack,
      removeTrack,
      updateTrack,
      isMixerMinimized,
      setIsMixerMinimized,
      isMobileDrawerOpen,
      setIsMobileDrawerOpen
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within AppProvider');
  }
  return ctx;
}
