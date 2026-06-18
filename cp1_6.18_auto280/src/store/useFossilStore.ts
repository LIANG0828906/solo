import { create } from 'zustand';
import type {
  FossilStoreState, SandParticle, StarParticle, BoneFragment,
  AssemblyRipple, BurstParticle, BoneType
} from '@/types';
import {
  FOSSIL_ID, SANDBOX_SIZE, SAND_COUNT, STAR_COUNT,
  BONE_COUNT, MAX_REMOVE_PER_SEC
} from '@/types';

const randRange = (a: number, b: number) => a + Math.random() * (b - a);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

const SAND_COLORS = ['#C2A477', '#B8956D', '#A57F5A', '#9E7552', '#8D6E63'];

function generateSandParticles(): SandParticle[] {
  const arr: SandParticle[] = [];
  const half = SANDBOX_SIZE / 2;
  for (let i = 0; i < SAND_COUNT; i++) {
    const radius = randRange(0.1, 0.2);
    arr.push({
      id: i,
      x: randRange(-half + 0.5, half - 0.5),
      y: randRange(0.02, 0.15),
      z: randRange(-half + 0.5, half - 0.5),
      radius,
      color: SAND_COLORS[Math.floor(Math.random() * SAND_COLORS.length)],
      alpha: 0.8,
      removing: false,
      removeProgress: 0
    });
  }
  return arr;
}

function generateStarParticles(): StarParticle[] {
  const arr: StarParticle[] = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    arr.push({
      x: randRange(-SANDBOX_SIZE, SANDBOX_SIZE),
      y: randRange(3, 10),
      z: randRange(-SANDBOX_SIZE, SANDBOX_SIZE),
      size: randRange(1, 2),
      alpha: randRange(0.3, 0.6),
      drift: randRange(0.3, 1.2)
    });
  }
  return arr;
}

const BONE_LAYOUT: { name: BoneType; shape: BoneFragment['shape']; tx: number; tz: number; length: number; radius: number }[] = [
  { name: 'skull',     shape: 'compound', tx: -4, tz:  0, length: 1.8, radius: 0.7 },
  { name: 'spine',     shape: 'cylinder', tx: -1, tz:  0, length: 4.0, radius: 0.35 },
  { name: 'rib',       shape: 'box',      tx: -1, tz:  1.2, length: 1.8, radius: 0.25 },
  { name: 'pelvis',    shape: 'compound', tx:  2, tz:  0, length: 1.5, radius: 0.6 },
  { name: 'femur',     shape: 'cylinder', tx:  2.8, tz:  1.3, length: 2.0, radius: 0.35 },
  { name: 'tibia',     shape: 'cylinder', tx:  4.2, tz:  1.3, length: 1.6, radius: 0.28 },
  { name: 'fibula',    shape: 'cylinder', tx:  4.2, tz:  0.4, length: 1.5, radius: 0.2 },
  { name: 'humerus',   shape: 'cylinder', tx:  0, tz:  1.8, length: 1.6, radius: 0.3 },
  { name: 'radius',    shape: 'cylinder', tx:  1.5, tz:  2.2, length: 1.2, radius: 0.22 },
  { name: 'ulna',      shape: 'cylinder', tx:  1.5, tz:  1.4, length: 1.2, radius: 0.22 }
];

function generateBoneFragments(): BoneFragment[] {
  const arr: BoneFragment[] = [];
  for (let i = 0; i < BONE_COUNT; i++) {
    const layout = BONE_LAYOUT[i];
    const angle = Math.random() * Math.PI * 2;
    const dist = randRange(0.5, 3);
    const bx = Math.cos(angle) * dist;
    const bz = Math.sin(angle) * dist;
    const by = randRange(-0.5, -0.1);
    const length = randRange(Math.max(0.5, layout.length - 0.4), layout.length + 0.3);
    arr.push({
      id: i,
      name: layout.name,
      x: bx,
      y: by,
      z: bz,
      originalX: bx,
      originalY: by,
      originalZ: bz,
      targetX: layout.tx,
      targetY: 1.0,
      targetZ: layout.tz,
      targetRotX: 0,
      targetRotY: (layout.name === 'rib' || layout.name === 'radius' || layout.name === 'ulna') ? Math.PI / 2 : 0,
      targetRotZ: (layout.name === 'humerus') ? -0.6 : ((layout.name === 'femur' || layout.name === 'tibia' || layout.name === 'fibula') ? 0.5 : 0),
      rotationX: randRange(-0.3, 0.3),
      rotationY: randRange(-0.4, 0.4),
      rotationZ: randRange(-0.3, 0.3),
      length,
      shape: layout.shape,
      radius: layout.radius,
      cleaned: false,
      assembled: false,
      glowUntil: 0,
      assembleAnimation: 0,
      liftOffset: 0
    });
  }
  return arr;
}

export const useFossilStore = create<FossilStoreState>((set, get) => ({
  sandParticles: [],
  starParticles: [],
  boneFragments: [],
  allCleaned: false,
  fullyAssembled: false,
  assemblyRipples: [],
  toolSettings: { brushSize: 4, sandHardness: 0.5 },
  fossilDetail: null,
  fossilDetailLoading: false,
  selectedBoneId: null,

  initScene: () => {
    set({
      sandParticles: generateSandParticles(),
      starParticles: generateStarParticles(),
      boneFragments: generateBoneFragments(),
      allCleaned: false,
      fullyAssembled: false,
      assemblyRipples: [],
      fossilDetail: null,
      selectedBoneId: null
    });
  },

  removeParticlesInRadius: (worldX: number, worldZ: number, dt: number) => {
    const state = get();
    const brushRadius = 0.25 + state.toolSettings.brushSize * 0.1;
    const hardnessFactor = 1 - state.toolSettings.sandHardness;
    const maxRemoveThisFrame = Math.max(1, Math.floor(MAX_REMOVE_PER_SEC * dt * (0.5 + hardnessFactor)));
    const r2 = brushRadius * brushRadius;

    let removedCount = 0;
    const newParticles = state.sandParticles.map(p => {
      if (removedCount >= maxRemoveThisFrame) return p;
      if (p.removing) return p;
      const dx = p.x - worldX;
      const dz = p.z - worldZ;
      if (dx * dx + dz * dz <= r2) {
        removedCount++;
        const bursts: BurstParticle[] = [];
        for (let b = 0; b < 4; b++) {
          const a = (b / 4) * Math.PI * 2 + Math.random() * 0.6;
          bursts.push({
            ox: p.x, oy: p.y, oz: p.z,
            dx: Math.cos(a) * randRange(0.3, 0.6),
            dy: randRange(0.2, 0.4),
            dz: Math.sin(a) * randRange(0.3, 0.6),
            life: 0.3
          });
        }
        return { ...p, removing: true, removeProgress: 0, burstParticles: bursts };
      }
      return p;
    });

    if (removedCount > 0 || newParticles.some(p => p.removing)) {
      set({ sandParticles: newParticles });
    }
    return removedCount;
  },

  checkBoneCollision: (worldX: number, worldZ: number) => {
    const state = get();
    const brushRadius = 0.25 + state.toolSettings.brushSize * 0.1;
    const r2 = (brushRadius + 0.4) * (brushRadius + 0.4);
    const now = performance.now();
    let changed = false;
    let newlyCleanedCount = 0;

    const newBones = state.boneFragments.map(b => {
      const dx = b.x - worldX;
      const dz = b.z - worldZ;
      const inside = (dx * dx + dz * dz) <= r2;
      if (inside && !b.cleaned) {
        changed = true;
        newlyCleanedCount++;
        return {
          ...b,
          cleaned: true,
          glowUntil: now + 500,
          rotationX: b.rotationX + randRange(-Math.PI / 12, Math.PI / 12),
          rotationY: b.rotationY + randRange(-Math.PI / 12, Math.PI / 12),
          rotationZ: b.rotationZ + randRange(-Math.PI / 12, Math.PI / 12)
        };
      }
      return b;
    });

    if (changed) {
      const allCleaned = newBones.every(b => b.cleaned);
      set({ boneFragments: newBones, allCleaned });
      if (allCleaned) {
        setTimeout(() => {
          get().triggerAssembly();
        }, 600);
      }
      return true;
    }
    return false;
  },

  triggerAssembly: () => {
    const state = get();
    if (state.fullyAssembled) return;
    const ripples: AssemblyRipple[] = [{
      x: 0, y: 1.2, z: 0,
      radius: 0,
      alpha: 0.5,
      life: 2,
      maxLife: 2
    }];
    set({
      assemblyRipples: ripples,
      boneFragments: state.boneFragments.map(b => ({ ...b, assembleAnimation: 0 }))
    });
    void get().fetchFossilDetail(FOSSIL_ID);
  },

  setToolSettings: (patch) => {
    set(s => ({ toolSettings: { ...s.toolSettings, ...patch } }));
  },

  fetchFossilDetail: async (id: string) => {
    set({ fossilDetailLoading: true });
    try {
      const res = await fetch(`/api/fossils/${id}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      set({ fossilDetail: data, fossilDetailLoading: false });
    } catch (e) {
      set({
        fossilDetail: {
          id,
          speciesName: '霸王龙',
          latinName: 'Tyrannosaurus rex',
          period: '白垩纪晚期（约6800万年前）',
          location: '美国蒙大拿州',
          description: '骨骼完整度85%，含有罕见的尾椎骨愈合痕迹'
        },
        fossilDetailLoading: false
      });
    }
  },

  resetScene: () => {
    get().initScene();
  },

  updateAnimations: (dt: number, now: number) => {
    const state = get();
    let dirty = false;

    const newSand = state.sandParticles.map(p => {
      if (p.removing) {
        dirty = true;
        const np = p.removeProgress + dt * 3.5;
        const newAlpha = Math.max(0, p.alpha - dt * 2.5);
        const newBursts = p.burstParticles?.map(bp => ({ ...bp, life: bp.life - dt })).filter(bp => bp.life > 0);
        if (np >= 1 && (!newBursts || newBursts.length === 0)) {
          return { ...p, alpha: 0, removeProgress: 1, burstParticles: [] };
        }
        return { ...p, alpha: newAlpha, removeProgress: np, burstParticles: newBursts };
      }
      return p;
    }).filter(p => !(p.removing && p.removeProgress >= 1 && (!p.burstParticles || p.burstParticles.length === 0)));

    if (dirty || newSand.length !== state.sandParticles.length) {
      dirty = true;
    }

    let fullyAssembled = state.fullyAssembled;
    const newBones = state.boneFragments.map(b => {
      let nb = b;
      if (b.cleaned && b.liftOffset < 0.5) {
        dirty = true;
        nb = { ...nb, liftOffset: Math.min(0.5, b.liftOffset + dt * 1.2) };
      }
      if (state.allCleaned && !b.assembled) {
        dirty = true;
        const tNext = Math.min(1, (b.assembleAnimation || 0) + dt * 0.7);
        const easeT = easeOutCubic(tNext);
        const srcX = b.originalX;
        const srcZ = b.originalZ;
        const srcY = b.originalY + b.liftOffset;
        const ix = lerp(srcX, b.targetX, easeT);
        const iy = lerp(srcY, b.targetY, easeT);
        const iz = lerp(srcZ, b.targetZ, easeT);
        const irx = lerp(b.rotationX, b.targetRotX, easeT);
        const iry = lerp(b.rotationY, b.targetRotY, easeT);
        const irz = lerp(b.rotationZ, b.targetRotZ, easeT);
        nb = {
          ...nb,
          x: ix, y: iy, z: iz,
          rotationX: irx, rotationY: iry, rotationZ: irz,
          assembleAnimation: tNext,
          assembled: tNext >= 1
        };
      }
      return nb;
    });

    if (newBones.length > 0 && newBones.every(b => b.assembled) && !fullyAssembled) {
      fullyAssembled = true;
      dirty = true;
    }

    if (fullyAssembled) {
      const phase = (now / 1000) * Math.PI;
      const floatY = Math.sin(phase) * 0.05;
      for (let i = 0; i < newBones.length; i++) {
        const b = newBones[i];
        const targetFloat = b.targetY + 1.0 + floatY;
        if (Math.abs(b.y - targetFloat) > 0.001) {
          dirty = true;
          newBones[i] = { ...b, y: targetFloat };
        }
      }
    }

    const newRipples = state.assemblyRipples.map(r => {
      const life = r.life - dt;
      const t = 1 - life / r.maxLife;
      return {
        ...r,
        life,
        radius: lerp(0, 5, t),
        alpha: lerp(0.5, 0, t)
      };
    }).filter(r => r.life > 0);
    if (newRipples.length !== state.assemblyRipples.length) dirty = true;

    const newStars = state.starParticles.map(s => {
      const ny = s.y + Math.sin((now / 1000) * s.drift + s.x) * 0.002;
      return { ...s, y: ny };
    });
    if (newStars.length > 0) dirty = true;

    if (dirty || fullyAssembled !== state.fullyAssembled) {
      set({
        sandParticles: dirty ? newSand : state.sandParticles,
        boneFragments: newBones,
        assemblyRipples: newRipples,
        starParticles: newStars,
        fullyAssembled
      });
    }
  }
}));
