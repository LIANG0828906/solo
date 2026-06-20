import { create } from 'zustand';
import { StarStore, Star, ConstellationLine } from '@/types';
import { stars, MAX_STARS, INITIAL_VISIBLE_STARS, getStarById, findStarByName } from '@/utils/starData';
import { getLineKey, calculateStarDistance, snapToStarCenter } from '@/utils/coordinates';

export const useStarStore = create<StarStore>((set, get) => ({
  stars,
  visibleStarCount: INITIAL_VISIBLE_STARS,
  maxStars: MAX_STARS,
  selectedStarId: null,
  constellationLines: [],
  isDragging: false,
  dragStartStarId: null,
  dragCurrentPosition: null,
  cameraState: {
    position: [0, 30, 80],
    target: [0, 0, 0],
    zoom: 1,
  },
  isFlying: false,
  fps: 60,

  selectStar: (id: string | null) => {
    set({ selectedStarId: id });
  },

  addConstellationLine: (startId: string, endId: string): boolean => {
    if (startId === endId) return false;

    const { constellationLines, stars } = get();
    const key = getLineKey(startId, endId);
    const exists = constellationLines.some(
      (l) => getLineKey(l.startStarId, l.endStarId) === key
    );

    if (exists) return false;

    const startStar = stars.find((s) => s.id === startId);
    const endStar = stars.find((s) => s.id === endId);

    if (!startStar || !endStar) return false;

    const [sx, sy, sz] = snapToStarCenter(startStar.x, startStar.y, startStar.z, startStar);
    const [ex, ey, ez] = snapToStarCenter(endStar.x, endStar.y, endStar.z, endStar);

    const distance = calculateStarDistance(
      { ...startStar, x: sx, y: sy, z: sz },
      { ...endStar, x: ex, y: ey, z: ez }
    );

    const newLine: ConstellationLine = {
      id: `line-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      startStarId: startId,
      endStarId: endId,
      distance,
      createdAt: Date.now(),
    };

    set({
      constellationLines: [...constellationLines, newLine],
    });

    return true;
  },

  removeLastLine: () => {
    set((state) => ({
      constellationLines: state.constellationLines.slice(0, -1),
    }));
  },

  clearAllLines: () => {
    set({ constellationLines: [] });
  },

  setVisibleStarCount: (count: number) => {
    set({ visibleStarCount: Math.max(2000, Math.min(MAX_STARS, count)) });
  },

  setCameraState: (state: Partial<StarStore['cameraState']>) => {
    set((prev) => ({
      cameraState: { ...prev.cameraState, ...state },
    }));
  },

  startDragging: (starId: string) => {
    const star = get().stars.find((s) => s.id === starId);
    if (!star) return;

    set({
      isDragging: true,
      dragStartStarId: starId,
      dragCurrentPosition: { x: star.x, y: star.y, z: star.z },
    });
  },

  updateDragPosition: (pos: { x: number; y: number; z: number }) => {
    if (!get().isDragging) return;
    set({ dragCurrentPosition: pos });
  },

  endDragging: (endStarId?: string) => {
    const { isDragging, dragStartStarId, addConstellationLine } = get();

    if (isDragging && dragStartStarId && endStarId) {
      addConstellationLine(dragStartStarId, endStarId);
    }

    set({
      isDragging: false,
      dragStartStarId: null,
      dragCurrentPosition: null,
    });
  },

  cancelDragging: () => {
    set({
      isDragging: false,
      dragStartStarId: null,
      dragCurrentPosition: null,
    });
  },

  setIsFlying: (flying: boolean) => {
    set({ isFlying: flying });
  },

  setFps: (fps: number) => {
    set({ fps });
  },

  findStarByName: (name: string): Star | undefined => {
    return findStarByName(name);
  },

  getStarById: (id: string): Star | undefined => {
    return getStarById(id);
  },
}));
