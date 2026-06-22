import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Artwork, GalleryState, HistoryState } from './types';

const COLOR_PALETTE = [
  '#D32F2F',
  '#1976D2',
  '#388E3C',
  '#FBC02D',
  '#8E24AA',
  '#00ACC1',
  '#FF6F00',
  '#7B1FA2',
];

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 700;
const MIN_SPACING = 15;
const MAX_SPACING = 30;
const MIN_WIDTH = 120;
const MAX_WIDTH = 250;
const MIN_HEIGHT = 100;
const MAX_HEIGHT = 200;
const MAX_HISTORY = 20;

function checkCollision(
  a: Artwork,
  b: Artwork,
  spacing: number = MIN_SPACING
): boolean {
  return !(
    a.x + a.width + spacing <= b.x ||
    b.x + b.width + spacing <= a.x ||
    a.y + a.height + spacing <= b.y ||
    b.y + b.height + spacing <= a.y
  );
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomArtwork(existing: Artwork[]): Artwork | null {
  const width = randomInt(MIN_WIDTH, MAX_WIDTH);
  const height = randomInt(MIN_HEIGHT, MAX_HEIGHT);
  const color = COLOR_PALETTE[randomInt(0, COLOR_PALETTE.length - 1)];

  let attempts = 0;
  while (attempts < 100) {
    const x = randomInt(MIN_SPACING, CANVAS_WIDTH - width - MIN_SPACING);
    const y = randomInt(MIN_SPACING, CANVAS_HEIGHT - height - MIN_SPACING);

    const candidate: Artwork = {
      id: uuidv4(),
      x,
      y,
      width,
      height,
      rotation: 0,
      color,
    };

    const hasCollision = existing.some((art) => checkCollision(candidate, art));
    if (!hasCollision) {
      return candidate;
    }
    attempts++;
  }
  return null;
}

function resolveCollisions(
  artworks: Artwork[],
  updatedId: string
): Artwork[] {
  const updated = artworks.find((a) => a.id === updatedId);
  if (!updated) return artworks;

  const result = [...artworks];
  const others = result.filter((a) => a.id !== updatedId);

  for (const other of others) {
    if (checkCollision(updated, other)) {
      const dx = updated.x + updated.width / 2 - (other.x + other.width / 2);
      const dy = updated.y + updated.height / 2 - (other.y + other.height / 2);

      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) {
          other.x = Math.min(
            CANVAS_WIDTH - other.width - MIN_SPACING,
            updated.x + updated.width + MIN_SPACING
          );
        } else {
          other.x = Math.max(
            MIN_SPACING,
            updated.x - other.width - MIN_SPACING
          );
        }
      } else {
        if (dy > 0) {
          other.y = Math.min(
            CANVAS_HEIGHT - other.height - MIN_SPACING,
            updated.y + updated.height + MIN_SPACING
          );
        } else {
          other.y = Math.max(
            MIN_SPACING,
            updated.y - other.height - MIN_SPACING
          );
        }
      }
    }
  }

  return result;
}

function clampToBounds(artwork: Artwork): Artwork {
  return {
    ...artwork,
    x: Math.max(0, Math.min(CANVAS_WIDTH - artwork.width, artwork.x)),
    y: Math.max(0, Math.min(CANVAS_HEIGHT - artwork.height, artwork.y)),
  };
}

function generateInitialArtworks(): Artwork[] {
  const artworks: Artwork[] = [];
  while (artworks.length < 8) {
    const artwork = generateRandomArtwork(artworks);
    if (artwork) {
      artworks.push(artwork);
    }
  }
  return artworks;
}

export const useGalleryStore = create<GalleryState>((set, get) => ({
  artworks: [],
  selectedId: null,
  layout: {
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: CANVAS_HEIGHT,
    minSpacing: MIN_SPACING,
    maxSpacing: MAX_SPACING,
  },
  history: [],
  historyIndex: -1,
  mouseCoords: { x: 0, y: 0 },

  initArtworks: () => {
    const artworks = generateInitialArtworks();
    const historyState: HistoryState = {
      artworks: JSON.parse(JSON.stringify(artworks)),
      timestamp: Date.now(),
    };
    set({
      artworks,
      history: [historyState],
      historyIndex: 0,
    });
  },

  selectArtwork: (id: string | null) => {
    set({ selectedId: id });
  },

  updatePosition: (id: string, x: number, y: number) => {
    const { artworks } = get();
    let updated = artworks.map((art) =>
      art.id === id ? clampToBounds({ ...art, x, y }) : art
    );
    updated = resolveCollisions(updated, id);
    set({ artworks: updated });
  },

  updateSelected: (updates: Partial<Omit<Artwork, 'id'>>) => {
    const { selectedId, artworks } = get();
    if (!selectedId) return;

    let updated = artworks.map((art) =>
      art.id === selectedId
        ? clampToBounds({ ...art, ...updates })
        : art
    );
    updated = resolveCollisions(updated, selectedId);
    set({ artworks: updated });
    get().saveHistory();
  },

  alignHorizontal: () => {
    const { artworks } = get();
    if (artworks.length === 0) return;

    const avgY = artworks.reduce((sum, a) => sum + a.y, 0) / artworks.length;
    const updated = artworks.map((art) => ({ ...art, y: Math.round(avgY) }));
    set({ artworks: updated });
    get().saveHistory();
  },

  alignVerticalCenter: () => {
    const { artworks, layout } = get();
    if (artworks.length === 0) return;

    const centerX = layout.canvasWidth / 2;
    const totalWidth = artworks.reduce(
      (sum, a) => sum + a.width,
      (artworks.length - 1) * MIN_SPACING
    );
    let currentX = centerX - totalWidth / 2;

    const sorted = [...artworks].sort((a, b) => a.x - b.x);
    const updated = sorted.map((art) => {
      const newArt = { ...art, x: Math.round(currentX) };
      currentX += art.width + MIN_SPACING;
      return newArt;
    });

    const idMap = new Map(updated.map((a) => [a.id, a]));
    const result = artworks.map((art) => idMap.get(art.id)!);
    set({ artworks: result });
    get().saveHistory();
  },

  distributeEvenly: () => {
    const { artworks, layout } = get();
    if (artworks.length < 2) return;

    const sorted = [...artworks].sort((a, b) => a.x - b.x);
    const totalWidth = sorted.reduce((sum, a) => sum + a.width, 0);
    const availableSpace = layout.canvasWidth - totalWidth - MIN_SPACING * 2;
    const spacing =
      artworks.length > 1
        ? Math.min(
            MAX_SPACING,
            Math.max(MIN_SPACING, availableSpace / (artworks.length - 1))
          )
        : MIN_SPACING;

    let currentX = MIN_SPACING;
    const updated = sorted.map((art) => {
      const newArt = { ...art, x: Math.round(currentX) };
      currentX += art.width + spacing;
      return newArt;
    });

    const idMap = new Map(updated.map((a) => [a.id, a]));
    const result = artworks.map((art) => idMap.get(art.id)!);
    set({ artworks: result });
    get().saveHistory();
  },

  shuffle: () => {
    const { artworks } = get();
    const newArtworks: Artwork[] = [];

    for (const art of artworks) {
      let attempts = 0;
      let placed = false;

      while (attempts < 100 && !placed) {
        const candidate = {
          ...art,
          x: randomInt(MIN_SPACING, CANVAS_WIDTH - art.width - MIN_SPACING),
          y: randomInt(MIN_SPACING, CANVAS_HEIGHT - art.height - MIN_SPACING),
        };

        const hasCollision = newArtworks.some((a) =>
          checkCollision(candidate, a)
        );
        if (!hasCollision) {
          newArtworks.push(candidate);
          placed = true;
        }
        attempts++;
      }

      if (!placed) {
        newArtworks.push(art);
      }
    }

    set({ artworks: newArtworks });
    get().saveHistory();
  },

  saveHistory: () => {
    const { history, historyIndex, artworks } = get();
    const newHistory = history.slice(0, historyIndex + 1);

    const historyState: HistoryState = {
      artworks: JSON.parse(JSON.stringify(artworks)),
      timestamp: Date.now(),
    };

    newHistory.push(historyState);

    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
    }

    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return;

    const newIndex = historyIndex - 1;
    const state = history[newIndex];
    set({
      artworks: JSON.parse(JSON.stringify(state.artworks)),
      historyIndex: newIndex,
    });
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;

    const newIndex = historyIndex + 1;
    const state = history[newIndex];
    set({
      artworks: JSON.parse(JSON.stringify(state.artworks)),
      historyIndex: newIndex,
    });
  },

  setMouseCoords: (x: number, y: number) => {
    set({ mouseCoords: { x, y } });
  },
}));
