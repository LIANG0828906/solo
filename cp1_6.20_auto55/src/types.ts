export interface ParticleParams {
  count: number;
  size: number;
  color: string;
  rotationSpeed: number;
  spreadRadius: number;
}

export interface Preset {
  id: string;
  name: string;
  params: ParticleParams;
  createdAt: string;
}

export interface ParticleInfo {
  index: number;
  position: {
    x: number;
    y: number;
    z: number;
  };
  color: string;
}

export interface SceneRef {
  getScene: () => THREE.Scene | null;
  getCamera: () => THREE.Camera | null;
}
