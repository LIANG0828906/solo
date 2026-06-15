export interface AtomData {
  element: string;
  position: [number, number, number];
}

export interface BondData {
  from: number;
  to: number;
  order?: number;
}

export interface MoleculeData {
  name: string;
  formula: string;
  atoms: AtomData[];
  bonds: BondData[];
}

export interface ReactionPair {
  reactants: [string, string];
  product: string;
  equation: string;
}

export const ELEMENT_COLORS: Record<string, number> = {
  H: 0xffffff,
  C: 0x909090,
  N: 0x3050f8,
  O: 0xff3030,
  S: 0xffff30,
  Cl: 0x1ff01f,
  P: 0xff8000,
  F: 0x90e050,
  Br: 0xa62929,
  I: 0x940094,
  He: 0xd9ffff,
  Ne: 0xb3e3f5,
  Ar: 0x84d1f3,
  Si: 0xdea766,
};

export const ELEMENT_RADII: Record<string, number> = {
  H: 0.31,
  C: 0.76,
  N: 0.71,
  O: 0.66,
  S: 1.05,
  Cl: 1.02,
  P: 1.07,
  F: 0.57,
  Br: 1.20,
  I: 1.39,
  He: 0.28,
  Ne: 0.58,
  Ar: 0.93,
  Si: 1.11,
};

const SCALE = 1.0;

function s(v: number): number {
  return v * SCALE;
}

export const MOLECULES: Record<string, MoleculeData> = {
  H2: {
    name: '氢气',
    formula: 'H₂',
    atoms: [
      { element: 'H', position: [s(-0.37), 0, 0] },
      { element: 'H', position: [s(0.37), 0, 0] },
    ],
    bonds: [{ from: 0, to: 1, order: 1 }],
  },

  O2: {
    name: '氧气',
    formula: 'O₂',
    atoms: [
      { element: 'O', position: [s(-0.6), 0, 0] },
      { element: 'O', position: [s(0.6), 0, 0] },
    ],
    bonds: [{ from: 0, to: 1, order: 2 }],
  },

  H2O: {
    name: '水',
    formula: 'H₂O',
    atoms: [
      { element: 'O', position: [0, 0, 0] },
      { element: 'H', position: [s(0.76), s(0.59), 0] },
      { element: 'H', position: [s(-0.76), s(0.59), 0] },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 0, to: 2, order: 1 },
    ],
  },

  CO2: {
    name: '二氧化碳',
    formula: 'CO₂',
    atoms: [
      { element: 'C', position: [0, 0, 0] },
      { element: 'O', position: [s(-1.16), 0, 0] },
      { element: 'O', position: [s(1.16), 0, 0] },
    ],
    bonds: [
      { from: 0, to: 1, order: 2 },
      { from: 0, to: 2, order: 2 },
    ],
  },

  CH4: {
    name: '甲烷',
    formula: 'CH₄',
    atoms: [
      { element: 'C', position: [0, 0, 0] },
      { element: 'H', position: [s(0.63), s(0.63), s(0.63)] },
      { element: 'H', position: [s(-0.63), s(-0.63), s(0.63)] },
      { element: 'H', position: [s(-0.63), s(0.63), s(-0.63)] },
      { element: 'H', position: [s(0.63), s(-0.63), s(-0.63)] },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 0, to: 2, order: 1 },
      { from: 0, to: 3, order: 1 },
      { from: 0, to: 4, order: 1 },
    ],
  },

  NH3: {
    name: '氨',
    formula: 'NH₃',
    atoms: [
      { element: 'N', position: [0, s(0.3), 0] },
      { element: 'H', position: [s(0.82), s(-0.27), 0] },
      { element: 'H', position: [s(-0.41), s(-0.27), s(0.71)] },
      { element: 'H', position: [s(-0.41), s(-0.27), s(-0.71)] },
    ],
    bonds: [
      { from: 0, to: 1, order: 1 },
      { from: 0, to: 2, order: 1 },
      { from: 0, to: 3, order: 1 },
    ],
  },

  C6H6: {
    name: '苯',
    formula: 'C₆H₆',
    atoms: (() => {
      const atoms: AtomData[] = [];
      const rC = s(1.39);
      const rH = s(2.47);
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        atoms.push({
          element: 'C',
          position: [rC * Math.cos(angle), rC * Math.sin(angle), 0],
        });
      }
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        atoms.push({
          element: 'H',
          position: [rH * Math.cos(angle), rH * Math.sin(angle), 0],
        });
      }
      return atoms;
    })(),
    bonds: (() => {
      const bonds: BondData[] = [];
      for (let i = 0; i < 6; i++) {
        bonds.push({ from: i, to: (i + 1) % 6, order: i % 2 === 0 ? 2 : 1 });
      }
      for (let i = 0; i < 6; i++) {
        bonds.push({ from: i, to: i + 6, order: 1 });
      }
      return bonds;
    })(),
  },

  C60: {
    name: '富勒烯',
    formula: 'C₆₀',
    atoms: (() => {
      const atoms: AtomData[] = [];
      const phi = (1 + Math.sqrt(5)) / 2;
      const r = s(3.55);
      const vertices: [number, number, number][] = [
        [0, 1, 3 * phi],
        [0, -1, 3 * phi],
        [0, 1, -3 * phi],
        [0, -1, -3 * phi],
        [3 * phi, 0, 1],
        [-3 * phi, 0, 1],
        [3 * phi, 0, -1],
        [-3 * phi, 0, -1],
        [1, 3 * phi, 0],
        [-1, 3 * phi, 0],
        [1, -3 * phi, 0],
        [-1, -3 * phi, 0],
        [1, 2 + phi, 2 * phi],
        [-1, 2 + phi, 2 * phi],
        [1, -(2 + phi), 2 * phi],
        [-1, -(2 + phi), 2 * phi],
        [1, 2 + phi, -2 * phi],
        [-1, 2 + phi, -2 * phi],
        [1, -(2 + phi), -2 * phi],
        [-1, -(2 + phi), -2 * phi],
        [2 + phi, 2 * phi, 1],
        [-(2 + phi), 2 * phi, 1],
        [2 + phi, -2 * phi, 1],
        [-(2 + phi), -2 * phi, 1],
        [2 + phi, 2 * phi, -1],
        [-(2 + phi), 2 * phi, -1],
        [2 + phi, -2 * phi, -1],
        [-(2 + phi), -2 * phi, -1],
        [2 * phi, 1, 2 + phi],
        [-2 * phi, 1, 2 + phi],
        [2 * phi, -1, 2 + phi],
        [-2 * phi, -1, 2 + phi],
        [2 * phi, 1, -(2 + phi)],
        [-2 * phi, 1, -(2 + phi)],
        [2 * phi, -1, -(2 + phi)],
        [-2 * phi, -1, -(2 + phi)],
        [2, 2 * phi, phi * 2],
        [-2, 2 * phi, phi * 2],
        [2, -2 * phi, phi * 2],
        [-2, -2 * phi, phi * 2],
        [2, 2 * phi, -phi * 2],
        [-2, 2 * phi, -phi * 2],
        [2, -2 * phi, -phi * 2],
        [-2, -2 * phi, -phi * 2],
        [2 * phi, 2, 2 + phi],
        [-2 * phi, 2, 2 + phi],
        [2 * phi, -2, 2 + phi],
        [-2 * phi, -2, 2 + phi],
        [2 * phi, 2, -(2 + phi)],
        [-2 * phi, 2, -(2 + phi)],
        [2 * phi, -2, -(2 + phi)],
        [-2 * phi, -2, -(2 + phi)],
        [2 + phi, 2, 2 * phi],
        [-(2 + phi), 2, 2 * phi],
        [2 + phi, -2, 2 * phi],
        [-(2 + phi), -2, 2 * phi],
        [2 + phi, 2, -2 * phi],
        [-(2 + phi), 2, -2 * phi],
        [2 + phi, -2, -2 * phi],
        [-(2 + phi), -2, -2 * phi],
      ];

      const scale = r / Math.sqrt(vertices[0][0] ** 2 + vertices[0][1] ** 2 + vertices[0][2] ** 2);
      for (const v of vertices) {
        atoms.push({
          element: 'C',
          position: [v[0] * scale, v[1] * scale, v[2] * scale],
        });
      }
      return atoms;
    })(),
    bonds: (() => {
      const bonds: BondData[] = [];
      const positions = [
        [0, 1, 3 * (1 + Math.sqrt(5)) / 2],
        [0, -1, 3 * (1 + Math.sqrt(5)) / 2],
      ];
      const numAtoms = 60;
      const distThreshold = 2.0 * s(1.45);
      const atoms: { element: string; position: [number, number, number] }[] = [];
      
      const phi = (1 + Math.sqrt(5)) / 2;
      const r = 3.55;
      const vertices: [number, number, number][] = [
        [0, 1, 3 * phi], [0, -1, 3 * phi], [0, 1, -3 * phi], [0, -1, -3 * phi],
        [3 * phi, 0, 1], [-3 * phi, 0, 1], [3 * phi, 0, -1], [-3 * phi, 0, -1],
        [1, 3 * phi, 0], [-1, 3 * phi, 0], [1, -3 * phi, 0], [-1, -3 * phi, 0],
        [1, 2 + phi, 2 * phi], [-1, 2 + phi, 2 * phi], [1, -(2 + phi), 2 * phi], [-1, -(2 + phi), 2 * phi],
        [1, 2 + phi, -2 * phi], [-1, 2 + phi, -2 * phi], [1, -(2 + phi), -2 * phi], [-1, -(2 + phi), -2 * phi],
        [2 + phi, 2 * phi, 1], [-(2 + phi), 2 * phi, 1], [2 + phi, -2 * phi, 1], [-(2 + phi), -2 * phi, 1],
        [2 + phi, 2 * phi, -1], [-(2 + phi), 2 * phi, -1], [2 + phi, -2 * phi, -1], [-(2 + phi), -2 * phi, -1],
        [2 * phi, 1, 2 + phi], [-2 * phi, 1, 2 + phi], [2 * phi, -1, 2 + phi], [-2 * phi, -1, 2 + phi],
        [2 * phi, 1, -(2 + phi)], [-2 * phi, 1, -(2 + phi)], [2 * phi, -1, -(2 + phi)], [-2 * phi, -1, -(2 + phi)],
      ];
      
      const scale = r / Math.sqrt(vertices[0][0] ** 2 + vertices[0][1] ** 2 + vertices[0][2] ** 2);
      const scaledVerts = vertices.map(v => [v[0] * scale, v[1] * scale, v[2] * scale] as [number, number, number]);
      
      for (let i = 0; i < scaledVerts.length; i++) {
        for (let j = i + 1; j < scaledVerts.length; j++) {
          const dx = scaledVerts[i][0] - scaledVerts[j][0];
          const dy = scaledVerts[i][1] - scaledVerts[j][1];
          const dz = scaledVerts[i][2] - scaledVerts[j][2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist < 1.6 && dist > 1.3) {
            bonds.push({ from: i, to: j, order: 1 });
          }
        }
      }
      
      return bonds.slice(0, 90);
    })(),
  },

  N2: {
    name: '氮气',
    formula: 'N₂',
    atoms: [
      { element: 'N', position: [s(-0.55), 0, 0] },
      { element: 'N', position: [s(0.55), 0, 0] },
    ],
    bonds: [{ from: 0, to: 1, order: 3 }],
  },

  NaCl: {
    name: '氯化钠',
    formula: 'NaCl',
    atoms: [
      { element: 'Na', position: [s(-1.1), 0, 0] },
      { element: 'Cl', position: [s(1.4), 0, 0] },
    ],
    bonds: [{ from: 0, to: 1, order: 1 }],
  },
};

export const REACTIONS: ReactionPair[] = [
  {
    reactants: ['H2', 'O2'],
    product: 'H2O',
    equation: '2H₂ + O₂ → 2H₂O',
  },
  {
    reactants: ['C', 'O2'],
    product: 'CO2',
    equation: 'C + O₂ → CO₂',
  },
  {
    reactants: ['H2', 'Cl2'],
    product: 'HCl',
    equation: 'H₂ + Cl₂ → 2HCl',
  },
  {
    reactants: ['N2', 'H2'],
    product: 'NH3',
    equation: 'N₂ + 3H₂ → 2NH₃',
  },
  {
    reactants: ['CH4', 'O2'],
    product: 'CO2',
    equation: 'CH₄ + 2O₂ → CO₂ + 2H₂O',
  },
];

export function getMolecule(name: string): MoleculeData | null {
  return MOLECULES[name] || null;
}

export function getReaction(r1: string, r2: string): ReactionPair | null {
  for (const reaction of REACTIONS) {
    if (
      (reaction.reactants[0] === r1 && reaction.reactants[1] === r2) ||
      (reaction.reactants[0] === r2 && reaction.reactants[1] === r1)
    ) {
      return reaction;
    }
  }
  return null;
}

export function getMoleculeList(): string[] {
  return Object.keys(MOLECULES);
}
