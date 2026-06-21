import { create } from 'zustand';
import * as THREE from 'three';

export interface PlantNode {
  id: string;
  type: 'trunk' | 'branch' | 'leaf';
  parentId: string | null;
  depth: number;
  position: THREE.Vector3;
  baseRotation: THREE.Euler;
  currentRotation: THREE.Euler;
  length: number;
  radius: number;
  elasticity: number;
  damping: number;
  windFactor: number;
  angularVelocity: number;
  currentBend: number;
  children: string[];
  growthProgress: number;
  leafSwingPhase: number;
}

export interface Plant {
  id: string;
  position: THREE.Vector3;
  nodes: Map<string, PlantNode>;
  rootNodeId: string;
  maxDepth: number;
}

export interface SupportConnection {
  id: string;
  plantAId: string;
  nodeAId: string;
  plantBId: string;
  nodeBId: string;
  tension: number;
  springRestLength: number;
  springConstant: number;
  damping: number;
}

export interface EnvironmentParams {
  windStrength: number;
  windDirection: number;
  lightIntensity: number;
  gravityDirection: THREE.Vector3;
  growthDirection: THREE.Vector3;
  targetGrowthDirection: THREE.Vector3;
}

interface PlantState {
  plants: Plant[];
  environment: EnvironmentParams;
  selectedNodeId: string | null;
  selectedPlantId: string | null;
  supportConnections: SupportConnection[];
  isGrowthAnimating: boolean;
  growthStartTime: number;
  performanceLevel: 'high' | 'medium' | 'low';
  leafUpdateInterval: 1 | 2;
  leafSwingIterations: number;
  leafDetailLevel: 'full' | 'reduced';
  textureResolution: 256 | 128;
  totalNodeCount: number;
  fps: number;
  setWindStrength: (v: number) => void;
  setWindDirection: (v: number) => void;
  setLightIntensity: (v: number) => void;
  setGravityDirection: (v: THREE.Vector3) => void;
  setTargetGrowthDirection: (v: THREE.Vector3) => void;
  selectNode: (plantId: string | null, nodeId: string | null) => void;
  updateNodePhysics: (nodeId: string, updates: Partial<Pick<PlantNode, 'elasticity' | 'damping' | 'windFactor'>>) => void;
  addPlant: (position: THREE.Vector3) => boolean;
  addSupportConnection: (conn: SupportConnection) => void;
  removeSupportConnection: (id: string) => void;
  clearSupportConnections: () => void;
  startGrowthAnimation: () => void;
  updatePlants: (plants: Plant[]) => void;
  updateNode: (plantId: string, nodeId: string, updates: Partial<PlantNode>) => void;
  setPerformanceLevel: (level: 'high' | 'medium' | 'low') => void;
  setLeafUpdateInterval: (interval: 1 | 2) => void;
  setLeafSwingIterations: (iterations: number) => void;
  setLeafDetailLevel: (level: 'full' | 'reduced') => void;
  setTextureResolution: (res: 256 | 128) => void;
  updateTotalNodeCount: (count: number) => void;
  updateFps: (fps: number) => void;
  resetScene: () => void;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function createDefaultPlant(basePosition: THREE.Vector3): Plant {
  const nodes = new Map<string, PlantNode>();
  const plantId = generateId();

  const trunkId = `trunk-${plantId}`;
  const trunkNode: PlantNode = {
    id: trunkId,
    type: 'trunk',
    parentId: null,
    depth: 0,
    position: basePosition.clone(),
    baseRotation: new THREE.Euler(0, 0, 0),
    currentRotation: new THREE.Euler(0, 0, 0),
    length: 5,
    radius: 0.3,
    elasticity: 0.8,
    damping: 0.3,
    windFactor: 1.0,
    angularVelocity: 0,
    currentBend: 0,
    children: [],
    growthProgress: 0,
    leafSwingPhase: 0,
  };
  nodes.set(trunkId, trunkNode);

  const branchAngles = [-0.5, 0, 0.5];
  const branchHeights = [3.5, 4, 3];
  const branchLengths = [2, 2.2, 1.8];

  for (let i = 0; i < 3; i++) {
    const branchId = `branch-${plantId}-${i}`;
    const branchNode: PlantNode = {
      id: branchId,
      type: 'branch',
      parentId: trunkId,
      depth: 1,
      position: new THREE.Vector3(0, branchHeights[i], 0).add(basePosition),
      baseRotation: new THREE.Euler(0.3, branchAngles[i], 0),
      currentRotation: new THREE.Euler(0.3, branchAngles[i], 0),
      length: branchLengths[i],
      radius: 0.15,
      elasticity: 1.0,
      damping: 0.4,
      windFactor: 0.8,
      angularVelocity: 0,
      currentBend: 0,
      children: [],
      growthProgress: 0,
      leafSwingPhase: 0,
    };
    nodes.set(branchId, branchNode);
    trunkNode.children.push(branchId);

    for (let j = 0; j < 3; j++) {
      const leafId = `leaf-${plantId}-${i}-${j}`;
      const leafAngle = (j - 1) * 0.8 + branchAngles[i];
      const leafNode: PlantNode = {
        id: leafId,
        type: 'leaf',
        parentId: branchId,
        depth: 2,
        position: new THREE.Vector3(0, branchHeights[i] + 0.5, 0).add(basePosition),
        baseRotation: new THREE.Euler(0.2, leafAngle, 0),
        currentRotation: new THREE.Euler(0.2, leafAngle, 0),
        length: 1.2,
        radius: 0,
        elasticity: 1.5,
        damping: 0.5,
        windFactor: 1.2,
        angularVelocity: 0,
        currentBend: 0,
        children: [],
        growthProgress: 0,
        leafSwingPhase: Math.random() * Math.PI * 2,
      };
      nodes.set(leafId, leafNode);
      branchNode.children.push(leafId);
    }
  }

  return {
    id: plantId,
    position: basePosition.clone(),
    nodes,
    rootNodeId: trunkId,
    maxDepth: 2,
  };
}

const defaultEnvironment: EnvironmentParams = {
  windStrength: 5,
  windDirection: 0,
  lightIntensity: 1.5,
  gravityDirection: new THREE.Vector3(0, -1, 0),
  growthDirection: new THREE.Vector3(0, 1, 0),
  targetGrowthDirection: new THREE.Vector3(0, 1, 0),
};

const initialPlant = createDefaultPlant(new THREE.Vector3(0, 0, 0));

export const usePlantStore = create<PlantState>((set, get) => {
  return {
    plants: [initialPlant],
    environment: defaultEnvironment,
    selectedNodeId: null,
    selectedPlantId: null,
    supportConnections: [],
    isGrowthAnimating: true,
    growthStartTime: performance.now(),
    performanceLevel: 'high',
    leafUpdateInterval: 1,
    leafSwingIterations: 8,
    leafDetailLevel: 'full',
    textureResolution: 256,
    totalNodeCount: initialPlant.nodes.size,
    fps: 60,

    setWindStrength: (v: number) => set((state) => ({
      environment: { ...state.environment, windStrength: v },
    })),

    setWindDirection: (v: number) => set((state) => ({
      environment: { ...state.environment, windDirection: v },
    })),

    setLightIntensity: (v: number) => set((state) => ({
      environment: { ...state.environment, lightIntensity: v },
    })),

    setGravityDirection: (v: THREE.Vector3) => set((state) => ({
      environment: { ...state.environment, gravityDirection: v.clone() },
    })),

    setTargetGrowthDirection: (v: THREE.Vector3) => set((state) => ({
      environment: { ...state.environment, targetGrowthDirection: v.clone() },
    })),

    selectNode: (plantId: string | null, nodeId: string | null) => set({
      selectedPlantId: plantId,
      selectedNodeId: nodeId,
    }),

    updateNodePhysics: (nodeId: string, updates) => {
      const { plants } = get();
      const newPlants = plants.map((plant) => {
        if (!plant.nodes.has(nodeId)) return plant;
        const newNodes = new Map(plant.nodes);
        const node = newNodes.get(nodeId)!;
        newNodes.set(nodeId, { ...node, ...updates });
        return { ...plant, nodes: newNodes };
      });
      set({ plants: newPlants });
    },

    addPlant: (position: THREE.Vector3) => {
      const { plants } = get();
      if (plants.length >= 4) return false;
      
      const minDistance = 3;
      for (const plant of plants) {
        if (plant.position.distanceTo(position) < minDistance) {
          return false;
        }
      }
      
      const newPlant = createDefaultPlant(position);
      set((state) => ({
        plants: [...state.plants, newPlant],
        totalNodeCount: state.totalNodeCount + newPlant.nodes.size,
      }));
      return true;
    },

    addSupportConnection: (conn: SupportConnection) => {
      const { supportConnections } = get();
      const exists = supportConnections.some((c) => c.id === conn.id);
      if (exists) return;
      set((state) => ({
        supportConnections: [...state.supportConnections, conn],
      }));
    },

    removeSupportConnection: (id: string) => {
      set((state) => ({
        supportConnections: state.supportConnections.filter((c) => c.id !== id),
      }));
    },

    clearSupportConnections: () => set({ supportConnections: [] }),

    startGrowthAnimation: () => set({
      isGrowthAnimating: true,
      growthStartTime: performance.now(),
    }),

    updatePlants: (plants: Plant[]) => set({ plants }),

    updateNode: (plantId: string, nodeId: string, updates: Partial<PlantNode>) => {
      const { plants } = get();
      const newPlants = plants.map((plant) => {
        if (plant.id !== plantId) return plant;
        if (!plant.nodes.has(nodeId)) return plant;
        const newNodes = new Map(plant.nodes);
        const node = newNodes.get(nodeId)!;
        newNodes.set(nodeId, { ...node, ...updates });
        return { ...plant, nodes: newNodes };
      });
      set({ plants: newPlants });
    },

    setPerformanceLevel: (level) => set({ performanceLevel: level }),

    setLeafUpdateInterval: (interval) => set({ leafUpdateInterval: interval }),

    setLeafSwingIterations: (iterations) => set({ leafSwingIterations: iterations }),

    setLeafDetailLevel: (level) => set({ leafDetailLevel: level }),

    setTextureResolution: (res) => set({ textureResolution: res }),

    updateTotalNodeCount: (count) => set({ totalNodeCount: count }),

    updateFps: (fps) => set({ fps }),

    resetScene: () => {
      const { plants } = get();
      const resetPlants = plants.map((plant) => {
        const newNodes = new Map(plant.nodes);
        newNodes.forEach((node) => {
          newNodes.set(node.id, {
            ...node,
            currentBend: 0,
            angularVelocity: 0,
            currentRotation: node.baseRotation.clone(),
            growthProgress: 0,
          });
        });
        return { ...plant, nodes: newNodes };
      });
      set({
        plants: resetPlants,
        supportConnections: [],
        isGrowthAnimating: true,
        growthStartTime: performance.now(),
        selectedNodeId: null,
        selectedPlantId: null,
      });
    },
  };
});
