export type EventMap = {
  'molecule:changed': Molecule;
  'atom:updated': { atomId: string; changes: Partial<Atom> };
  'atom:selected': { atomId: string | null; selectedAtomIds: string[] };
  'bond:selected': { bondIds: string[] };
  'constraint:result': ConstraintResult;
  'ui:molecule-selected': string;
  'ui:atom-edited': { atomId: string; changes: Partial<Atom> };
  'ui:export': void;
  'ui:load-sharecode': string;
  'toast:show': { message: string; type?: 'info' | 'success' | 'error' };
};

export type AtomType = 'H' | 'C' | 'N' | 'O' | 'S' | 'P';

export interface Atom {
  id: string;
  type: AtomType;
  x: number;
  y: number;
  z: number;
}

export type BondType = 'single' | 'double' | 'triple' | 'aromatic';

export interface Bond {
  id: string;
  atomA: string;
  atomB: string;
  type: BondType;
  order: number;
}

export interface Molecule {
  id: string;
  name: string;
  formula: string;
  atoms: Atom[];
  bonds: Bond[];
}

export interface ConstraintViolation {
  bondId: string;
  type: 'bond-length' | 'bond-angle';
  message: string;
  actual: number;
  min: number;
  max: number;
  atomA?: string;
  atomB?: string;
  atomC?: string;
}

export interface Suggestion {
  atomId: string;
  dx: number;
  dy: number;
  dz: number;
}

export interface ConstraintResult {
  isValid: boolean;
  violations: ConstraintViolation[];
  suggestions: Suggestion[];
  bondLengths: Record<string, number>;
  bondAngles: Array<{ atomA: string; atomB: string; atomC: string; angle: number }>;
}

export const AtomSpecs: Record<AtomType, {
  radius: number;
  color: string;
  name: string;
  covalentRadius: number;
  mass: number;
}> = {
  H: { radius: 0.4, color: '#FFFFFF', name: '氢', covalentRadius: 0.31, mass: 1.008 },
  C: { radius: 0.5, color: '#404040', name: '碳', covalentRadius: 0.76, mass: 12.011 },
  N: { radius: 0.5, color: '#3050F8', name: '氮', covalentRadius: 0.71, mass: 14.007 },
  O: { radius: 0.6, color: '#FF3333', name: '氧', covalentRadius: 0.66, mass: 15.999 },
  S: { radius: 0.7, color: '#FFFF30', name: '硫', covalentRadius: 1.05, mass: 32.065 },
  P: { radius: 0.65, color: '#FF8000', name: '磷', covalentRadius: 1.07, mass: 30.974 },
};

type Handler<T> = (payload: T) => void;

export class EventBus {
  private handlers: { [K in keyof EventMap]?: Set<Handler<EventMap[K]>> } = {};

  on<K extends keyof EventMap>(event: K, handler: Handler<EventMap[K]>): () => void {
    if (!this.handlers[event]) {
      (this.handlers as any)[event] = new Set<Handler<EventMap[K]>>();
    }
    ((this.handlers as any)[event] as Set<Handler<EventMap[K]>>).add(handler);
    return () => this.off(event, handler);
  }

  off<K extends keyof EventMap>(event: K, handler: Handler<EventMap[K]>): void {
    const set = this.handlers[event];
    if (set) {
      (set as Set<Handler<EventMap[K]>>).delete(handler);
    }
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    const set = this.handlers[event];
    if (set) {
      (set as Set<Handler<EventMap[K]>>).forEach((h) => {
        try {
          h(payload);
        } catch (e) {
          console.error(`[EventBus] handler error for ${event}:`, e);
        }
      });
    }
  }
}

export const eventBus = new EventBus();

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

const DEG = Math.PI / 180;

const presetAtoms = (arr: Array<[AtomType, number, number, number]>): Atom[] =>
  arr.map(([type, x, y, z]) => ({ id: uid(), type, x, y, z }));

const presetBonds = (atoms: Atom[], pairs: Array<[number, number, BondType, number]>): Bond[] =>
  pairs.map(([a, b, t, o]) => ({ id: uid(), atomA: atoms[a].id, atomB: atoms[b].id, type: t, order: o }));

export interface PresetMoleculeDef {
  name: string;
  formula: string;
  build: () => { atoms: Atom[]; bonds: Bond[] };
}

export const PresetMolecules: Record<string, PresetMoleculeDef> = {
  h2o: {
    name: '水分子',
    formula: 'H₂O',
    build: () => {
      const len = 0.96;
      const ang = 104.5 * DEG;
      const atoms = presetAtoms([
        ['O', 0, 0, 0],
        ['H', len * Math.sin(ang / 2), len * Math.cos(ang / 2), 0],
        ['H', -len * Math.sin(ang / 2), len * Math.cos(ang / 2), 0],
      ]);
      const bonds = presetBonds(atoms, [
        [0, 1, 'single', 1],
        [0, 2, 'single', 1],
      ]);
      return { atoms, bonds };
    },
  },
  co2: {
    name: '二氧化碳',
    formula: 'CO₂',
    build: () => {
      const len = 1.16;
      const atoms = presetAtoms([
        ['C', 0, 0, 0],
        ['O', -len, 0, 0],
        ['O', len, 0, 0],
      ]);
      const bonds = presetBonds(atoms, [
        [0, 1, 'double', 2],
        [0, 2, 'double', 2],
      ]);
      return { atoms, bonds };
    },
  },
  ch4: {
    name: '甲烷',
    formula: 'CH₄',
    build: () => {
      const len = 1.09;
      const a = Math.acos(-1 / 3);
      const atoms = presetAtoms([
        ['C', 0, 0, 0],
        ['H', len * Math.sin(a), len * Math.cos(a), 0],
        ['H', len * Math.sin(a) * Math.cos((2 * Math.PI) / 3), len * Math.cos(a), len * Math.sin(a) * Math.sin((2 * Math.PI) / 3)],
        ['H', len * Math.sin(a) * Math.cos((4 * Math.PI) / 3), len * Math.cos(a), len * Math.sin(a) * Math.sin((4 * Math.PI) / 3)],
        ['H', 0, -len, 0],
      ]);
      const bonds = presetBonds(atoms, [
        [0, 1, 'single', 1],
        [0, 2, 'single', 1],
        [0, 3, 'single', 1],
        [0, 4, 'single', 1],
      ]);
      return { atoms, bonds };
    },
  },
  nh3: {
    name: '氨',
    formula: 'NH₃',
    build: () => {
      const len = 1.01;
      const ang = 107 * DEG;
      const h = len * Math.cos(ang / 2);
      const r = len * Math.sin(ang / 2);
      const atoms = presetAtoms([
        ['N', 0, h * 0.3, 0],
        ['H', r, -h * 0.7, 0],
        ['H', r * Math.cos((2 * Math.PI) / 3), -h * 0.7, r * Math.sin((2 * Math.PI) / 3)],
        ['H', r * Math.cos((4 * Math.PI) / 3), -h * 0.7, r * Math.sin((4 * Math.PI) / 3)],
      ]);
      const bonds = presetBonds(atoms, [
        [0, 1, 'single', 1],
        [0, 2, 'single', 1],
        [0, 3, 'single', 1],
      ]);
      return { atoms, bonds };
    },
  },
  c2h6: {
    name: '乙烷',
    formula: 'C₂H₆',
    build: () => {
      const cc = 1.54;
      const ch = 1.09;
      const atoms: Atom[] = [];
      atoms.push({ id: uid(), type: 'C', x: -cc / 2, y: 0, z: 0 });
      atoms.push({ id: uid(), type: 'C', x: cc / 2, y: 0, z: 0 });
      const addTetraH = (ci: number, sign: number, phase: number) => {
        const cx = atoms[ci].x;
        const cy = atoms[ci].y;
        const cz = atoms[ci].z;
        const a = Math.acos(-1 / 3);
        for (let i = 0; i < 3; i++) {
          const phi = phase + (i * 2 * Math.PI) / 3;
          atoms.push({
            id: uid(),
            type: 'H',
            x: cx + sign * ch * Math.cos(a),
            y: cy + ch * Math.sin(a) * Math.cos(phi),
            z: cz + ch * Math.sin(a) * Math.sin(phi),
          });
        }
      };
      addTetraH(0, -1, 0);
      addTetraH(1, 1, Math.PI / 3);
      const bonds: Bond[] = [
        { id: uid(), atomA: atoms[0].id, atomB: atoms[1].id, type: 'single', order: 1 },
      ];
      for (let i = 2; i < 5; i++) bonds.push({ id: uid(), atomA: atoms[0].id, atomB: atoms[i].id, type: 'single', order: 1 });
      for (let i = 5; i < 8; i++) bonds.push({ id: uid(), atomA: atoms[1].id, atomB: atoms[i].id, type: 'single', order: 1 });
      return { atoms, bonds };
    },
  },
  c6h6: {
    name: '苯',
    formula: 'C₆H₆',
    build: () => {
      const rC = 1.4 / 2;
      const rH = 2.48 / 2;
      const atoms: Atom[] = [];
      for (let i = 0; i < 6; i++) {
        const theta = (i * Math.PI) / 3;
        atoms.push({ id: uid(), type: 'C', x: rC * Math.cos(theta), y: rC * Math.sin(theta), z: 0 });
      }
      for (let i = 0; i < 6; i++) {
        const theta = (i * Math.PI) / 3;
        atoms.push({ id: uid(), type: 'H', x: rH * Math.cos(theta), y: rH * Math.sin(theta), z: 0 });
      }
      const bonds: Bond[] = [];
      for (let i = 0; i < 6; i++) {
        bonds.push({
          id: uid(),
          atomA: atoms[i].id,
          atomB: atoms[(i + 1) % 6].id,
          type: i % 2 === 0 ? 'double' : 'single',
          order: i % 2 === 0 ? 2 : 1,
        });
      }
      for (let i = 0; i < 6; i++) {
        bonds.push({ id: uid(), atomA: atoms[i].id, atomB: atoms[i + 6].id, type: 'single', order: 1 });
      }
      return { atoms, bonds };
    },
  },
};

export class MoleculeData {
  private molecule: Molecule | null = null;
  private selectedAtomIds: string[] = [];

  constructor() {
    this.loadPreset('h2o');
  }

  getMolecule(): Molecule | null {
    return this.molecule;
  }

  getAtom(id: string): Atom | undefined {
    return this.molecule?.atoms.find((a) => a.id === id);
  }

  getBond(id: string): Bond | undefined {
    return this.molecule?.bonds.find((b) => b.id === id);
  }

  getSelectedAtomIds(): string[] {
    return this.selectedAtomIds;
  }

  loadPreset(key: string): boolean {
    const def = PresetMolecules[key];
    if (!def) return false;
    const { atoms, bonds } = def.build();
    this.molecule = {
      id: uid(),
      name: def.name,
      formula: def.formula,
      atoms,
      bonds,
    };
    this.selectedAtomIds = [];
    eventBus.emit('molecule:changed', this.molecule);
    eventBus.emit('atom:selected', { atomId: null, selectedAtomIds: [] });
    return true;
  }

  updateAtom(id: string, changes: Partial<Atom>): boolean {
    if (!this.molecule) return false;
    const atom = this.molecule.atoms.find((a) => a.id === id);
    if (!atom) return false;
    Object.assign(atom, changes);
    eventBus.emit('atom:updated', { atomId: id, changes });
    eventBus.emit('molecule:changed', this.molecule);
    return true;
  }

  selectAtom(id: string | null, toggle = false): void {
    if (toggle && id) {
      const idx = this.selectedAtomIds.indexOf(id);
      if (idx >= 0) {
        this.selectedAtomIds.splice(idx, 1);
      } else if (this.selectedAtomIds.length < 3) {
        this.selectedAtomIds.push(id);
      } else {
        this.selectedAtomIds = [id];
      }
    } else {
      this.selectedAtomIds = id ? [id] : [];
    }
    eventBus.emit('atom:selected', {
      atomId: this.selectedAtomIds.length ? this.selectedAtomIds[this.selectedAtomIds.length - 1] : null,
      selectedAtomIds: [...this.selectedAtomIds],
    });
  }

  toJSON(): string {
    if (!this.molecule) return '{}';
    const data = {
      name: this.molecule.name,
      formula: this.molecule.formula,
      atoms: this.molecule.atoms.map(({ type, x, y, z }) => ({ type, x, y, z })),
      bonds: this.molecule.bonds.map(({ atomA, atomB, type, order }) => {
        const aIdx = this.molecule!.atoms.findIndex((a) => a.id === atomA);
        const bIdx = this.molecule!.atoms.findIndex((a) => a.id === atomB);
        return { atomA: aIdx, atomB: bIdx, type, order };
      }),
    };
    return JSON.stringify(data);
  }

  fromJSON(json: string): boolean {
    try {
      const data = JSON.parse(json);
      if (!data.atoms || !Array.isArray(data.atoms)) return false;
      if (!data.bonds || !Array.isArray(data.bonds)) return false;
      const atoms: Atom[] = data.atoms.map((a: any) => ({
        id: uid(),
        type: a.type as AtomType,
        x: Number(a.x) || 0,
        y: Number(a.y) || 0,
        z: Number(a.z) || 0,
      }));
      const bonds: Bond[] = data.bonds
        .filter((b: any) => b.atomA >= 0 && b.atomB >= 0 && b.atomA < atoms.length && b.atomB < atoms.length)
        .map((b: any) => ({
          id: uid(),
          atomA: atoms[b.atomA].id,
          atomB: atoms[b.atomB].id,
          type: (b.type as BondType) || 'single',
          order: Number(b.order) || 1,
        }));
      this.molecule = {
        id: uid(),
        name: data.name || '自定义分子',
        formula: data.formula || '自定义',
        atoms,
        bonds,
      };
      this.selectedAtomIds = [];
      eventBus.emit('molecule:changed', this.molecule);
      eventBus.emit('atom:selected', { atomId: null, selectedAtomIds: [] });
      return true;
    } catch (e) {
      console.error('MoleculeData.fromJSON error:', e);
      return false;
    }
  }
}

export const moleculeData = new MoleculeData();
