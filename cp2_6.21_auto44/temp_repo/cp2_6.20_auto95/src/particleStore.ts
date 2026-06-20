import { create } from 'zustand';
import { GalaxyParams, GalaxyType, ParticlePosition, PresetTheme, DEFAULT_PARAMS } from './types';
import { generateParticles, interpolateParticles, updateParticleRotation } from './utils/galaxyGenerators';
import { encodeParamsToURL, decodeURLToParams, setURLHash } from './utils/urlUtils';

export const PRESET_THEMES: PresetTheme[] = [
  {
    id: 'milky-way',
    name: '银河',
    params: {
      type: GalaxyType.SPIRAL,
      rotationSpeed: 45,
      gravityStrength: 60,
      dispersionRange: 25,
      particleCount: 3000
    }
  },
  {
    id: 'andromeda',
    name: '仙女座',
    params: {
      type: GalaxyType.BARRED,
      rotationSpeed: 35,
      gravityStrength: 75,
      dispersionRange: 20,
      particleCount: 4000
    }
  },
  {
    id: 'pinwheel',
    name: '风车',
    params: {
      type: GalaxyType.SPIRAL,
      rotationSpeed: 70,
      gravityStrength: 40,
      dispersionRange: 35,
      particleCount: 3500
    }
  }
];

interface ParticleState {
  params: GalaxyParams;
  particles: ParticlePosition[];
  targetParticles: ParticlePosition[];
  isTransitioning: boolean;
  transitionProgress: number;
  transitionStartTime: number;
  fps: number;
  activePresetId: string | null;

  setParams: (params: Partial<GalaxyParams>) => void;
  generateParticlesAction: (type: GalaxyType, count: number, dispersion: number) => void;
  updateParticlePositions: (deltaTime: number) => void;
  startTransition: (newType: GalaxyType) => void;
  updateTransition: (currentTime: number) => void;
  applyPreset: (preset: PresetTheme) => void;
  encodeToURL: () => string;
  decodeFromURL: (hash: string) => void;
  setFps: (fps: number) => void;
  initFromURL: () => void;
}

const TRANSITION_DURATION = 1500;

export const useParticleStore = create<ParticleState>((set, get) => {
  const initialParticles = generateParticles(
    DEFAULT_PARAMS.type,
    DEFAULT_PARAMS.particleCount,
    DEFAULT_PARAMS.dispersionRange
  );

  return {
    params: DEFAULT_PARAMS,
    particles: initialParticles,
    targetParticles: initialParticles,
    isTransitioning: false,
    transitionProgress: 0,
    transitionStartTime: 0,
    fps: 60,
    activePresetId: null,

    setParams: (newParams) => {
      const current = get();
      const updatedParams = { ...current.params, ...newParams };
      
      const needsRegenerate = 
        newParams.type !== undefined || 
        newParams.particleCount !== undefined ||
        newParams.dispersionRange !== undefined;

      if (needsRegenerate && !current.isTransitioning) {
        const type = newParams.type || current.params.type;
        const count = newParams.particleCount || current.params.particleCount;
        const dispersion = newParams.dispersionRange !== undefined 
          ? newParams.dispersionRange 
          : current.params.dispersionRange;
        
        const newParticles = generateParticles(type, count, dispersion);
        
        set({
          params: updatedParams,
          particles: newParticles,
          targetParticles: newParticles,
          activePresetId: null
        });
      } else {
        set({ params: updatedParams, activePresetId: null });
      }
    },

    generateParticlesAction: (type, count, dispersion) => {
      const newParticles = generateParticles(type, count, dispersion);
      set({
        particles: newParticles,
        targetParticles: newParticles,
        isTransitioning: false,
        transitionProgress: 0
      });
    },

    updateParticlePositions: (deltaTime) => {
      const { params, particles, isTransitioning } = get();
      
      if (isTransitioning) return;

      const updatedParticles = updateParticleRotation(
        particles,
        params.rotationSpeed,
        params.gravityStrength,
        deltaTime
      );

      set({ particles: updatedParticles });
    },

    startTransition: (newType) => {
      const { params } = get();
      
      const targetParticles = generateParticles(
        newType,
        params.particleCount,
        params.dispersionRange
      );

      set({
        params: { ...params, type: newType },
        targetParticles,
        isTransitioning: true,
        transitionProgress: 0,
        transitionStartTime: performance.now(),
        activePresetId: null
      });
    },

    updateTransition: (currentTime) => {
      const { isTransitioning, transitionStartTime, particles, targetParticles } = get();
      
      if (!isTransitioning) return;

      const elapsed = currentTime - transitionStartTime;
      const progress = Math.min(1, elapsed / TRANSITION_DURATION);

      if (progress >= 1) {
        set({
          particles: targetParticles,
          isTransitioning: false,
          transitionProgress: 1
        });
      } else {
        const interpolated = interpolateParticles(particles, targetParticles, progress);
        set({
          particles: interpolated,
          transitionProgress: progress
        });
      }
    },

    applyPreset: (preset) => {
      const { particles: currentParticles } = get();
      
      const targetParticles = generateParticles(
        preset.params.type,
        preset.params.particleCount,
        preset.params.dispersionRange
      );

      set({
        params: preset.params,
        targetParticles,
        isTransitioning: true,
        transitionProgress: 0,
        transitionStartTime: performance.now(),
        activePresetId: preset.id
      });

      const animateTransition = () => {
        const state = get();
        if (!state.isTransitioning) return;
        
        const elapsed = performance.now() - state.transitionStartTime;
        const progress = Math.min(1, elapsed / TRANSITION_DURATION);

        if (progress >= 1) {
          set({
            particles: state.targetParticles,
            isTransitioning: false,
            transitionProgress: 1
          });
        } else {
          const interpolated = interpolateParticles(currentParticles, state.targetParticles, progress);
          set({
            particles: interpolated,
            transitionProgress: progress
          });
          requestAnimationFrame(animateTransition);
        }
      };

      requestAnimationFrame(animateTransition);
    },

    encodeToURL: () => {
      const { params } = get();
      const encoded = encodeParamsToURL(params);
      setURLHash(encoded);
      const url = `${window.location.origin}${window.location.pathname}#${encoded}`;
      return url;
    },

    decodeFromURL: (hash) => {
      const params = decodeURLToParams(hash);
      if (params) {
        const newParticles = generateParticles(
          params.type,
          params.particleCount,
          params.dispersionRange
        );
        set({
          params,
          particles: newParticles,
          targetParticles: newParticles,
          activePresetId: null
        });
      }
    },

    setFps: (fps) => {
      set({ fps });
    },

    initFromURL: () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        get().decodeFromURL(hash);
      }
    }
  };
});
