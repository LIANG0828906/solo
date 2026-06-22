import { create } from 'zustand';
import type { GameStore, Meteor, Tower, Bullet, Particle, Point } from '../../types/game';
import {
  CORE_X,
  CORE_Y,
  TOWER_UPGRADE_COST,
  TOWER_FIRE_INTERVAL_L2,
  TOWER_DAMAGE_L2,
  WAVE_COMPLETE_CORE_RECOVERY,
  WAVE_COMPLETE_RESOURCE_BONUS,
  SCREEN_SHAKE_DURATION,
  VICTORY_ANIM_DURATION,
} from '../../utils/math';

const createInitialState = () => ({
  coreHp: 100,
  coreMaxHp: 100,
  corePosition: { x: CORE_X, y: CORE_Y } as Point,
  resources: 200,
  lastResourceTick: 0,
  currentWave: 0,
  isWaveActive: false,
  waveMeteorTotal: 0,
  waveMeteorSpawned: 0,
  lastSpawnTime: 0,
  isVictoryAnimating: false,
  victoryAnimStart: 0,
  meteors: [] as Meteor[],
  towers: [] as Tower[],
  bullets: [] as Bullet[],
  particles: [] as Particle[],
  screenShake: 0,
  screenShakeStart: 0,
  buildBubblePosition: null as Point | null,
  selectedTowerId: null as string | null,
  insufficientResourceMsg: null as string | null,
  insufficientResourceTime: 0,
  isGameOver: false,
  finalWave: 0,
  buildMode: false,
});

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialState(),

  updateCoreHp: (delta: number) => {
    const state = get();
    const newHp = Math.max(0, Math.min(state.coreMaxHp, state.coreHp + delta));
    const isGameOver = newHp <= 0;
    set({
      coreHp: newHp,
      isGameOver,
      finalWave: isGameOver ? state.currentWave : state.finalWave,
    });
  },

  deductResources: (amount: number): boolean => {
    const state = get();
    if (state.resources < amount) return false;
    set({ resources: state.resources - amount });
    return true;
  },

  addResources: (amount: number) => {
    set((state) => ({ resources: state.resources + amount }));
  },

  startWave: () => {
    const state = get();
    if (state.isWaveActive || state.isGameOver) return;
    set({
      currentWave: state.currentWave + 1,
      isWaveActive: true,
      waveMeteorSpawned: 0,
      lastSpawnTime: 0,
      selectedTowerId: null,
      buildBubblePosition: null,
      buildMode: false,
    });
  },

  completeWave: () => {
    const state = get();
    const recoveryAmount = Math.ceil(state.coreMaxHp * WAVE_COMPLETE_CORE_RECOVERY);
    const newHp = Math.min(state.coreMaxHp, state.coreHp + recoveryAmount);
    set({
      isWaveActive: false,
      meteors: [],
      bullets: [],
      coreHp: newHp,
      resources: state.resources + WAVE_COMPLETE_RESOURCE_BONUS,
      waveMeteorTotal: 0,
      waveMeteorSpawned: 0,
    });
    get().triggerVictoryAnimation();
  },

  addMeteor: (meteor: Meteor) => {
    set((state) => ({ meteors: [...state.meteors, meteor] }));
  },

  removeMeteor: (id: string) => {
    set((state) => ({ meteors: state.meteors.filter((m) => m.id !== id) }));
  },

  setMeteors: (meteors: Meteor[]) => {
    set({ meteors });
  },

  addTower: (tower: Tower) => {
    set((state) => ({ towers: [...state.towers, tower] }));
  },

  upgradeTower: (id: string): boolean => {
    const state = get();
    if (state.resources < TOWER_UPGRADE_COST) return false;
    const tower = state.towers.find((t) => t.id === id);
    if (!tower || tower.level >= 2) return false;

    const success = state.deductResources(TOWER_UPGRADE_COST);
    if (!success) return false;

    set((prev) => ({
      towers: prev.towers.map((t) =>
        t.id === id
          ? {
              ...t,
              level: 2,
              fireInterval: TOWER_FIRE_INTERVAL_L2,
              damage: TOWER_DAMAGE_L2,
              color: '#4B9EFF',
              bulletColor: '#4B9EFF',
            }
          : t
      ),
      selectedTowerId: null,
    }));
    return true;
  },

  addBullet: (bullet: Bullet) => {
    set((state) => ({ bullets: [...state.bullets, bullet] }));
  },

  removeBullet: (id: string) => {
    set((state) => ({ bullets: state.bullets.filter((b) => b.id !== id) }));
  },

  setBullets: (bullets: Bullet[]) => {
    set({ bullets });
  },

  addParticles: (particles: Particle[]) => {
    set((state) => ({ particles: [...state.particles, ...particles] }));
  },

  setParticles: (particles: Particle[]) => {
    set({ particles });
  },

  setBuildBubble: (pos: Point | null) => {
    set({ buildBubblePosition: pos, selectedTowerId: null });
  },

  selectTower: (id: string | null) => {
    set({ selectedTowerId: id, buildBubblePosition: null });
  },

  showInsufficientResource: (msg: string) => {
    set({
      insufficientResourceMsg: msg,
      insufficientResourceTime: performance.now(),
    });
  },

  clearInsufficientResource: () => {
    set({ insufficientResourceMsg: null });
  },

  triggerScreenShake: () => {
    set({
      screenShake: SCREEN_SHAKE_DURATION,
      screenShakeStart: performance.now(),
    });
  },

  triggerVictoryAnimation: () => {
    set({
      isVictoryAnimating: true,
      victoryAnimStart: performance.now(),
    });
  },

  setLastResourceTick: (time: number) => {
    set({ lastResourceTick: time });
  },

  setLastSpawnTime: (time: number) => {
    set({ lastSpawnTime: time });
  },

  incrementWaveMeteorSpawned: () => {
    set((state) => ({ waveMeteorSpawned: state.waveMeteorSpawned + 1 }));
  },

  setWaveActive: (active: boolean) => {
    set({ isWaveActive: active });
  },

  setScreenShake: (shake: number) => {
    set({ screenShake: shake });
  },

  setVictoryAnimating: (animating: boolean) => {
    set({ isVictoryAnimating: animating });
  },

  setBuildMode: (mode: boolean) => {
    set({ buildMode: mode, buildBubblePosition: null, selectedTowerId: null });
  },

  resetGame: () => {
    set(createInitialState());
  },
}));
