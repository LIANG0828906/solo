import { create } from 'zustand';

export type LightMode = 'warm' | 'cool' | 'smart';

export interface Pedestrian {
  id: string;
  x: number;
  z: number;
  speed: number;
  targetX: number;
  targetZ: number;
  path: { x: number; z: number }[];
  pathIndex: number;
}

export interface LightPost {
  id: string;
  x: number;
  z: number;
  height: number;
}

export interface SceneState {
  lightMode: LightMode;
  colorTemperature: number;
  lightColor: string;
  lightIntensity: number;
  spotRadius: number;
  pedestrians: Pedestrian[];
  attractorPoint: { x: number; z: number } | null;
  lightPosts: LightPost[];
  pedestrianCount: number;
  heatmapData: number[][];
  
  setLightMode: (mode: LightMode) => void;
  setAttractorPoint: (point: { x: number; z: number } | null) => void;
  setPedestrians: (pedestrians: Pedestrian[]) => void;
  setHeatmapData: (data: number[][]) => void;
  setLightPosts: (posts: LightPost[]) => void;
  setPedestrianCount: (count: number) => void;
  exportConfig: () => object;
  importConfig: (config: any) => void;
}

const warmColor = '#FFB74D';
const coolColor = '#B0BEC5';
const smartColor = '#7E57C2';

const generateLightPosts = (): LightPost[] => {
  const posts: LightPost[] = [];
  const gridSize = 4;
  const spacing = 20;
  const offset = -((gridSize - 1) * spacing) / 2;
  
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      posts.push({
        id: `post-${i}-${j}`,
        x: offset + i * spacing,
        z: offset + j * spacing,
        height: 4,
      });
    }
  }
  return posts;
};

const generatePedestrians = (count: number): Pedestrian[] => {
  const pedestrians: Pedestrian[] = [];
  const gridSize = 4;
  const spacing = 20;
  const offset = -((gridSize - 1) * spacing) / 2;
  const roadWidth = 8;
  
  for (let i = 0; i < count; i++) {
    const isHorizontal = Math.random() > 0.5;
    const lane = Math.floor(Math.random() * 3) - 1;
    const startPos = Math.random() * (gridSize - 1) * spacing + offset;
    
    let x: number, z: number, targetX: number, targetZ: number;
    
    if (isHorizontal) {
      x = offset - 5;
      z = offset + Math.floor(Math.random() * gridSize) * spacing + lane * (roadWidth / 3);
      targetX = offset + (gridSize - 1) * spacing + 5;
      targetZ = z;
    } else {
      x = offset + Math.floor(Math.random() * gridSize) * spacing + lane * (roadWidth / 3);
      z = offset - 5;
      targetX = x;
      targetZ = offset + (gridSize - 1) * spacing + 5;
    }
    
    pedestrians.push({
      id: `ped-${i}-${Date.now()}`,
      x,
      z,
      speed: 0.2 + Math.random() * 0.3,
      targetX,
      targetZ,
      path: [{ x, z }, { x: targetX, z: targetZ }],
      pathIndex: 0,
    });
  }
  
  return pedestrians;
};

const useSceneStore = create<SceneState>((set, get) => ({
  lightMode: 'warm',
  colorTemperature: 3000,
  lightColor: warmColor,
  lightIntensity: 0.8,
  spotRadius: 2,
  pedestrians: [],
  attractorPoint: null,
  lightPosts: generateLightPosts(),
  pedestrianCount: 30,
  heatmapData: [],
  
  setLightMode: (mode: LightMode) => {
    let color: string;
    let temp: number;
    let intensity: number;
    let radius: number;
    
    switch (mode) {
      case 'warm':
        color = warmColor;
        temp = 3000;
        intensity = 0.8;
        radius = 2;
        break;
      case 'cool':
        color = coolColor;
        temp = 5000;
        intensity = 1.0;
        radius = 4;
        break;
      case 'smart':
        color = smartColor;
        temp = 4000;
        intensity = 0.9;
        radius = 3;
        break;
      default:
        color = warmColor;
        temp = 3000;
        intensity = 0.8;
        radius = 2;
    }
    
    set({ lightMode: mode, lightColor: color, colorTemperature: temp, lightIntensity: intensity, spotRadius: radius });
  },
  
  setAttractorPoint: (point) => set({ attractorPoint: point }),
  
  setPedestrians: (pedestrians) => set({ pedestrians }),
  
  setHeatmapData: (data) => set({ heatmapData: data }),
  
  setLightPosts: (posts) => set({ lightPosts: posts }),
  
  setPedestrianCount: (count) => set({ pedestrianCount: count }),
  
  exportConfig: () => {
    const state = get();
    return {
      lightMode: state.lightMode,
      colorTemperature: state.colorTemperature,
      lightColor: state.lightColor,
      lightIntensity: state.lightIntensity,
      spotRadius: state.spotRadius,
      lightPosts: state.lightPosts,
      pedestrianCount: state.pedestrianCount,
      attractorPoint: state.attractorPoint,
      version: '1.0',
      exportTime: new Date().toISOString(),
    };
  },
  
  importConfig: (config) => {
    set({
      lightMode: config.lightMode || 'warm',
      colorTemperature: config.colorTemperature || 3000,
      lightColor: config.lightColor || warmColor,
      lightIntensity: config.lightIntensity || 0.8,
      spotRadius: config.spotRadius || 2,
      lightPosts: config.lightPosts || generateLightPosts(),
      pedestrianCount: config.pedestrianCount || 30,
      attractorPoint: config.attractorPoint || null,
    });
  },
}));

export default useSceneStore;
