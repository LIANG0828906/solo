import { create } from 'zustand';
import type { GeometryConfig, PresetType, RotationSpeed } from '@/types';
import { DEFAULT_GEOMETRIES, PRESETS } from '@/utils/constants';
import { Tween, easeInOutQuad } from '@/utils/animation';

interface GeometryState {
  geometries: GeometryConfig[];
  isTransitioning: boolean;
  updateGeometry: (
    id: string,
    updates: Partial<GeometryConfig>
  ) => void;
  updateGeometryNested: (
    id: string,
    key: keyof GeometryConfig,
    value: unknown
  ) => void;
  applyPreset: (presetType: PresetType) => void;
  resetToDefault: () => void;
  toggleGeometry: (id: string) => void;
  setTransitioning: (transitioning: boolean) => void;
}

const deepCloneGeometries = (
  geometries: GeometryConfig[]
): GeometryConfig[] => {
  return geometries.map((geo) => ({
    ...geo,
    rotationSpeed: { ...geo.rotationSpeed },
  }));
};

const tweenGeometryConfig = (
  from: GeometryConfig,
  to: Partial<GeometryConfig>,
  duration: number,
  onUpdate: (config: GeometryConfig) => void,
  onComplete?: () => void
): Tween => {
  const startTime = performance.now();
  const initialConfig = deepCloneGeometries([from])[0];

  const animate = () => {
    const elapsed = (performance.now() - startTime) / 1000;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeInOutQuad(progress);

    const updatedConfig = { ...initialConfig };

    (Object.keys(to) as (keyof GeometryConfig)[]).forEach((key) => {
      const targetValue = to[key];
      if (targetValue === undefined) return;

      if (key === 'rotationSpeed' && typeof targetValue === 'object') {
        const target = targetValue as Partial<RotationSpeed>;
        updatedConfig.rotationSpeed = {
          x:
            initialConfig.rotationSpeed.x +
            (target.x !== undefined
              ? (target.x - initialConfig.rotationSpeed.x) * eased
              : 0),
          y:
            initialConfig.rotationSpeed.y +
            (target.y !== undefined
              ? (target.y - initialConfig.rotationSpeed.y) * eased
              : 0),
          z:
            initialConfig.rotationSpeed.z +
            (target.z !== undefined
              ? (target.z - initialConfig.rotationSpeed.z) * eased
              : 0),
        };
      } else if (
        typeof targetValue === 'number' &&
        typeof initialConfig[key] === 'number'
      ) {
        (updatedConfig[key] as number) =
          (initialConfig[key] as number) +
          ((targetValue as number) - (initialConfig[key] as number)) * eased;
      } else {
        (updatedConfig[key] as typeof targetValue) = targetValue;
      }
    });

    onUpdate(updatedConfig);

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else if (onComplete) {
      onComplete();
    }
  };

  requestAnimationFrame(animate);

  return new Tween(0, 1, duration, () => {}, easeInOutQuad, onComplete);
};

export const useGeometryStore = create<GeometryState>((set, get) => ({
  geometries: deepCloneGeometries(DEFAULT_GEOMETRIES),
  isTransitioning: false,

  updateGeometry: (id, updates) =>
    set((state) => ({
      geometries: state.geometries.map((geo) =>
        geo.id === id
          ? {
              ...geo,
              ...updates,
              rotationSpeed: updates.rotationSpeed
                ? { ...geo.rotationSpeed, ...updates.rotationSpeed }
                : geo.rotationSpeed,
            }
          : geo
      ),
    })),

  updateGeometryNested: (id, key, value) =>
    set((state) => ({
      geometries: state.geometries.map((geo) => {
        if (geo.id !== id) return geo;

        if (key === 'rotationSpeed' && typeof value === 'object') {
          return {
            ...geo,
            rotationSpeed: { ...geo.rotationSpeed, ...(value as object) },
          };
        }

        return { ...geo, [key]: value };
      }),
    })),

  applyPreset: (presetType) => {
    const state = get();
    const preset = PRESETS[presetType];
    if (!preset) return;

    set({ isTransitioning: true });

    let completedCount = 0;
    const totalGeometries = Math.min(
      preset.geometries.length,
      state.geometries.length
    );

    const checkComplete = () => {
      completedCount++;
      if (completedCount >= totalGeometries) {
        set({ isTransitioning: false });
      }
    };

    preset.geometries.forEach((presetConfig, index) => {
      const geometry = state.geometries[index];
      if (!geometry) return;

      tweenGeometryConfig(
        geometry,
        presetConfig,
        0.5,
        (updatedConfig) => {
          set((currentState) => ({
            geometries: currentState.geometries.map((geo, i) =>
              i === index
                ? {
                    ...geo,
                    ...updatedConfig,
                    rotationSpeed: updatedConfig.rotationSpeed,
                  }
                : geo
            ),
          }));
        },
        checkComplete
      );
    });

    if (presetType === 'random') {
      PRESETS.random = {
        ...PRESETS.random,
        geometries: [
          {
            responseSensitivity: Math.random() * 1.5 + 0.5,
            rotationSpeed: {
              x: Math.random() * 2,
              y: Math.random() * 2,
              z: Math.random() * 2,
            },
            scaleMultiplier: Math.random() * 1 + 1.2,
            orbitSpeed: Math.random() * 0.6 + 0.2,
            zFloatAmplitude: Math.random() * 1.5 + 0.5,
            colorShiftIntensity: Math.random() * 0.8 + 0.2,
            orbitEccentricity: Math.random() * 0.9,
          },
          {
            responseSensitivity: Math.random() * 1.5 + 0.5,
            rotationSpeed: {
              x: Math.random() * 2,
              y: Math.random() * 2,
              z: Math.random() * 2,
            },
            scaleMultiplier: Math.random() * 1 + 1.2,
            orbitSpeed: Math.random() * 0.6 + 0.2,
            zFloatAmplitude: Math.random() * 1.5 + 0.5,
            colorShiftIntensity: Math.random() * 0.8 + 0.2,
            orbitEccentricity: Math.random() * 0.9,
          },
          {
            responseSensitivity: Math.random() * 1.5 + 0.5,
            rotationSpeed: {
              x: Math.random() * 2,
              y: Math.random() * 2,
              z: Math.random() * 2,
            },
            scaleMultiplier: Math.random() * 1 + 1.2,
            orbitSpeed: Math.random() * 0.6 + 0.2,
            zFloatAmplitude: Math.random() * 1.5 + 0.5,
            colorShiftIntensity: Math.random() * 0.8 + 0.2,
            orbitEccentricity: Math.random() * 0.9,
          },
        ],
      };
    }
  },

  resetToDefault: () => {
    const state = get();
    set({ isTransitioning: true });

    let completedCount = 0;
    const totalGeometries = DEFAULT_GEOMETRIES.length;

    const checkComplete = () => {
      completedCount++;
      if (completedCount >= totalGeometries) {
        set({ isTransitioning: false });
      }
    };

    DEFAULT_GEOMETRIES.forEach((defaultConfig, index) => {
      const currentGeometry = state.geometries[index];
      if (!currentGeometry) return;

      tweenGeometryConfig(
        currentGeometry,
        defaultConfig,
        0.5,
        (updatedConfig) => {
          set((currentState) => ({
            geometries: currentState.geometries.map((geo, i) =>
              i === index
                ? {
                    ...geo,
                    ...updatedConfig,
                    rotationSpeed: updatedConfig.rotationSpeed,
                  }
                : geo
            ),
          }));
        },
        checkComplete
      );
    });
  },

  toggleGeometry: (id) =>
    set((state) => ({
      geometries: state.geometries.map((geo) =>
        geo.id === id ? { ...geo, enabled: !geo.enabled } : geo
      ),
    })),

  setTransitioning: (isTransitioning) => set({ isTransitioning }),
}));

export const selectGeometryById = (id: string) => {
  return (state: GeometryState) =>
    state.geometries.find((geo) => geo.id === id);
};

export const selectEnabledGeometries = (state: GeometryState) =>
  state.geometries.filter((geo) => geo.enabled);
