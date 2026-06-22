export interface PlatformProps {
  gridWidth: number;
  gridHeight: number;
}

export interface EnemyProps {
  movementType: "fixed" | "patrol";
}

export interface CollectibleProps {
  score: number;
}

export interface LevelEntity {
  id: string;
  type: "platform" | "enemy" | "collectible";
  x: number;
  y: number;
  width: number;
  height: number;
  properties: PlatformProps | EnemyProps | CollectibleProps;
}

export interface LevelData {
  id: string;
  name: string;
  entities: LevelEntity[];
  createdAt: string;
  updatedAt: string;
}
