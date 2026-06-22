import { eventBus } from '@/EventBus';

export interface AtomData {
  id: number;
  index: number;
  position: { x: number; y: number; z: number };
  color: string;
  originalColor: string;
  isEdited: boolean;
  connectedAtomIds: number[];
}

export interface BondData {
  id: number;
  atomA: number;
  atomB: number;
  isEdited: boolean;
}

export interface CrystalData {
  atoms: AtomData[];
  bonds: BondData[];
  growthLayer: number;
}

const DEFAULT_ATOM_COLOR = '#4A4A4A';
const GRID_SIZE = 0.5;
const BOND_DISTANCE = 0.4;

export class CrystalStructure {
  private atoms: Map<number, AtomData> = new Map();
  private bonds: Map<number, BondData> = new Map();
  private nextAtomId: number = 0;
  private nextBondId: number = 0;
  private atomIndexCounter: number = 0;
  public growthLayer: number = 1;

  constructor() {
    this.generateDiamondStructure(3, 3, 3);
  }

  private generateDiamondStructure(nx: number, ny: number, nz: number): void {
    this.clear();

    const offsetX = (nx - 1) / 2;
    const offsetY = (ny - 1) / 2;
    const offsetZ = (nz - 1) / 2;

    const basis = [
      { x: 0, y: 0, z: 0 },
      { x: 0.25, y: 0.25, z: 0.25 }
    ];

    const fccOffsets = [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0.5, z: 0.5 },
      { x: 0.5, y: 0, z: 0.5 },
      { x: 0.5, y: 0.5, z: 0 }
    ];

    const atomPositions: { id: number; pos: { x: number; y: number; z: number } }[] = [];

    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < ny; j++) {
        for (let k = 0; k < nz; k++) {
        for (const fcc of fccOffsets) {
          for (const base of basis) {
            const x = (i - offsetX) + fcc.x + base.x;
            const y = (j - offsetY) + fcc.y + base.y;
            const z = (k - offsetZ) + fcc.z + base.z;
            const id = this.addAtomInternal(x, y, z);
            atomPositions.push({ id, pos: { x, y, z } });
          }
        }
      }
      }
    }

    this.generateBonds();
    eventBus.emit('crystal:updated');
  }

  private addAtomInternal(x: number, y: number, z: number): number {
    const id = this.nextAtomId++;
    this.atomIndexCounter++;
    this.atoms.set(id, {
      id,
      index: this.atomIndexCounter,
      position: { x, y, z },
      color: DEFAULT_ATOM_COLOR,
      originalColor: DEFAULT_ATOM_COLOR,
      isEdited: false,
      connectedAtomIds: []
    });
    return id;
  }

  addAtom(x: number, y: number, z: number): number {
    const id = this.addAtomInternal(x, y, z);
    this.generateBonds();
    eventBus.emit('crystal:updated');
    return id;
  }

  getAtom(id: number): AtomData | undefined {
    return this.atoms.get(id);
  }

  getAllAtoms(): AtomData[] {
    return Array.from(this.atoms.values());
  }

  getAllBonds(): BondData[] {
    return Array.from(this.bonds.values());
  }

  removeAtom(id: number): boolean {
    if (!this.atoms.has(id)) return false;
    const bondsToRemove: number[] = [];
    this.bonds.forEach((bond, bondId) => {
      if (bond.atomA === id || bond.atomB === id) {
        bondsToRemove.push(bondId);
      }
    });
    bondsToRemove.forEach(bondId => this.bonds.delete(bondId));
    this.atoms.delete(id);
    this.atoms.forEach(atom => {
      atom.connectedAtomIds = atom.connectedAtomIds.filter(aid => aid !== id);
    });
    eventBus.emit('crystal:updated');
    return true;
  }

  updateAtomPosition(id: number, x: number, y: number, z: number, markEdited: boolean = true): void {
    const atom = this.atoms.get(id);
    if (!atom) return;
    atom.position = { x, y, z };
    if (markEdited) {
      atom.isEdited = true;
    }
    this.generateBonds();
    eventBus.emit('crystal:updated');
  }

  updateAtomColor(id: number, color: string): void {
    const atom = this.atoms.get(id);
    if (!atom) return;
    atom.color = color;
    eventBus.emit('crystal:updated');
  }

  getConnectedAtoms(id: number): number[] {
    const atom = this.atoms.get(id);
    return atom ? atom.connectedAtomIds : [];
  }

  private clear(): void {
    this.atoms.clear();
    this.bonds.clear();
    this.nextAtomId = 0;
    this.nextBondId = 0;
    this.atomIndexCounter = 0;
  }

  private generateBonds(): void {
    this.bonds.clear();
    this.atoms.forEach(atom => {
      atom.connectedAtomIds = [];
    });

    const atomsArray = Array.from(this.atoms.values());
    for (let i = 0; i < atomsArray.length; i++) {
      for (let j = i + 1; j < atomsArray.length; j++) {
        const a = atomsArray[i];
        const b = atomsArray[j];
        const dx = a.position.x - b.position.x;
        const dy = a.position.y - b.position.y;
        const dz = a.position.z - b.position.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < 0.45 && dist > 0.01) {
          const id = this.nextBondId++;
          const isEdited = a.isEdited || b.isEdited;
          this.bonds.set(id, {
            id,
            atomA: a.id,
            atomB: b.id,
            isEdited
          });
          a.connectedAtomIds.push(b.id);
          b.connectedAtomIds.push(a.id);
        }
      }
    }
  }

  snapToGrid(value: number): number {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  }

  setGrowthLayer(layer: number): void {
    const clamped = Math.max(1, Math.min(5, layer));
    if (this.growthLayer === clamped) return;
    this.growthLayer = clamped;
    const size = clamped * 2 + 1;
    this.generateDiamondStructure(size, size, size);
  }

  exportToJSON(): string {
    const data: CrystalData = {
      atoms: this.getAllAtoms(),
      bonds: this.getAllBonds(),
      growthLayer: this.growthLayer
    };
    return JSON.stringify(data, null, 2);
  }

  importFromJSON(json: string): void {
    try {
      const data: CrystalData = JSON.parse(json);
      this.clear();
      data.atoms.forEach(atom => {
        this.atoms.set(atom.id, { ...atom, connectedAtomIds: [] });
        if (atom.id >= this.nextAtomId) {
          this.nextAtomId = atom.id + 1;
        }
        if (atom.index >= this.atomIndexCounter) {
          this.atomIndexCounter = atom.index + 1;
        }
      });
      data.bonds.forEach(bond => {
        this.bonds.set(bond.id, bond);
        if (bond.id >= this.nextBondId) {
          this.nextBondId = bond.id + 1;
        }
        const atomA = this.atoms.get(bond.atomA);
        const atomB = this.atoms.get(bond.atomB);
        if (atomA && !atomA.connectedAtomIds.includes(bond.atomB)) {
          atomA.connectedAtomIds.push(bond.atomB);
        }
        if (atomB && !atomB.connectedAtomIds.includes(bond.atomA)) {
          atomB.connectedAtomIds.push(bond.atomA);
        }
      });
      this.growthLayer = data.growthLayer || 1;
      eventBus.emit('crystal:updated');
    } catch (e) {
      console.error('Failed to import crystal data:', e);
    }
  }
}
