export type BehaviorType = 'swaying' | 'stationary' | 'wandering';

export type ActivityState = 'foraging' | 'floating' | 'moving';

export type GeometryType = 'sphere' | 'box';

export interface SpeciesConfig {
  id: string;
  name: string;
  color: string;
  minCount: number;
  maxCount: number;
  minSize: number;
  maxSize: number;
  behavior: BehaviorType;
  geometryType: GeometryType;
}

export interface Organism {
  id: string;
  speciesId: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  activityState: ActivityState;
  basePosition: [number, number, number];
  phase: number;
  velocity: [number, number, number];
  swayPeriod: number;
  swayAmplitude: number;
}

export interface EnvironmentData {
  temperature: number;
  h2s: number;
  o2: number;
}

export interface PopulationStats {
  speciesId: string;
  count: number;
}

export interface SceneConfig {
  sceneWidth: number;
  sceneDepth: number;
  ventPosition: [number, number, number];
  isSectionView: boolean;
}

export interface InfoBubble {
  id: string;
  organismId: string;
  position: [number, number, number];
  content: {
    name: string;
    count: number;
    activityState: ActivityState;
  };
  opacity: number;
  createdAt: number;
}

export interface SceneState {
  isSectionView: boolean;
  toggleSectionView: () => void;
}

export interface BioStore {
  organisms: Organism[];
  environmentData: EnvironmentData;
  infoBubbles: InfoBubble[];
  speciesConfigs: SpeciesConfig[];
  initOrganisms: (ventPosition: [number, number, number]) => void;
  updateOrganisms: (delta: number, bounds: { width: number; depth: number }) => void;
  updateEnvironmentData: () => void;
  addInfoBubble: (organismId: string) => void;
  updateInfoBubbles: () => void;
  getPopulationStats: () => PopulationStats[];
  getSpeciesConfig: (speciesId: string) => SpeciesConfig | undefined;
}
