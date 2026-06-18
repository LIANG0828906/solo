import { create } from 'zustand';
import type { SoundBlock } from '@/engine/SoundBlock';
import { createSoundBlock, SOUND_PRESETS } from '@/engine/SoundBlock';
import { audioManager } from '@/engine/AudioManager';

export type ViewName = 'scene' | 'gallery' | 'mine' | 'ranking';

export interface CityScape {
  id: string;
  author: string;
  parentId?: string;
  tracks: SoundBlock[];
  totalVolume: number;
  createdAt: number;
  overlayCount: number;
  title: string;
}

interface SoundState {
  blocks: SoundBlock[];
  totalVolume: number;
  currentSceneId: string | null;
  currentAuthor: string | null;
  parentSceneId: string | null;
  overlayUsed: number;
  view: ViewName;
  showCardForHotspot: string | null;
  shareLink: string | null;
  savedScapes: CityScape[];
  addBlockByPresetId: (presetId: string, hotSpotId: string, isOverlay?: boolean) => void;
  removeBlock: (id: string) => void;
  reorderBlocks: (ids: string[]) => void;
  toggleMute: (id: string) => void;
  setVolume: (id: string, volume: number) => void;
  setTotalVolume: (v: number) => void;
  setView: (v: ViewName) => void;
  setShowCardForHotspot: (id: string | null) => void;
  saveScape: (author: string) => string;
  loadScape: (id: string) => boolean;
  reset: () => void;
  initFromPath: () => void;
  clearShareLink: () => void;
}

const NICK_KEY = 'cityscape_nick';
const SCAPES_KEY = 'cityscape_scapes';

function loadSavedScapes(): CityScape[] {
  try {
    const raw = localStorage.getItem(SCAPES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CityScape[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistScapes(list: CityScape[]): void {
  try {
    localStorage.setItem(SCAPES_KEY, JSON.stringify(list));
  } catch {
    /* noop */
  }
}

export function getNickname(): string | null {
  return localStorage.getItem(NICK_KEY);
}

export function setNickname(n: string): void {
  localStorage.setItem(NICK_KEY, n);
}

function genId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export const useSoundStore = create<SoundState>((set, get) => ({
  blocks: [],
  totalVolume: 80,
  currentSceneId: null,
  currentAuthor: null,
  parentSceneId: null,
  overlayUsed: 0,
  view: 'scene',
  showCardForHotspot: null,
  shareLink: null,
  savedScapes: loadSavedScapes(),

  addBlockByPresetId: (presetId, hotSpotId, isOverlay = false) => {
    const preset = SOUND_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const { blocks, overlayUsed } = get();
    if (isOverlay && overlayUsed >= 3) return;
    if (blocks.length >= 6) return;
    const block = createSoundBlock(preset, hotSpotId, isOverlay);
    const nextBlocks = [...blocks, block];
    set({ blocks: nextBlocks, showCardForHotspot: null, overlayUsed: isOverlay ? overlayUsed + 1 : overlayUsed });
    void audioManager.addTrack(block);
  },

  removeBlock: (id) => {
    const block = get().blocks.find((b) => b.id === id);
    const next = get().blocks.filter((b) => b.id !== id);
    set({
      blocks: next,
      overlayUsed: block?.isOverlay ? Math.max(0, get().overlayUsed - 1) : get().overlayUsed,
    });
    audioManager.removeTrack(id);
  },

  reorderBlocks: (ids) => {
    const map = new Map(get().blocks.map((b) => [b.id, b]));
    const next = ids.map((id) => map.get(id)).filter((b): b is SoundBlock => !!b);
    set({ blocks: next });
    audioManager.reorderTracks(ids);
  },

  toggleMute: (id) => {
    const next = get().blocks.map((b) => (b.id === id ? { ...b, muted: !b.muted } : b));
    set({ blocks: next });
    const updated = next.find((b) => b.id === id);
    if (updated) audioManager.updateTrack(updated);
  },

  setVolume: (id, volume) => {
    const v = Math.max(0, Math.min(100, volume));
    const next = get().blocks.map((b) => (b.id === id ? { ...b, volume: v } : b));
    set({ blocks: next });
    const updated = next.find((b) => b.id === id);
    if (updated) audioManager.updateTrack(updated);
  },

  setTotalVolume: (v) => {
    const value = Math.max(0, Math.min(100, v));
    set({ totalVolume: value });
    audioManager.totalVolume = value;
  },

  setView: (v) => set({ view: v }),

  setShowCardForHotspot: (id) => set({ showCardForHotspot: id }),

  saveScape: (author) => {
    const state = get();
    const id = state.currentSceneId ?? genId();
    const parentId = state.parentSceneId ?? undefined;
    const scape: CityScape = {
      id,
      author,
      parentId,
      tracks: state.blocks,
      totalVolume: state.totalVolume,
      createdAt: Date.now(),
      overlayCount: state.overlayUsed,
      title: state.blocks.length > 0 ? `${state.blocks[0].name} 等 ${state.blocks.length} 个音轨` : '空荡的街角',
    };
    const existing = state.savedScapes.filter((s) => s.id !== id);
    const list = [scape, ...existing].slice(0, 50);
    persistScapes(list);
    set({ savedScapes: list, currentSceneId: id, shareLink: `/cityscape/${id}` });
    return id;
  },

  loadScape: (id) => {
    const scape = get().savedScapes.find((s) => s.id === id);
    if (!scape) return false;
    audioManager.stopAll();
    set({
      blocks: [],
      overlayUsed: 0,
      currentSceneId: scape.id,
      currentAuthor: scape.author,
      parentSceneId: scape.parentId ?? null,
      totalVolume: scape.totalVolume,
      view: 'scene',
    });
    audioManager.totalVolume = scape.totalVolume;
    let overlayCount = 0;
    for (const t of scape.tracks) {
      if (t.isOverlay) overlayCount++;
      void audioManager.addTrack(t);
    }
    set({ blocks: scape.tracks, overlayUsed: overlayCount });
    return true;
  },

  reset: () => {
    audioManager.stopAll();
    set({
      blocks: [],
      overlayUsed: 0,
      currentSceneId: null,
      currentAuthor: null,
      parentSceneId: null,
      totalVolume: 80,
      shareLink: null,
    });
    audioManager.totalVolume = 80;
  },

  initFromPath: () => {
    const m = window.location.pathname.match(/^\/cityscape\/([a-z0-9]+)/i);
    if (!m) return;
    const id = m[1];
    const ok = get().loadScape(id);
    if (!ok) {
      const fake: CityScape = {
        id,
        author: '旅人',
        tracks: [],
        totalVolume: 80,
        createdAt: Date.now(),
        overlayCount: 0,
        title: '路过的风景',
        parentId: id,
      };
      persistScapes([fake, ...get().savedScapes]);
      set({ currentSceneId: id, currentAuthor: '旅人', parentSceneId: id, savedScapes: loadSavedScapes() });
    }
  },

  clearShareLink: () => set({ shareLink: null }),
}));
