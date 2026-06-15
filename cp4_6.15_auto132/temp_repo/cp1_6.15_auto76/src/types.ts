export interface LatLng {
  lat: number;
  lng: number;
}

export interface OceanCurrent {
  id: string;
  name: string;
  nameEn: string;
  start: LatLng;
  end: LatLng;
  waypoints?: LatLng[];
  speed: number;
  temperature: number;
  isWarm: boolean;
}

export interface TemperaturePoint {
  lat: number;
  lng: number;
  temperature: number;
  timestamp: number;
}

export interface TemperatureGrid {
  data: TemperaturePoint[];
  timestamp: number;
  month: number;
  year: number;
}

export interface OceanCurrentData {
  currents: OceanCurrent[];
  timestamp: number;
  month: number;
  year: number;
}

export interface LocationInfo {
  lat: number;
  lng: number;
  temperature: number;
  nearbyCurrents: {
    name: string;
    direction: string;
    distance: number;
  }[];
  trend: number[];
}
