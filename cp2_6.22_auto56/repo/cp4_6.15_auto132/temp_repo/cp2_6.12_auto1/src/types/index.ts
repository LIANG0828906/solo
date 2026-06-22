export type WeatherMode = 'sunny' | 'cloudy' | 'overcast';

export type ComponentType = 'floor' | 'wall' | 'ceiling' | 'window';

export interface RoomComponent {
  id: string;
  type: ComponentType;
  position: [number, number, number];
  size: [number, number, number];
  rotation?: [number, number, number];
}

export interface SunData {
  altitude: number;
  azimuth: number;
  directIntensity: number;
  ambientIntensity: number;
  colorTemperature: number;
}

export interface Preset {
  id: string;
  name: string;
  components: RoomComponent[];
  month: number;
  day: number;
  hour: number;
  weather: WeatherMode;
  floorReflectivity: number;
  wallRoughness: number;
  cameraPosition: [number, number, number];
}

export interface ParamState {
  month: number;
  day: number;
  hour: number;
  weather: WeatherMode;
  floorReflectivity: number;
  wallRoughness: number;
  components: RoomComponent[];
  selectedComponentId: string | null;
  activePreset: string | null;
  showHeatmap: boolean;
  latitude: number;
  longitude: number;
  setMonth: (month: number) => void;
  setDay: (day: number) => void;
  setHour: (hour: number) => void;
  setWeather: (weather: WeatherMode) => void;
  setFloorReflectivity: (value: number) => void;
  setWallRoughness: (value: number) => void;
  setSelectedComponent: (id: string | null) => void;
  addComponent: (component: Omit<RoomComponent, 'id'>) => void;
  removeComponent: (id: string) => void;
  updateComponent: (id: string, updates: Partial<RoomComponent>) => void;
  loadPreset: (preset: Preset) => void;
  setShowHeatmap: (show: boolean) => void;
}
