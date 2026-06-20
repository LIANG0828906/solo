import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  Lens,
  LensType,
  LensSurface,
  LightSource,
  TraceResult,
  AberrationData,
  Vector3,
  SurfaceType,
} from '../types/optical';
import { cauchyDispersion } from '../utils/opticsFormulas';

type SurfaceField = 'radius' | 'thickness' | 'refractiveIndex';

interface AppState {
  lenses: Lens[];
  lightSource: LightSource;
  traceResult: TraceResult | null;
  aberrationData: AberrationData | null;
  isTracing: boolean;
  selectedLensId: string | null;
  sidebarCollapsed: boolean;

  addLens: (type?: LensType, positionZ?: number) => void;
  removeLens: (id: string) => void;
  updateLens: (id: string, updates: Partial<Lens>) => void;
  updateLensSurface: (
    lensId: string,
    surfaceIndex: number,
    field: SurfaceField,
    value: number
  ) => void;
  reorderLenses: (lenses: Lens[]) => void;
  clearLenses: () => void;

  updateLightSource: (updates: Partial<LightSource>) => void;
  updateLightSourcePosition: (axis: keyof Vector3, value: number) => void;

  setTraceResult: (result: TraceResult | null) => void;
  setAberrationData: (data: AberrationData | null) => void;
  setIsTracing: (tracing: boolean) => void;
  setSelectedLensId: (id: string | null) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  resetAll: () => void;
}

const makeSurface = (
  radius: number,
  thickness: number,
  refractiveIndex: number,
  type: SurfaceType = 'spherical'
): LensSurface => ({
  type,
  radius,
  thickness,
  refractiveIndex,
});

const createDefaultLens = (type: LensType, positionZ: number): Lens => {
  const n550 = cauchyDispersion(550);
  if (type === 'convex') {
    return {
      id: uuidv4(),
      type,
      positionZ,
      aperture: 30,
      surfaces: [
        makeSurface(50, 5, n550),
        makeSurface(-50, 0, 1),
      ],
    };
  }
  if (type === 'concave') {
    return {
      id: uuidv4(),
      type,
      positionZ,
      aperture: 30,
      surfaces: [
        makeSurface(-50, 5, n550),
        makeSurface(50, 0, 1),
      ],
    };
  }
  return {
    id: uuidv4(),
    type: 'doublet',
    positionZ,
    aperture: 30,
    surfaces: [
      makeSurface(40, 6, cauchyDispersion(550, 1.5, 0.006)),
      makeSurface(-25, 2, cauchyDispersion(550, 1.6, 0.01)),
      makeSurface(-80, 0, 1),
    ],
  };
};

const createInitialLenses = (): Lens[] => {
  return [
    createDefaultLens('convex', 0),
    createDefaultLens('convex', 80),
  ];
};

const createDefaultLightSource = (): LightSource => ({
  position: { x: 0, y: 0, z: -200 },
  wavelengths: [400, 450, 500, 550, 600, 650, 700],
  rayCount: 50,
});

export const useAppStore = create<AppState>((set) => ({
  lenses: createInitialLenses(),
  lightSource: createDefaultLightSource(),
  traceResult: null,
  aberrationData: null,
  isTracing: false,
  selectedLensId: null,
  sidebarCollapsed: false,

  addLens: (type = 'convex', positionZ) =>
    set((state) => {
      const lastZ = state.lenses.length > 0
        ? Math.max(...state.lenses.map((l) => l.positionZ))
        : 0;
      const z = positionZ ?? lastZ + 80;
      return { lenses: [...state.lenses, createDefaultLens(type, z)] };
    }),

  removeLens: (id) =>
    set((state) => ({
      lenses: state.lenses.filter((l) => l.id !== id),
      selectedLensId: state.selectedLensId === id ? null : state.selectedLensId,
    })),

  updateLens: (id, updates) =>
    set((state) => ({
      lenses: state.lenses.map((l) =>
        l.id === id ? { ...l, ...updates } : l
      ),
    })),

  updateLensSurface: (lensId, surfaceIndex, field, value) =>
    set((state) => ({
      lenses: state.lenses.map((l) => {
        if (l.id !== lensId) return l;
        const newSurfaces = l.surfaces.map((s, i) =>
          i === surfaceIndex ? { ...s, [field]: value } : s
        );
        return { ...l, surfaces: newSurfaces };
      }),
    })),

  reorderLenses: (lenses) => set({ lenses }),

  clearLenses: () => set({ lenses: [], selectedLensId: null }),

  updateLightSource: (updates) =>
    set((state) => ({
      lightSource: { ...state.lightSource, ...updates },
    })),

  updateLightSourcePosition: (axis, value) =>
    set((state) => ({
      lightSource: {
        ...state.lightSource,
        position: { ...state.lightSource.position, [axis]: value },
      },
    })),

  setTraceResult: (result) => set({ traceResult: result }),

  setAberrationData: (data) => set({ aberrationData: data }),

  setIsTracing: (tracing) => set({ isTracing: tracing }),

  setSelectedLensId: (id) => set({ selectedLensId: id }),

  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  resetAll: () =>
    set({
      lenses: createInitialLenses(),
      lightSource: createDefaultLightSource(),
      traceResult: null,
      aberrationData: null,
      isTracing: false,
      selectedLensId: null,
      sidebarCollapsed: false,
    }),
}));
