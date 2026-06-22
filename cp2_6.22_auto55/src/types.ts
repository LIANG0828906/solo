import * as THREE from 'three';

// ========== 公共接口冻结定义 ==========
// 所有模块必须严格遵守此文件定义的接口，不允许随意修改

// ---------- 环境参数 ----------
export interface EnvParams {
  currentSpeed: number;       // 0 ~ 5    洋流速度
  lightIntensity: number;     // 0 ~ 100  光照强度 %
  nutrientLevel: number;      // 0 ~ 100  营养盐浓度 %
  terrainAmplitude?: number;  // 0 ~ 3    地形起伏幅度 (扩展，默认1.0)
  terrainFrequency?: number;  // 0.3 ~ 2  地形噪声频率 (扩展，默认1.0)
}

// ---------- 珊瑚类型 ----------
export type CoralType =
  | 'brain'
  | 'staghorn'
  | 'anemone'
  | 'plate'
  | 'tube'
  | 'mushroom'
  | 'fan'
  | 'bubble'
  | 'branch'
  | 'cauliflower'
  | 'vase'
  | 'fire';

export interface CoralData {
  mesh: THREE.Group;
  position: THREE.Vector3;   // 世界坐标（克隆值，非引用）
  boundingRadius: number;    // 碰撞包围球半径（世界坐标尺度）
  type: CoralType;
  baseScale: number;
  phase: number;             // 脉动相位
  baseColor: THREE.Color;
  materials: THREE.Material[];
}

// ---------- 鱼 ----------
export interface Fish {
  mesh: THREE.Group;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  acceleration: THREE.Vector3;
  scattering: boolean;
  scatterTimer: number;
  baseColor: THREE.Color;
  tailPhase: number;
  species: number;
}

// ---------- 点击返回的区域信息 ----------
export interface RegionInfo {
  coralDensity: number;      // 单位 /k㎡
  temperature: number;       // 摄氏度
  nutrients: number;         // %
  position: THREE.Vector3;   // 采样世界坐标
}

// ---------- 控制面板回调 ----------
export interface ControlPanelCallbacks {
  onParamsChange: (params: EnvParams) => void;
}

// ---------- CoralGenerator 公共接口 ----------
export interface ICoralGenerator {
  corals: CoralData[];
  generate(): CoralData[];
  update(time: number, params: EnvParams): void;
}

// ---------- FishSchool 公共接口 ----------
export interface IFishSchool {
  fishes: Fish[];
  activeRegionInfo: RegionInfo | null;
  update(time: number, dt: number, params: EnvParams): void;
  handleClick(intersect: THREE.Intersection): number;
}

// ---------- SceneInitializer 公共接口 ----------
export interface ISceneInitializer {
  terrain: THREE.Mesh;
  fog: THREE.FogExp2;
  ambientLight: THREE.AmbientLight;
  directionalLight: THREE.DirectionalLight;
  hemiLight: THREE.HemisphereLight;
  pointLights: THREE.PointLight[];
  particles: THREE.Points;
  init(): void;
  getTerrainHeight(x: number, z: number): number;
  updateParticles(time: number, speed: number): void;
  updateLighting(params: EnvParams): void;
  updateTerrainFromParams(params: EnvParams): void;
}
