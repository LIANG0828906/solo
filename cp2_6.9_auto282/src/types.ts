export type JointType = 'head' | 'upperArm' | 'lowerArm' | 'leg';

export type PartType = 'head' | 'upperBody' | 'lowerBody' | 'leftArm' | 'rightArm' | 'leftLeg' | 'rightLeg';

export type CharacterRole = '生' | '旦' | '净' | '丑';

export interface Joint {
  id: string;
  type: JointType;
  angle: number;
  minAngle: number;
  maxAngle: number;
  x: number;
  y: number;
  connectedTo?: string;
}

export interface CharacterPart {
  id: string;
  type: PartType;
  x: number;
  y: number;
  rotation: number;
  width: number;
  height: number;
  color: string;
  connected: boolean;
  jointId?: string;
}

export interface PuppetCharacter {
  id: string;
  name: string;
  role: CharacterRole;
  parts: CharacterPart[];
  joints: Joint[];
  position: { x: number; y: number };
  isOnStage: boolean;
}

export interface ControlFrame {
  timestamp: number;
  position: { x: number; y: number };
  jointAngles: Record<string, number>;
}

export interface ControlPoint {
  id: string;
  characterId: string | null;
  sequence: ControlFrame[];
  isRecording: boolean;
  isPlaying: boolean;
  startTime: number;
  duration: number;
  name: string;
}

export interface StageState {
  lampBrightness: number;
  isPlaying: boolean;
  currentTime: number;
  showScroll: boolean;
  performanceStartTime: number | null;
  performanceEndTime: number | null;
}

export interface PerformanceRecord {
  characterId: string;
  characterName: string;
  entryOrder: number;
  actionDuration: number;
}

export const JOINT_LIMITS: Record<JointType, { min: number; max: number }> = {
  head: { min: -30, max: 30 },
  upperArm: { min: -45, max: 45 },
  lowerArm: { min: -60, max: 60 },
  leg: { min: -25, max: 25 },
};

export const CHARACTER_TEMPLATES: Omit<PuppetCharacter, 'id' | 'position' | 'isOnStage'>[] = [
  {
    name: '孙悟空',
    role: '生',
    parts: [],
    joints: [],
  },
  {
    name: '唐僧',
    role: '生',
    parts: [],
    joints: [],
  },
  {
    name: '猪八戒',
    role: '净',
    parts: [],
    joints: [],
  },
  {
    name: '沙僧',
    role: '净',
    parts: [],
    joints: [],
  },
  {
    name: '白骨精',
    role: '旦',
    parts: [],
    joints: [],
  },
  {
    name: '村姑',
    role: '旦',
    parts: [],
    joints: [],
  },
  {
    name: '老翁',
    role: '丑',
    parts: [],
    joints: [],
  },
  {
    name: '老妇',
    role: '丑',
    parts: [],
    joints: [],
  },
];
