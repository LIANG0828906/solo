import { create } from 'zustand';
import type { AppStore, LightConfig, MaterialConfig, DesignScheme } from '../types';

const DEFAULT_LIGHTS: LightConfig[] = [
  {
    id: 'main-light',
    type: 'main',
    name: '主灯',
    position: { x: 0, y: 3, z: 0 },
    colorTemp: 4500,
    intensity: 1.0,
    enabled: true,
  },
  {
    id: 'fill-light',
    type: 'fill',
    name: '辅助灯',
    position: { x: 2, y: 2, z: 2 },
    colorTemp: 4000,
    intensity: 0.6,
    enabled: true,
  },
  {
    id: 'spot-light',
    type: 'spot',
    name: '射灯',
    position: { x: 0, y: 2.5, z: -2 },
    colorTemp: 5000,
    intensity: 0.8,
    angle: 30,
    penumbra: 0.5,
    enabled: true,
  },
];

const DEFAULT_MATERIALS: Record<string, MaterialConfig> = {
  wall: {
    id: 'wall',
    name: '墙面',
    color: '#f5f5f5',
    roughness: 0.8,
    metalness: 0.1,
    bumpScale: 0.0,
  },
  floor: {
    id: 'floor',
    name: '地面',
    color: '#8b7355',
    roughness: 0.6,
    metalness: 0.0,
    bumpScale: 0.1,
  },
  ceiling: {
    id: 'ceiling',
    name: '天花板',
    color: '#ffffff',
    roughness: 0.9,
    metalness: 0.0,
    bumpScale: 0.0,
  },
  sofa: {
    id: 'sofa',
    name: '沙发',
    color: '#4a5568',
    roughness: 0.7,
    metalness: 0.0,
    bumpScale: 0.0,
  },
  coffeeTable: {
    id: 'coffeeTable',
    name: '茶几',
    color: '#2d3748',
    roughness: 0.3,
    metalness: 0.2,
    bumpScale: 0.0,
  },
  carpet: {
    id: 'carpet',
    name: '地毯',
    color: '#c53030',
    roughness: 0.9,
    metalness: 0.0,
    bumpScale: 0.2,
  },
};

const DEFAULT_SCHEMES: DesignScheme[] = [
  {
    id: 'default-scheme',
    name: '默认方案',
    thumbnail: '',
    lights: DEFAULT_LIGHTS,
    materials: DEFAULT_MATERIALS,
    createdAt: Date.now(),
  },
];

const lerp = (start: number, end: number, t: number): number => {
  return start + (end - start) * t;
};

const lerpPosition = (
  start: { x: number; y: number; z: number },
  end: { x: number; y: number; z: number },
  t: number
): { x: number; y: number; z: number } => ({
  x: lerp(start.x, end.x, t),
  y: lerp(start.y, end.y, t),
  z: lerp(start.z, end.z, t),
});

const easeInOutQuad = (t: number): number => {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
};

export const useAppStore = create<AppStore>((set, get) => ({
  selectedObjectId: null,
  activeSchemeId: 'default-scheme',
  schemes: DEFAULT_SCHEMES,
  lights: DEFAULT_LIGHTS,
  materials: DEFAULT_MATERIALS,
  isMaterialPanelOpen: false,

  setSelectedObjectId: (id) => set({ selectedObjectId: id }),

  setActiveSchemeId: (id) => set({ activeSchemeId: id }),

  setSchemes: (schemes) => set({ schemes }),

  setLights: (lights) => set({ lights }),

  updateLight: (id, config) =>
    set((state) => ({
      lights: state.lights.map((light) =>
        light.id === id ? { ...light, ...config } : light
      ),
    })),

  setMaterials: (materials) => set({ materials }),

  updateMaterial: (key, config) =>
    set((state) => ({
      materials: {
        ...state.materials,
        [key]: { ...state.materials[key], ...config },
      },
    })),

  setIsMaterialPanelOpen: (open) => set({ isMaterialPanelOpen: open }),

  transitionToScheme: async (schemeId: string) => {
    const { schemes, lights: currentLights, materials: currentMaterials } = get();
    const targetScheme = schemes.find((s) => s.id === schemeId);

    if (!targetScheme) {
      return;
    }

    const duration = 500;
    const startTime = performance.now();

    return new Promise((resolve) => {
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeInOutQuad(progress);

        const interpolatedLights = targetScheme.lights.map((targetLight) => {
          const currentLight = currentLights.find((l) => l.id === targetLight.id);
          if (!currentLight) return targetLight;

          return {
            ...targetLight,
            colorTemp: lerp(
              currentLight.colorTemp,
              targetLight.colorTemp,
              easedProgress
            ),
            intensity: lerp(
              currentLight.intensity,
              targetLight.intensity,
              easedProgress
            ),
            position: lerpPosition(
              currentLight.position,
              targetLight.position,
              easedProgress
            ),
            angle:
              currentLight.angle !== undefined && targetLight.angle !== undefined
                ? lerp(currentLight.angle, targetLight.angle, easedProgress)
                : targetLight.angle,
            penumbra:
              currentLight.penumbra !== undefined && targetLight.penumbra !== undefined
                ? lerp(currentLight.penumbra, targetLight.penumbra, easedProgress)
                : targetLight.penumbra,
          };
        });

        const interpolatedMaterials: Record<string, MaterialConfig> = {};
        Object.keys(targetScheme.materials).forEach((key) => {
          const targetMat = targetScheme.materials[key];
          const currentMat = currentMaterials[key];

          if (!currentMat) {
            interpolatedMaterials[key] = targetMat;
            return;
          }

          interpolatedMaterials[key] = {
            ...targetMat,
            roughness: lerp(currentMat.roughness, targetMat.roughness, easedProgress),
            metalness: lerp(currentMat.metalness, targetMat.metalness, easedProgress),
            bumpScale: lerp(currentMat.bumpScale, targetMat.bumpScale, easedProgress),
          };
        });

        set({
          lights: interpolatedLights,
          materials: interpolatedMaterials,
          activeSchemeId: schemeId,
        });

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  },
}));
