export interface Scene {
  id: string;
  title: string;
  description: string;
  x: number;
  y: number;
  characterIds: string[];
  propIds: string[];
  createdAt: number;
  order: number;
  nextSceneIds: string[];
}

export interface Character {
  id: string;
  name: string;
  avatarUrl: string;
  color: string;
}

export interface Prop {
  id: string;
  name: string;
  icon: string;
  color: string;
}
