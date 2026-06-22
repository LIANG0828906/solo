export interface FossilFragment {
  id: string;
  name: string;
  geometryType: 'box' | 'cylinder' | 'sphere' | 'cone';
  dimensions: { x: number; y: number; z: number };
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  snapPoints: Array<{ x: number; y: number; z: number }>;
  connectedTo?: string;
  groupId?: string;
}

export interface BoneGroup {
  id: string;
  name: string;
  fragmentIds: string[];
}

export interface SnapInfo {
  fragmentIdA: string;
  fragmentIdB: string;
  distance: number;
  angleDiff: number;
  snapPointA: { x: number; y: number; z: number };
  snapPointB: { x: number; y: number; z: number };
}

export interface FossilTemplate {
  id: string;
  name: string;
  geometryType: 'box' | 'cylinder' | 'sphere' | 'cone';
  dimensions: { x: number; y: number; z: number };
  snapPoints: Array<{ x: number; y: number; z: number }>;
}

export const fossilData: FossilTemplate[] = [
  {
    id: 'skull',
    name: '恐龙头骨',
    geometryType: 'sphere',
    dimensions: { x: 2, y: 1.8, z: 2.5 },
    snapPoints: [{ x: 0, y: -0.8, z: 1 }]
  },
  {
    id: 'neck1',
    name: '颈椎第一节',
    geometryType: 'cylinder',
    dimensions: { x: 0.7, y: 1.0, z: 0.7 },
    snapPoints: [
      { x: 0, y: 0.5, z: 0 },
      { x: 0, y: -0.5, z: 0 }
    ]
  },
  {
    id: 'neck2',
    name: '颈椎第二节',
    geometryType: 'cylinder',
    dimensions: { x: 0.7, y: 1.0, z: 0.7 },
    snapPoints: [
      { x: 0, y: 0.5, z: 0 },
      { x: 0, y: -0.5, z: 0 }
    ]
  },
  {
    id: 'torso',
    name: '躯干骨',
    geometryType: 'box',
    dimensions: { x: 2.5, y: 1.5, z: 4 },
    snapPoints: [
      { x: 0, y: 0.5, z: 1.8 },
      { x: -1.2, y: -0.3, z: 1 },
      { x: 1.2, y: -0.3, z: 1 },
      { x: -1.2, y: -0.3, z: -1 },
      { x: 1.2, y: -0.3, z: -1 }
    ]
  },
  {
    id: 'tail1',
    name: '尾椎第一节',
    geometryType: 'cylinder',
    dimensions: { x: 0.6, y: 0.8, z: 0.6 },
    snapPoints: [
      { x: 0, y: 0, z: 0.4 },
      { x: 0, y: 0, z: -0.4 }
    ]
  },
  {
    id: 'tail2',
    name: '尾椎第二节',
    geometryType: 'cylinder',
    dimensions: { x: 0.5, y: 0.7, z: 0.5 },
    snapPoints: [
      { x: 0, y: 0, z: 0.35 },
      { x: 0, y: 0, z: -0.35 }
    ]
  },
  {
    id: 'arm_upper_L',
    name: '左前肢上臂',
    geometryType: 'cylinder',
    dimensions: { x: 0.4, y: 1.5, z: 0.4 },
    snapPoints: [
      { x: 0, y: 0.75, z: 0 },
      { x: 0, y: -0.75, z: 0 }
    ]
  },
  {
    id: 'arm_lower_L',
    name: '左前肢下臂',
    geometryType: 'cylinder',
    dimensions: { x: 0.35, y: 1.3, z: 0.35 },
    snapPoints: [
      { x: 0, y: 0.65, z: 0 },
      { x: 0, y: -0.65, z: 0 }
    ]
  },
  {
    id: 'arm_upper_R',
    name: '右前肢上臂',
    geometryType: 'cylinder',
    dimensions: { x: 0.4, y: 1.5, z: 0.4 },
    snapPoints: [
      { x: 0, y: 0.75, z: 0 },
      { x: 0, y: -0.75, z: 0 }
    ]
  },
  {
    id: 'arm_lower_R',
    name: '右前肢下臂',
    geometryType: 'cylinder',
    dimensions: { x: 0.35, y: 1.3, z: 0.35 },
    snapPoints: [
      { x: 0, y: 0.65, z: 0 },
      { x: 0, y: -0.65, z: 0 }
    ]
  },
  {
    id: 'leg_upper_L',
    name: '左后肢大腿',
    geometryType: 'cylinder',
    dimensions: { x: 0.5, y: 1.8, z: 0.5 },
    snapPoints: [
      { x: 0, y: 0.9, z: 0 },
      { x: 0, y: -0.9, z: 0 }
    ]
  },
  {
    id: 'leg_lower_L',
    name: '左后肢小腿',
    geometryType: 'cylinder',
    dimensions: { x: 0.45, y: 1.6, z: 0.45 },
    snapPoints: [
      { x: 0, y: 0.8, z: 0 },
      { x: 0, y: -0.8, z: 0 }
    ]
  },
  {
    id: 'leg_upper_R',
    name: '右后肢大腿',
    geometryType: 'cylinder',
    dimensions: { x: 0.5, y: 1.8, z: 0.5 },
    snapPoints: [
      { x: 0, y: 0.9, z: 0 },
      { x: 0, y: -0.9, z: 0 }
    ]
  },
  {
    id: 'leg_lower_R',
    name: '右后肢小腿',
    geometryType: 'cylinder',
    dimensions: { x: 0.45, y: 1.6, z: 0.45 },
    snapPoints: [
      { x: 0, y: 0.8, z: 0 },
      { x: 0, y: -0.8, z: 0 }
    ]
  }
];
