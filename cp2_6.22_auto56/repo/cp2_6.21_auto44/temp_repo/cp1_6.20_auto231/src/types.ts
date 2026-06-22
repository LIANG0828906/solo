export interface LightDataPoint {
  id: string;
  latitude: number;
  longitude: number;
  intensity: number;
  normalizedIntensity: number;
  level: "low" | "medium" | "high" | "extreme";
  position: { x: number; y: number; z: number };
  color: string;
}

export type RenderMode = "bar" | "heatmap" | "particles";

export type ColorMap = "default" | "cool" | "warm" | "mono";

export interface SceneSettings {
  scale: number;
  opacity: number;
  colorMap: ColorMap;
}

export interface DataSummary {
  totalPoints: number;
  latRange: { min: number; max: number };
  lngRange: { min: number; max: number };
  intensityRange: { min: number; max: number };
}

export interface ExtendedPointInfo {
  populationDensity: string;
  energyConsumption: string;
  skyGlowIndex: string;
  recommendation: string;
  buildingType: string;
  riskLevel: string;
}

export type PointLevelInfo = {
  [K in LightDataPoint["level"]]: { label: string; color: string };
};

export const LEVEL_INFO: PointLevelInfo = {
  low: { label: "低", color: "#64ffda" },
  medium: { label: "中", color: "#00bcd4" },
  high: { label: "高", color: "#ffb74d" },
  extreme: { label: "极高", color: "#ff5252" },
};
