import { Molecule, VibrationMode, ElementProperties } from '../types/molecule';

export const ELEMENT_PROPERTIES: Record<string, ElementProperties> = {
  H: { color: '#FFFFFF', radius: 0.32, name: '氢' },
  C: { color: '#909090', radius: 0.75, name: '碳' },
  N: { color: '#3050F8', radius: 0.71, name: '氮' },
  O: { color: '#FF0D0D', radius: 0.68, name: '氧' },
  F: { color: '#90E050', radius: 0.57, name: '氟' },
  P: { color: '#FF8000', radius: 1.06, name: '磷' },
  S: { color: '#FFFF30', radius: 1.02, name: '硫' },
  Cl: { color: '#1FF01F', radius: 0.99, name: '氯' },
};

export const PRESET_MOLECULES: Molecule[] = [
  {
    id: 'water',
    name: '水',
    formula: 'H₂O',
    atoms: [
      { id: 'o1', element: 'O', x: 0, y: 0, z: 0, radius: 0.68, color: '#FF0D0D' },
      { id: 'h1', element: 'H', x: 0.757, y: 0.586, z: 0, radius: 0.32, color: '#FFFFFF' },
      { id: 'h2', element: 'H', x: -0.757, y: 0.586, z: 0, radius: 0.32, color: '#FFFFFF' },
    ],
    bonds: [
      { id: 'b1', atom1Id: 'o1', atom2Id: 'h1', order: 1 },
      { id: 'b2', atom1Id: 'o1', atom2Id: 'h2', order: 1 },
    ],
  },
  {
    id: 'co2',
    name: '二氧化碳',
    formula: 'CO₂',
    atoms: [
      { id: 'c1', element: 'C', x: 0, y: 0, z: 0, radius: 0.75, color: '#909090' },
      { id: 'o1', element: 'O', x: 1.16, y: 0, z: 0, radius: 0.68, color: '#FF0D0D' },
      { id: 'o2', element: 'O', x: -1.16, y: 0, z: 0, radius: 0.68, color: '#FF0D0D' },
    ],
    bonds: [
      { id: 'b1', atom1Id: 'c1', atom2Id: 'o1', order: 2 },
      { id: 'b2', atom1Id: 'c1', atom2Id: 'o2', order: 2 },
    ],
  },
  {
    id: 'benzene',
    name: '苯',
    formula: 'C₆H₆',
    atoms: [
      { id: 'c1', element: 'C', x: 1.39, y: 0, z: 0, radius: 0.75, color: '#909090' },
      { id: 'c2', element: 'C', x: 0.695, y: 1.203, z: 0, radius: 0.75, color: '#909090' },
      { id: 'c3', element: 'C', x: -0.695, y: 1.203, z: 0, radius: 0.75, color: '#909090' },
      { id: 'c4', element: 'C', x: -1.39, y: 0, z: 0, radius: 0.75, color: '#909090' },
      { id: 'c5', element: 'C', x: -0.695, y: -1.203, z: 0, radius: 0.75, color: '#909090' },
      { id: 'c6', element: 'C', x: 0.695, y: -1.203, z: 0, radius: 0.75, color: '#909090' },
      { id: 'h1', element: 'H', x: 2.47, y: 0, z: 0, radius: 0.32, color: '#FFFFFF' },
      { id: 'h2', element: 'H', x: 1.235, y: 2.138, z: 0, radius: 0.32, color: '#FFFFFF' },
      { id: 'h3', element: 'H', x: -1.235, y: 2.138, z: 0, radius: 0.32, color: '#FFFFFF' },
      { id: 'h4', element: 'H', x: -2.47, y: 0, z: 0, radius: 0.32, color: '#FFFFFF' },
      { id: 'h5', element: 'H', x: -1.235, y: -2.138, z: 0, radius: 0.32, color: '#FFFFFF' },
      { id: 'h6', element: 'H', x: 1.235, y: -2.138, z: 0, radius: 0.32, color: '#FFFFFF' },
    ],
    bonds: [
      { id: 'b1', atom1Id: 'c1', atom2Id: 'c2', order: 1.5 },
      { id: 'b2', atom1Id: 'c2', atom2Id: 'c3', order: 1.5 },
      { id: 'b3', atom1Id: 'c3', atom2Id: 'c4', order: 1.5 },
      { id: 'b4', atom1Id: 'c4', atom2Id: 'c5', order: 1.5 },
      { id: 'b5', atom1Id: 'c5', atom2Id: 'c6', order: 1.5 },
      { id: 'b6', atom1Id: 'c6', atom2Id: 'c1', order: 1.5 },
      { id: 'b7', atom1Id: 'c1', atom2Id: 'h1', order: 1 },
      { id: 'b8', atom1Id: 'c2', atom2Id: 'h2', order: 1 },
      { id: 'b9', atom1Id: 'c3', atom2Id: 'h3', order: 1 },
      { id: 'b10', atom1Id: 'c4', atom2Id: 'h4', order: 1 },
      { id: 'b11', atom1Id: 'c5', atom2Id: 'h5', order: 1 },
      { id: 'b12', atom1Id: 'c6', atom2Id: 'h6', order: 1 },
    ],
  },
  {
    id: 'dna-fragment',
    name: 'DNA双螺旋片段',
    formula: 'DNA',
    atoms: generateDNAFragment(),
    bonds: generateDNABonds(),
  },
];

function generateDNAFragment() {
  const atoms = [];
  const basePairs = 4;
  const risePerBase = 3.4;
  const radius = 10;

  for (let i = 0; i < basePairs; i++) {
    const angle1 = (i * 36 * Math.PI) / 180;
    const angle2 = ((i * 36 + 180) * Math.PI) / 180;
    const z = i * risePerBase - (basePairs * risePerBase) / 2;

    atoms.push({
      id: `p1-${i}`,
      element: 'P',
      x: Math.cos(angle1) * radius,
      y: Math.sin(angle1) * radius,
      z,
      radius: 1.06,
      color: '#FF8000',
    });
    atoms.push({
      id: `o1a-${i}`,
      element: 'O',
      x: Math.cos(angle1) * (radius + 0.8),
      y: Math.sin(angle1) * (radius + 0.8),
      z: z + 0.5,
      radius: 0.68,
      color: '#FF0D0D',
    });
    atoms.push({
      id: `o1b-${i}`,
      element: 'O',
      x: Math.cos(angle1) * (radius + 0.8),
      y: Math.sin(angle1) * (radius + 0.8),
      z: z - 0.5,
      radius: 0.68,
      color: '#FF0D0D',
    });

    for (let j = 0; j < 3; j++) {
      const atomAngle = angle1 + ((j - 1) * 15 * Math.PI) / 180;
      atoms.push({
        id: `c1-${i}-${j}`,
        element: 'C',
        x: Math.cos(atomAngle) * (radius - 1.5 - j * 0.5),
        y: Math.sin(atomAngle) * (radius - 1.5 - j * 0.5),
        z: z + (j - 1) * 0.3,
        radius: 0.75,
        color: '#909090',
      });
    }

    atoms.push({
      id: `p2-${i}`,
      element: 'P',
      x: Math.cos(angle2) * radius,
      y: Math.sin(angle2) * radius,
      z,
      radius: 1.06,
      color: '#FF8000',
    });
    atoms.push({
      id: `o2a-${i}`,
      element: 'O',
      x: Math.cos(angle2) * (radius + 0.8),
      y: Math.sin(angle2) * (radius + 0.8),
      z: z + 0.5,
      radius: 0.68,
      color: '#FF0D0D',
    });
    atoms.push({
      id: `o2b-${i}`,
      element: 'O',
      x: Math.cos(angle2) * (radius + 0.8),
      y: Math.sin(angle2) * (radius + 0.8),
      z: z - 0.5,
      radius: 0.68,
      color: '#FF0D0D',
    });

    for (let j = 0; j < 3; j++) {
      const atomAngle = angle2 + ((j - 1) * 15 * Math.PI) / 180;
      atoms.push({
        id: `c2-${i}-${j}`,
        element: 'C',
        x: Math.cos(atomAngle) * (radius - 1.5 - j * 0.5),
        y: Math.sin(atomAngle) * (radius - 1.5 - j * 0.5),
        z: z + (j - 1) * 0.3,
        radius: 0.75,
        color: '#909090',
      });
    }

    for (let j = 0; j < 6; j++) {
      const t = j / 5;
      const baseAngle = angle1 + t * Math.PI;
      const baseRadius = radius - 2;
      atoms.push({
        id: `base-${i}-${j}`,
        element: j % 3 === 0 ? 'N' : 'C',
        x: Math.cos(baseAngle) * (baseRadius - t * 4),
        y: Math.sin(baseAngle) * (baseRadius - t * 4),
        z: z,
        radius: j % 3 === 0 ? 0.71 : 0.75,
        color: j % 3 === 0 ? '#3050F8' : '#909090',
      });
    }
  }

  return atoms;
}

function generateDNABonds() {
  const bonds = [];
  const basePairs = 4;
  let bondId = 0;

  for (let i = 0; i < basePairs; i++) {
    bonds.push({ id: `b${bondId++}`, atom1Id: `p1-${i}`, atom2Id: `o1a-${i}`, order: 1 });
    bonds.push({ id: `b${bondId++}`, atom1Id: `p1-${i}`, atom2Id: `o1b-${i}`, order: 1 });
    bonds.push({ id: `b${bondId++}`, atom1Id: `p1-${i}`, atom2Id: `c1-${i}-0`, order: 1 });

    for (let j = 0; j < 2; j++) {
      bonds.push({ id: `b${bondId++}`, atom1Id: `c1-${i}-${j}`, atom2Id: `c1-${i}-${j + 1}`, order: 1 });
    }
    bonds.push({ id: `b${bondId++}`, atom1Id: `c1-${i}-2`, atom2Id: `base-${i}-0`, order: 1 });

    for (let j = 0; j < 5; j++) {
      bonds.push({ id: `b${bondId++}`, atom1Id: `base-${i}-${j}`, atom2Id: `base-${i}-${j + 1}`, order: j % 2 === 0 ? 1 : 2 });
    }

    bonds.push({ id: `b${bondId++}`, atom1Id: `p2-${i}`, atom2Id: `o2a-${i}`, order: 1 });
    bonds.push({ id: `b${bondId++}`, atom1Id: `p2-${i}`, atom2Id: `o2b-${i}`, order: 1 });
    bonds.push({ id: `b${bondId++}`, atom1Id: `p2-${i}`, atom2Id: `c2-${i}-0`, order: 1 });

    for (let j = 0; j < 2; j++) {
      bonds.push({ id: `b${bondId++}`, atom1Id: `c2-${i}-${j}`, atom2Id: `c2-${i}-${j + 1}`, order: 1 });
    }
    bonds.push({ id: `b${bondId++}`, atom1Id: `c2-${i}-2`, atom2Id: `base-${i}-5`, order: 1 });

    if (i > 0) {
      bonds.push({ id: `b${bondId++}`, atom1Id: `p1-${i}`, atom2Id: `c1-${i - 1}-2`, order: 1 });
      bonds.push({ id: `b${bondId++}`, atom1Id: `p2-${i}`, atom2Id: `c2-${i - 1}-2`, order: 1 });
    }
  }

  return bonds;
}

export const VIBRATION_MODES: VibrationMode[] = [
  {
    id: 'symmetric-stretch',
    name: '对称伸缩振动',
    description: '原子沿键轴方向对称地远离和靠近中心原子',
    frequency: 1.0,
  },
  {
    id: 'asymmetric-stretch',
    name: '不对称伸缩振动',
    description: '原子沿键轴方向不对称地运动，一个远离一个靠近',
    frequency: 1.2,
  },
  {
    id: 'bending',
    name: '弯曲振动',
    description: '原子在垂直于键轴方向上来回摆动',
    frequency: 0.8,
  },
  {
    id: 'scissoring',
    name: '剪式振动',
    description: '两个原子像剪刀一样开合运动',
    frequency: 0.9,
  },
  {
    id: 'rocking',
    name: '摇摆振动',
    description: '原子团整体来回摆动',
    frequency: 0.7,
  },
  {
    id: 'twisting',
    name: '扭转振动',
    description: '原子团围绕中心轴扭转运动',
    frequency: 0.6,
  },
];
