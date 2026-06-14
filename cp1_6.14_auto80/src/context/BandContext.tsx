import { createContext, useContext, useCallback, useState, useEffect, type ReactNode } from 'react';
import axios from 'axios';

interface BandMember {
  userId: string;
  role: 'admin' | 'member';
  joinedAt: string;
}

interface MemberDetail {
  userId: string;
  username: string;
  avatar: string;
  role: string;
  joinedAt: string;
}

interface Band {
  id: string;
  name: string;
  description: string;
  coverGradient: string;
  members: BandMember[];
  memberDetails: MemberDetail[];
  createdAt: string;
  updatedAt: string;
}

interface TrackEffects {
  reverb: { enabled: boolean; wet: number };
  delay: { enabled: boolean; wet: number };
}

interface Track {
  id: string;
  bandId: string;
  name: string;
  fileName: string;
  duration: number;
  volume: number;
  pan: number;
  muted: boolean;
  order: number;
  effects: TrackEffects;
  createdAt: string;
  url?: string;
}

interface TrackMixState {
  trackId: string;
  volume: number;
  pan: number;
  muted: boolean;
  effects: TrackEffects;
}

interface MixConfig {
  id: string;
  bandId: string;
  tracks: TrackMixState[];
  globalVolume: number;
  loopMode: 'single' | 'list' | 'random';
  createdAt: string;
}

interface BandContextValue {
  currentBand: Band | null;
  tracks: Track[];
  mixConfig: MixConfig | null;
  loadingBand: boolean;
  loadingTracks: boolean;
  loadingMix: boolean;
  fetchBand: (id: string) => Promise<void>;
  fetchTracks: (bandId: string) => Promise<void>;
  fetchMixConfig: (bandId: string) => Promise<void>;
  updateTrack: (id: string, data: Partial<Track>) => Promise<void>;
  addTrack: (formData: FormData) => Promise<void>;
  deleteTrack: (id: string) => Promise<void>;
  saveMixConfig: (data: Partial<MixConfig>) => Promise<void>;
  reorderTracks: (trackOrders: { id: string; order: number }[]) => Promise<void>;
  refreshAll: (bandId: string) => Promise<void>;
}

const BandContext = createContext<BandContextValue | null>(null);

const API_BASE = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function BandProvider({ children }: { children: ReactNode }) {
  const [currentBand, setCurrentBand] = useState<Band | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [mixConfig, setMixConfig] = useState<MixConfig | null>(null);
  const [loadingBand, setLoadingBand] = useState(false);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [loadingMix, setLoadingMix] = useState(false);

  const fetchBand = useCallback(async (id: string) => {
    setLoadingBand(true);
    try {
      const res = await axios.get(`${API_BASE}/bands/${id}`, { headers: getAuthHeaders() });
      setCurrentBand(res.data);
    } finally {
      setLoadingBand(false);
    }
  }, []);

  const fetchTracks = useCallback(async (bandId: string) => {
    setLoadingTracks(true);
    try {
      const res = await axios.get(`${API_BASE}/tracks`, {
        params: { bandId },
        headers: getAuthHeaders(),
      });
      setTracks(res.data);
    } finally {
      setLoadingTracks(false);
    }
  }, []);

  const fetchMixConfig = useCallback(async (bandId: string) => {
    setLoadingMix(true);
    try {
      const res = await axios.get(`${API_BASE}/mixes`, {
        params: { bandId },
        headers: getAuthHeaders(),
      });
      setMixConfig(res.data);
    } finally {
      setLoadingMix(false);
    }
  }, []);

  const updateTrack = useCallback(async (id: string, data: Partial<Track>) => {
    const res = await axios.put(`${API_BASE}/tracks/${id}`, data, { headers: getAuthHeaders() });
    setTracks((prev) => prev.map((t) => (t.id === id ? res.data : t)));
  }, []);

  const addTrack = useCallback(async (formData: FormData) => {
    const res = await axios.post(`${API_BASE}/tracks`, formData, {
      headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' },
    });
    setTracks((prev) => [...prev, res.data]);
  }, []);

  const deleteTrack = useCallback(async (id: string) => {
    await axios.delete(`${API_BASE}/tracks/${id}`, { headers: getAuthHeaders() });
    setTracks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const saveMixConfig = useCallback(async (data: Partial<MixConfig>) => {
    const res = await axios.post(`${API_BASE}/mixes`, data, { headers: getAuthHeaders() });
    setMixConfig(res.data);
  }, []);

  const reorderTracks = useCallback(async (trackOrders: { id: string; order: number }[]) => {
    await axios.post(`${API_BASE}/tracks/reorder`, { tracks: trackOrders }, { headers: getAuthHeaders() });
    setTracks((prev) => {
      const orderMap = new Map(trackOrders.map((t) => [t.id, t.order]));
      return prev
        .map((t) => ({ ...t, order: orderMap.get(t.id) ?? t.order }))
        .sort((a, b) => a.order - b.order);
    });
  }, []);

  const refreshAll = useCallback(async (bandId: string) => {
    await Promise.all([fetchBand(bandId), fetchTracks(bandId), fetchMixConfig(bandId)]);
  }, [fetchBand, fetchTracks, fetchMixConfig]);

  return (
    <BandContext.Provider
      value={{
        currentBand,
        tracks,
        mixConfig,
        loadingBand,
        loadingTracks,
        loadingMix,
        fetchBand,
        fetchTracks,
        fetchMixConfig,
        updateTrack,
        addTrack,
        deleteTrack,
        saveMixConfig,
        reorderTracks,
        refreshAll,
      }}
    >
      {children}
    </BandContext.Provider>
  );
}

export function useBandContext() {
  const ctx = useContext(BandContext);
  if (!ctx) {
    throw new Error('useBandContext must be used within a BandProvider');
  }
  return ctx;
}
