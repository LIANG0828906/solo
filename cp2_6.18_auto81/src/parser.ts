export interface Atom {
  element: string;
  position: { x: number; y: number; z: number };
  color: string;
  vdwRadius: number;
  mass: number;
}

export interface Bond {
  from: number;
  to: number;
  type: number;
}

export interface MoleculeData {
  atoms: Atom[];
  bonds: Bond[];
  formula: string;
  molecularWeight: number;
  name: string;
  smiles?: string;
}

const CPK_COLORS: Record<string, string> = {
  H: '#FFFFFF',
  C: '#909090',
  N: '#3050F8',
  O: '#FF0D0D',
  F: '#90E050',
  Cl: '#1FF01F',
  Br: '#A62929',
  I: '#940094',
  P: '#FF8000',
  S: '#FFFF30',
  B: '#FFB5B5',
  Li: '#CC80FF',
  Na: '#AB5CF2',
  K: '#8F40D4',
  Ca: '#3DFF00',
  Fe: '#E06633',
  Cu: '#C88033',
  Zn: '#7D80B0',
  Mg: '#8AFF00',
  Si: '#F0C8A0',
  Au: '#FFD123',
  Ag: '#C0C0C0',
  He: '#D9FFFF',
  Ne: '#B3E3F5',
  Ar: '#80D1E3'
};

const VDW_RADII: Record<string, number> = {
  H: 1.20, C: 1.70, N: 1.55, O: 1.52, F: 1.47,
  Cl: 1.75, Br: 1.85, I: 1.98, P: 1.80, S: 1.80,
  B: 1.65, Li: 1.82, Na: 2.27, K: 2.75, Ca: 2.31,
  Fe: 1.94, Cu: 1.96, Zn: 1.39, Mg: 1.73, Si: 2.10,
  Au: 1.66, Ag: 1.72, He: 1.40, Ne: 1.54, Ar: 1.88
};

const ATOMIC_MASSES: Record<string, number> = {
  H: 1.008, C: 12.011, N: 14.007, O: 15.999, F: 18.998,
  Cl: 35.45, Br: 79.904, I: 126.904, P: 30.974, S: 32.06,
  B: 10.81, Li: 6.941, Na: 22.99, K: 39.098, Ca: 40.078,
  Fe: 55.845, Cu: 63.546, Zn: 65.38, Mg: 24.305, Si: 28.086,
  Au: 196.967, Ag: 107.868, He: 4.0026, Ne: 20.1797, Ar: 39.948
};

export function getCPKColor(element: string): string {
  return CPK_COLORS[element] || '#FF69B4';
}

export function getVdwRadius(element: string): number {
  return VDW_RADII[element] || 1.7;
}

export function getAtomicMass(element: string): number {
  return ATOMIC_MASSES[element] || 12.0;
}

function makeAtom(element: string, x: number, y: number, z: number): Atom {
  return {
    element,
    position: { x, y, z },
    color: getCPKColor(element),
    vdwRadius: getVdwRadius(element),
    mass: getAtomicMass(element)
  };
}

function computeFormula(atoms: Atom[]): string {
  const counts: Record<string, number> = {};
  for (const a of atoms) {
    counts[a.element] = (counts[a.element] || 0) + 1;
  }
  const order = ['C', 'H', 'N', 'O', 'S', 'P', 'F', 'Cl', 'Br', 'I'];
  const parts: string[] = [];
  for (const e of order) {
    if (counts[e]) {
      parts.push(counts[e] === 1 ? e : `${e}${counts[e]}`);
      delete counts[e];
    }
  }
  for (const e of Object.keys(counts)) {
    parts.push(counts[e] === 1 ? e : `${e}${counts[e]}`);
  }
  return parts.join('');
}

function computeWeight(atoms: Atom[]): number {
  return atoms.reduce((sum, a) => sum + a.mass, 0);
}

function finalize(data: Omit<MoleculeData, 'formula' | 'molecularWeight'>): MoleculeData {
  return {
    ...data,
    formula: computeFormula(data.atoms),
    molecularWeight: Number(computeWeight(data.atoms).toFixed(3))
  };
}

export const PRESET_MOLECULES: Record<string, () => MoleculeData> = {
  benzene: () => {
    const atoms: Atom[] = [];
    const bonds: Bond[] = [];
    const R = 1.39;
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      atoms.push(makeAtom('C', Math.cos(angle) * R, Math.sin(angle) * R, 0));
    }
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      atoms.push(makeAtom('H', Math.cos(angle) * (R + 1.09), Math.sin(angle) * (R + 1.09), 0));
    }
    for (let i = 0; i < 6; i++) {
      bonds.push({ from: i, to: (i + 1) % 6, type: i % 2 === 0 ? 2 : 1 });
    }
    for (let i = 0; i < 6; i++) {
      bonds.push({ from: i, to: 6 + i, type: 1 });
    }
    return finalize({ atoms, bonds, name: '苯 (Benzene)', smiles: 'c1ccccc1' });
  },

  caffeine: () => {
    const atoms: Atom[] = [];
    const bonds: Bond[] = [];
    const base: Array<[string, number, number, number]> = [
      ['N', 0.00, 0.00, 0.00],
      ['C', 1.35, 0.00, 0.00],
      ['N', 2.03, 1.18, 0.00],
      ['C', 3.38, 1.18, 0.00],
      ['C', 4.06, 0.00, 0.00],
      ['N', 5.41, 0.00, 0.00],
      ['C', 4.74, -1.18, 0.00],
      ['C', 3.38, -1.18, 0.00],
      ['C', 2.03, -1.18, 0.00],
      ['O', 3.38, 2.36, 0.00],
      ['O', 1.35, -2.36, 0.00],
      ['C', 6.46, 0.80, 0.00],
      ['C', 5.06, -2.36, 0.00],
      ['C', -0.75, 1.20, 0.00]
    ];
    for (const [e, x, y, z] of base) atoms.push(makeAtom(e, x, y, z));
    const bs: Array<[number, number, number]> = [
      [0, 1, 1], [1, 2, 2], [2, 3, 1], [3, 4, 2], [4, 5, 1],
      [5, 6, 2], [6, 7, 1], [7, 8, 2], [8, 0, 1], [1, 8, 1],
      [3, 9, 2], [8, 10, 2], [5, 11, 1], [6, 12, 1], [0, 13, 1],
      [3, 7, 1], [4, 6, 1]
    ];
    for (const [f, t, ty] of bs) bonds.push({ from: f, to: t, type: ty });
    return finalize({ atoms, bonds, name: '咖啡因 (Caffeine)', smiles: 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C' });
  },

  glucose: () => {
    const atoms: Atom[] = [];
    const bonds: Bond[] = [];
    const r = 1.52;
    const ring: Array<[string, number, number, number]> = [
      ['O', 0, 0, 0],
      ['C', r * Math.cos(0), r * Math.sin(0), 0],
      ['C', r * Math.cos(Math.PI / 3), r * Math.sin(Math.PI / 3), 0],
      ['C', r * Math.cos(2 * Math.PI / 3), r * Math.sin(2 * Math.PI / 3), 0],
      ['C', r * Math.cos(Math.PI), r * Math.sin(Math.PI), 0],
      ['C', r * Math.cos(4 * Math.PI / 3), r * Math.sin(4 * Math.PI / 3), 0]
    ];
    for (const [e, x, y, z] of ring) atoms.push(makeAtom(e, x, y, z));
    const subs: Array<[string, number, number, number]> = [
      ['C', r * Math.cos(0) + 1.2, r * Math.sin(0), 1.0],
      ['O', r * Math.cos(Math.PI / 3) + 1.2, r * Math.sin(Math.PI / 3), 1.0],
      ['O', r * Math.cos(2 * Math.PI / 3), r * Math.sin(2 * Math.PI / 3) + 1.2, -1.0],
      ['O', r * Math.cos(Math.PI) - 1.2, r * Math.sin(Math.PI), 1.0],
      ['O', r * Math.cos(4 * Math.PI / 3), r * Math.sin(4 * Math.PI / 3) - 1.2, -1.0],
      ['O', 0.5, 0.5, 1.2]
    ];
    for (const [e, x, y, z] of subs) atoms.push(makeAtom(e, x, y, z));
    const hPos: Array<[number, number, number]> = [
      [r * Math.cos(0) + 1.2, r * Math.sin(0) - 1.2, 1.0],
      [r * Math.cos(0) + 1.2, r * Math.sin(0), 2.2],
      [r * Math.cos(0) + 1.2, r * Math.sin(0), -0.2],
      [r * Math.cos(Math.PI / 3) + 2.2, r * Math.sin(Math.PI / 3), 1.0],
      [r * Math.cos(2 * Math.PI / 3), r * Math.sin(2 * Math.PI / 3) + 2.2, -1.0],
      [r * Math.cos(Math.PI) - 2.2, r * Math.sin(Math.PI), 1.0],
      [r * Math.cos(4 * Math.PI / 3), r * Math.sin(4 * Math.PI / 3) - 2.2, -1.0],
      [1.2, 0.8, 1.2],
      [r * Math.cos(Math.PI / 3) + 1.2, r * Math.sin(Math.PI / 3) + 1.0, -0.5],
      [r * Math.cos(Math.PI / 3), r * Math.sin(Math.PI / 3), 1.0],
      [r * Math.cos(2 * Math.PI / 3) + 1.0, r * Math.sin(2 * Math.PI / 3), -0.5],
      [r * Math.cos(4 * Math.PI / 3) - 1.0, r * Math.sin(4 * Math.PI / 3), -0.5]
    ];
    for (const [x, y, z] of hPos) atoms.push(makeAtom('H', x, y, z));
    for (let i = 0; i < 5; i++) bonds.push({ from: i, to: i + 1, type: 1 });
    bonds.push({ from: 5, to: 0, type: 1 });
    bonds.push({ from: 1, to: 6, type: 1 });
    bonds.push({ from: 2, to: 7, type: 1 });
    bonds.push({ from: 3, to: 8, type: 1 });
    bonds.push({ from: 4, to: 9, type: 1 });
    bonds.push({ from: 5, to: 10, type: 1 });
    bonds.push({ from: 1, to: 11, type: 1 });
    bonds.push({ from: 6, to: 12, type: 1 });
    bonds.push({ from: 6, to: 13, type: 1 });
    bonds.push({ from: 7, to: 15, type: 1 });
    bonds.push({ from: 8, to: 16, type: 1 });
    bonds.push({ from: 9, to: 17, type: 1 });
    bonds.push({ from: 10, to: 18, type: 1 });
    bonds.push({ from: 11, to: 19, type: 1 });
    bonds.push({ from: 1, to: 21, type: 1 });
    bonds.push({ from: 2, to: 20, type: 1 });
    bonds.push({ from: 3, to: 22, type: 1 });
    bonds.push({ from: 5, to: 23, type: 1 });
    bonds.push({ from: 6, to: 14, type: 1 });
    return finalize({ atoms, bonds, name: '葡萄糖 (Glucose)', smiles: 'C(C1C(C(C(C(O1)O)O)O)O)O' });
  },

  water: () => {
    const atoms: Atom[] = [
      makeAtom('O', 0, 0, 0),
      makeAtom('H', 0.757, 0.586, 0),
      makeAtom('H', -0.757, 0.586, 0)
    ];
    const bonds: Bond[] = [
      { from: 0, to: 1, type: 1 },
      { from: 0, to: 2, type: 1 }
    ];
    return finalize({ atoms, bonds, name: '水 (Water)', smiles: 'O' });
  },

  ethanol: () => {
    const atoms: Atom[] = [
      makeAtom('C', 0, 0, 0),
      makeAtom('C', 1.54, 0, 0),
      makeAtom('O', 2.3, 1.2, 0),
      makeAtom('H', 3.1, 1.2, 0),
      makeAtom('H', -0.5, 1.0, 0),
      makeAtom('H', -0.5, -0.5, 0.87),
      makeAtom('H', -0.5, -0.5, -0.87),
      makeAtom('H', 2.0, -0.7, 0),
      makeAtom('H', 2.0, -0.2, 1.0)
    ];
    const bonds: Bond[] = [
      { from: 0, to: 1, type: 1 },
      { from: 1, to: 2, type: 1 },
      { from: 2, to: 3, type: 1 },
      { from: 0, to: 4, type: 1 },
      { from: 0, to: 5, type: 1 },
      { from: 0, to: 6, type: 1 },
      { from: 1, to: 7, type: 1 },
      { from: 1, to: 8, type: 1 }
    ];
    return finalize({ atoms, bonds, name: '乙醇 (Ethanol)', smiles: 'CCO' });
  },

  aspirin: () => {
    const atoms: Atom[] = [];
    const bonds: Bond[] = [];
    const R = 1.39;
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      atoms.push(makeAtom('C', Math.cos(angle) * R, Math.sin(angle) * R, 0));
    }
    atoms.push(makeAtom('O', Math.cos(-Math.PI / 2) * R - 1.2, Math.sin(-Math.PI / 2) * R, 0));
    atoms.push(makeAtom('H', Math.cos(-Math.PI / 2) * R - 1.2, Math.sin(-Math.PI / 2) * R - 0.96, 0));
    atoms.push(makeAtom('C', Math.cos(0) * (R + 1.5), Math.sin(0) * R, 0));
    atoms.push(makeAtom('O', Math.cos(0) * (R + 1.5) + 1.2, Math.sin(0) * R + 1.0, 0));
    atoms.push(makeAtom('O', Math.cos(0) * (R + 1.5), Math.sin(0) * R - 1.2, 0));
    atoms.push(makeAtom('C', Math.cos(0) * (R + 1.5) + 1.2, Math.sin(0) * R - 2.6, 0));
    atoms.push(makeAtom('H', Math.cos(0) * (R + 1.5) + 1.2, Math.sin(0) * R - 3.6, 0));
    atoms.push(makeAtom('O', Math.cos(0) * (R + 1.5) + 1.2, Math.sin(0) * R - 1.2, 0));
    const angles = [Math.PI / 6, Math.PI / 2, 5 * Math.PI / 6, 7 * Math.PI / 6, 3 * Math.PI / 2, 11 * Math.PI / 6];
    let skip = 0;
    for (let i = 0; i < 6; i++) {
      if (i === 3 || i === 4) { skip++; continue; }
      const angle = angles[i];
      atoms.push(makeAtom('H', Math.cos(angle) * (R + 1.09), Math.sin(angle) * (R + 1.09), 0));
    }
    for (let i = 0; i < 6; i++) {
      bonds.push({ from: i, to: (i + 1) % 6, type: i % 2 === 0 ? 2 : 1 });
    }
    bonds.push({ from: 5, to: 6, type: 1 });
    bonds.push({ from: 6, to: 7, type: 1 });
    bonds.push({ from: 0, to: 8, type: 1 });
    bonds.push({ from: 8, to: 9, type: 1 });
    bonds.push({ from: 8, to: 10, type: 2 });
    bonds.push({ from: 9, to: 11, type: 1 });
    bonds.push({ from: 11, to: 12, type: 1 });
    bonds.push({ from: 11, to: 13, type: 1 });
    bonds.push({ from: 0, to: 14, type: 1 });
    bonds.push({ from: 1, to: 15, type: 1 });
    bonds.push({ from: 2, to: 16, type: 1 });
    return finalize({ atoms, bonds, name: '阿司匹林 (Aspirin)', smiles: 'CC(=O)OC1=CC=CC=C1C(=O)O' });
  },

  dna_base: () => {
    const atoms: Atom[] = [];
    const bonds: Bond[] = [];
    const ring: Array<[string, number, number]> = [
      ['N', 0, 0], ['C', 1.4, 0], ['N', 2.1, 1.2], ['C', 1.4, 2.4], ['C', 0, 2.4]
    ];
    for (const [e, x, y] of ring) atoms.push(makeAtom(e, x, y, 0));
    atoms.push(makeAtom('C', 3.1, -0.8, 0));
    atoms.push(makeAtom('O', 4.1, -0.8, 0));
    atoms.push(makeAtom('N', -0.7, 1.2, 0));
    const hP = [[-0.4, -0.8], [0, 3.4], [-1.6, 1.2], [2.6, 1.2]];
    for (const [x, y] of hP) atoms.push(makeAtom('H', x, y, 0));
    bonds.push({ from: 0, to: 1, type: 1 });
    bonds.push({ from: 1, to: 2, type: 2 });
    bonds.push({ from: 2, to: 3, type: 1 });
    bonds.push({ from: 3, to: 4, type: 2 });
    bonds.push({ from: 4, to: 0, type: 1 });
    bonds.push({ from: 1, to: 5, type: 1 });
    bonds.push({ from: 5, to: 6, type: 2 });
    bonds.push({ from: 4, to: 7, type: 1 });
    bonds.push({ from: 0, to: 8, type: 1 });
    bonds.push({ from: 3, to: 9, type: 1 });
    bonds.push({ from: 7, to: 10, type: 1 });
    bonds.push({ from: 2, to: 11, type: 1 });
    return finalize({ atoms, bonds, name: '胞嘧啶 (Cytosine)', smiles: 'C1=C(NC=N1)C(=O)N' });
  }
};

export function parseSMILES(smiles: string): MoleculeData {
  const trimmed = smiles.trim();
  const key = trimmed.toLowerCase();
  const map: Record<string, string> = {
    'c1ccccc1': 'benzene', 'benzene': 'benzene', 'benzol': 'benzene', '苯': 'benzene',
    'cn1c=nc2=c1c(=o)n(c(=o)n2c)c': 'caffeine', 'caffeine': 'caffeine', '咖啡因': 'caffeine',
    'c(c1c(c(c(c(o1)o)o)o)o)o': 'glucose', 'glucose': 'glucose', '葡萄糖': 'glucose',
    'o': 'water', 'h2o': 'water', 'water': 'water', '水': 'water',
    'cco': 'ethanol', 'ethanol': 'ethanol', 'c2h5oh': 'ethanol', '乙醇': 'ethanol',
    'cc(=o)oc1=cc=cc=c1c(=o)o': 'aspirin', 'aspirin': 'aspirin', '阿司匹林': 'aspirin'
  };
  if (map[key] && PRESET_MOLECULES[map[key]]) {
    const data = PRESET_MOLECULES[map[key]]();
    data.smiles = trimmed;
    return data;
  }
  const simpleParser = simpleSMILESParse(trimmed);
  if (simpleParser) return simpleParser;
  return generateGenericMolecule(trimmed);
}

function simpleSMILESParse(smiles: string): MoleculeData | null {
  const tokens = tokenizeSMILES(smiles);
  if (!tokens) return null;
  const atoms: Atom[] = [];
  const bonds: Bond[] = [];
  const ringMap = new Map<number, number>();
  const stack: number[] = [];
  let prev = -1;
  let bondType = 1;
  let x = 0, y = 0, z = 0;
  let angle = 0;
  let branchCount = 0;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === '(') { stack.push(prev); continue; }
    if (t === ')') { prev = stack.pop() ?? -1; continue; }
    if (t === '=') { bondType = 2; continue; }
    if (t === '#') { bondType = 3; continue; }
    if (/^[0-9]$/.test(t)) {
      const id = Number(t);
      if (ringMap.has(id)) {
        const other = ringMap.get(id)!;
        if (prev >= 0) bonds.push({ from: prev, to: other, type: bondType });
        ringMap.delete(id);
      } else {
        ringMap.set(id, prev);
      }
      continue;
    }
    const match = t.match(/^([A-Z][a-z]?)([0-9]*)$/);
    if (!match) continue;
    const element = match[1];
    const count = match[2] ? Number(match[2]) : 1;
    for (let c = 0; c < count; c++) {
      atoms.push(makeAtom(element, x, y, z));
      const idx = atoms.length - 1;
      if (prev >= 0) bonds.push({ from: prev, to: idx, type: bondType });
      if (c === 0) { prev = idx; bondType = 1; }
      angle += (branchCount % 2 === 0 ? 1 : -1) * 0.8;
      const step = 1.5;
      x += Math.cos(angle) * step;
      y += Math.sin(angle * 0.7) * step * 0.5;
      z = Math.sin(angle * 1.3) * step * 0.3;
    }
    branchCount++;
  }
  if (atoms.length === 0) return null;
  return finalize({ atoms, bonds, name: `自定义分子 (${smiles})`, smiles });
}

function tokenizeSMILES(smiles: string): string[] | null {
  const tokens: string[] = [];
  let i = 0;
  while (i < smiles.length) {
    const ch = smiles[i];
    if (ch === '(' || ch === ')' || ch === '[' || ch === ']' || ch === '=' || ch === '#' || ch === '-' || ch === '/' || ch === '\\' || ch === '.' || ch === '@' || ch === '+' || ch === '-') {
      if (ch === '=' || ch === '#' || ch === '(' || ch === ')') tokens.push(ch);
      i++;
      continue;
    }
    if (/[0-9]/.test(ch)) {
      tokens.push(ch);
      i++;
      continue;
    }
    if (/[A-Z]/.test(ch)) {
      let elem = ch;
      if (i + 1 < smiles.length && /[a-z]/.test(smiles[i + 1])) {
        elem += smiles[i + 1];
        i++;
      }
      tokens.push(elem);
      i++;
      continue;
    }
    if (/[a-z]/.test(ch)) {
      tokens.push(ch.toUpperCase());
      i++;
      continue;
    }
    i++;
  }
  return tokens;
}

function generateGenericMolecule(label: string): MoleculeData {
  const atoms: Atom[] = [];
  const bonds: Bond[] = [];
  const chars = label.replace(/[^A-Za-z]/g, '').split('');
  if (chars.length === 0) {
    return PRESET_MOLECULES.water();
  }
  const n = Math.min(chars.length, 20);
  for (let i = 0; i < n; i++) {
    const e = ['C', 'H', 'O', 'N', 'S', 'P'][i % 6];
    const angle = (i / n) * Math.PI * 2;
    const r = 1.5 + (i % 3) * 0.3;
    atoms.push(makeAtom(e, Math.cos(angle) * r, Math.sin(angle) * r, Math.sin(i * 0.7) * 0.8));
  }
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = atoms[i].position.x - atoms[j].position.x;
      const dy = atoms[i].position.y - atoms[j].position.y;
      const dz = atoms[i].position.z - atoms[j].position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < 2.2) bonds.push({ from: i, to: j, type: 1 });
    }
  }
  return finalize({ atoms, bonds, name: `解析分子 (${label.slice(0, 16)})`, smiles: label });
}

export function getPresetList(): { key: string; name: string }[] {
  const data = [
    { key: 'water', name: '水 (H₂O)' },
    { key: 'ethanol', name: '乙醇 (C₂H₅OH)' },
    { key: 'benzene', name: '苯 (C₆H₆)' },
    { key: 'caffeine', name: '咖啡因 (C₈H₁₀N₄O₂)' },
    { key: 'glucose', name: '葡萄糖 (C₆H₁₂O₆)' },
    { key: 'aspirin', name: '阿司匹林 (C₉H₈O₄)' },
    { key: 'dna_base', name: '胞嘧啶 (DNA碱基)' }
  ];
  return data.filter(d => PRESET_MOLECULES[d.key]);
}
