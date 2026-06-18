export interface TreeNode {
  id: number;
  x: number;
  z: number;
  speciesName: string;
  era: string;
}

export interface RockNode {
  id: number;
  x: number;
  z: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
}

export interface TreasureNode {
  id: number;
  x: number;
  z: number;
  speciesName: string;
  era: string;
}

export interface EchoInfo {
  angle: number;
  intensity: number;
}

export interface ServerData {
  trees: TreeNode[];
  rocks: RockNode[];
  treasures: TreasureNode[];
}

export interface ReflectionPoint {
  x: number;
  z: number;
  intensity: number;
}

export interface AudioSourceResult {
  source: OscillatorNode;
  gainNode: GainNode;
}
