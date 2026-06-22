export interface StarData {
  id: string;
  name: string;
  color: string;
  radius: number;
  brightness: number;
  position: { x: number; y: number; z: number };
}

export interface ConnectionData {
  id: string;
  starIds: [string, string];
  color: string;
}

export interface ConstellationData {
  id: string;
  name: string;
  stars: StarData[];
  connections: ConnectionData[];
  thumbnail: string;
  createdAt: number;
}

export interface SceneRendererAPI {
  addStar(star: StarData): void;
  removeStar(id: string): void;
  addConnection(connection: ConnectionData, stars: [StarData, StarData]): void;
  removeConnection(id: string): void;
  selectStar(id: string, selected: boolean): void;
  setView(options: { damping?: number; inertia?: number; zoom?: number }): void;
  captureSnapshot(): string;
  resize(width: number, height: number): void;
  dispose(): void;
}
