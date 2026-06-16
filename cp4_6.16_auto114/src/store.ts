import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { BuildingData, SunPosition, ShadowAnalysis, SolarGrid, AppState, AppActions } from './types';

const generateRandomBuildings = (): BuildingData[] => {
  const buildings: BuildingData[] = [];
  const colors = ['#d0d0d0', '#e8dcc8', '#c8d4e0'];
  const gridSize = 8;
  const spacing = 25;
  
  const count = Math.floor(Math.random() * 21) + 30;
  
  for (let i = 0; i < count; i++) {
    const gridX = Math.floor(Math.random() * gridSize) - gridSize / 2;
    const gridZ = Math.floor(Math.random() * gridSize) - gridSize / 2;
    
    const building: BuildingData = {
      id: uuidv4(),
      x: gridX * spacing + (Math.random() - 0.5) * 8,
      z: gridZ * spacing + (Math.random() - 0.5) * 8,
      width: 8 + Math.random() * 8,
      depth: 8 + Math.random() * 8,
      height: 10 + Math.random() * 70,
      color: colors[Math.floor(Math.random() * colors.length)]
    };
    
    const exists = buildings.some(b => 
      Math.abs(b.x - building.x) < 12 && Math.abs(b.z - building.z) < 12
    );
    
    if (!exists) {
      buildings.push(building);
    }
  }
  
  return buildings;
};

const initialSunPosition: SunPosition = {
  dayOfYear: 172,
  hour: 12,
  azimuth: 180,
  altitude: 60
};

type StoreType = AppState & AppActions;

export const useStore = create<StoreType>((set, get) => ({
  buildings: generateRandomBuildings(),
  selectedBuildingId: null,
  sunPosition: initialSunPosition,
  isLoading: false,
  loadingProgress: 0,
  showHeatmap: false,
  showSolarAnalysis: false,
  solarGridData: [],
  shadowAnalyses: [],
  totalSolarArea: 0,
  estimatedEnergy: 0,

  setBuildings: (buildings: BuildingData[]) => set({ buildings }),
  
  selectBuilding: (id: string | null) => set({ 
    selectedBuildingId: id,
    showHeatmap: false,
    showSolarAnalysis: false,
    solarGridData: [],
    shadowAnalyses: []
  }),
  
  setSunPosition: (position: SunPosition) => set({ sunPosition: position }),
  
  setLoading: (loading: boolean, progress: number = 0) => set({ 
    isLoading: loading, 
    loadingProgress: progress 
  }),
  
  setShowHeatmap: (show: boolean) => set({ showHeatmap: show }),
  
  setShowSolarAnalysis: (show: boolean) => set({ showSolarAnalysis: show }),
  
  setSolarGridData: (data: SolarGrid[]) => set({ solarGridData: data }),
  
  setShadowAnalyses: (analyses: ShadowAnalysis[]) => set({ shadowAnalyses: analyses }),
  
  setSolarStats: (area: number, energy: number) => set({ 
    totalSolarArea: area, 
    estimatedEnergy: energy 
  }),
  
  loadBuildingsFromJSON: async (file: File) => {
    const { setLoading, setBuildings, selectBuilding } = get();
    
    try {
      setLoading(true, 0);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      setLoading(true, 30);
      
      const text = await file.text();
      setLoading(true, 60);
      
      const data = JSON.parse(text);
      setLoading(true, 80);
      
      const buildings: BuildingData[] = data.map((b: any) => ({
        id: uuidv4(),
        x: b.x ?? 0,
        z: b.z ?? 0,
        width: b.width ?? 10,
        depth: b.depth ?? 10,
        height: b.height ?? 20,
        color: b.color ?? '#d0d0d0'
      }));
      
      await new Promise(resolve => setTimeout(resolve, 200));
      setLoading(true, 100);
      
      setBuildings(buildings);
      selectBuilding(null);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      setLoading(false, 0);
    } catch (error) {
      console.error('Failed to load buildings:', error);
      setLoading(false, 0);
      alert('加载建筑数据失败，请检查JSON文件格式');
    }
  }
}));
