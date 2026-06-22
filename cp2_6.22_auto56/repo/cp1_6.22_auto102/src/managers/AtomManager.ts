import { Atom, AtomType, Molecule, Vector2, ATOM_CONFIG, Bond } from '@/types';

export class AtomManager {
  private atoms: Map<string, Atom> = new Map();
  private molecules: Map<string, Molecule> = new Map();
  private bonds: Map<string, Bond> = new Map();
  private canvasWidth: number;
  private canvasHeight: number;
  public readonly MAX_ATOMS = 150;

  constructor(canvasWidth: number = 800, canvasHeight: number = 600) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  public setCanvasSize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  public addAtom(type: AtomType, x: number, y: number): Atom | null {
    if (this.atoms.size >= this.MAX_ATOMS) return null;

    const config = ATOM_CONFIG[type];
    const id = this.generateId('atom');

    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 2.5;

    const atom: Atom = {
      id,
      type,
      position: { x, y },
      velocity: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      },
      radius: config.radius,
      color: config.color,
      bondedTo: new Set(),
      moleculeId: null,
      isSelected: false,
      spawnTime: performance.now(),
      isDragging: false,
      lastDragPosition: null,
    };

    this.atoms.set(id, atom);
    return atom;
  }

  public removeAtom(id: string): void {
    const atom = this.atoms.get(id);
    if (!atom) return;

    atom.bondedTo.forEach((bondedId) => {
      const bondedAtom = this.atoms.get(bondedId);
      if (bondedAtom) {
        bondedAtom.bondedTo.delete(id);
      }
      const bondKey = this.getBondKey(id, bondedId);
      this.bonds.delete(bondKey);
    });

    if (atom.moleculeId) {
      this.removeFromMolecule(atom.moleculeId, id);
    }

    this.atoms.delete(id);
  }

  public getAtom(id: string): Atom | undefined {
    return this.atoms.get(id);
  }

  public getAllAtoms(): Atom[] {
    return Array.from(this.atoms.values());
  }

  public getMolecules(): Molecule[] {
    return Array.from(this.molecules.values());
  }

  public getBonds(): Bond[] {
    return Array.from(this.bonds.values());
  }

  public selectAtom(id: string | null): void {
    this.atoms.forEach((atom) => {
      atom.isSelected = atom.id === id;
    });
  }

  public getSelectedAtom(): Atom | undefined {
    return this.getAllAtoms().find((atom) => atom.isSelected);
  }

  public startDrag(id: string): void {
    const atom = this.atoms.get(id);
    if (atom) {
      atom.isDragging = true;
      atom.lastDragPosition = { ...atom.position };
    }
  }

  public dragAtom(id: string, x: number, y: number): void {
    const atom = this.atoms.get(id);
    if (atom && atom.isDragging) {
      atom.lastDragPosition = { ...atom.position };
      atom.position.x = x;
      atom.position.y = y;
      atom.velocity = { x: 0, y: 0 };
    }
  }

  public endDrag(id: string): void {
    const atom = this.atoms.get(id);
    if (atom && atom.isDragging) {
      atom.isDragging = false;
      if (atom.lastDragPosition) {
        const dx = atom.position.x - atom.lastDragPosition.x;
        const dy = atom.position.y - atom.lastDragPosition.y;
        atom.velocity = { x: dx * 0.5, y: dy * 0.5 };
      }
      atom.lastDragPosition = null;
    }
  }

  public findAtomAtPosition(x: number, y: number): Atom | null {
    const atoms = this.getAllAtoms();
    for (let i = atoms.length - 1; i >= 0; i--) {
      const atom = atoms[i];
      const dx = atom.position.x - x;
      const dy = atom.position.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= atom.radius + 2) {
        return atom;
      }
    }
    return null;
  }

  public createBond(atom1Id: string, atom2Id: string, bondType: 'single' | 'double' | 'triple', energy: number): void {
    const atom1 = this.atoms.get(atom1Id);
    const atom2 = this.atoms.get(atom2Id);
    if (!atom1 || !atom2) return;

    if (atom1.bondedTo.has(atom2Id)) return;

    atom1.bondedTo.add(atom2Id);
    atom2.bondedTo.add(atom1Id);

    const bondKey = this.getBondKey(atom1Id, atom2Id);
    this.bonds.set(bondKey, {
      atom1Id,
      atom2Id,
      type: bondType,
      energy,
      formationTime: performance.now(),
    });

    this.mergeMolecules(atom1Id, atom2Id);

    const midpoint: Vector2 = {
      x: (atom1.position.x + atom2.position.x) / 2,
      y: (atom1.position.y + atom2.position.y) / 2,
    };
    const momentumAngle = Math.random() * Math.PI * 2;
    const momentumSpeed = 0.5 + Math.random() * 1;
    const momentumVx = Math.cos(momentumAngle) * momentumSpeed;
    const momentumVy = Math.sin(momentumAngle) * momentumSpeed;

    this.applyMomentumToConnected(atom1Id, momentumVx, momentumVy, new Set());
  }

  private applyMomentumToConnected(atomId: string, vx: number, vy: number, visited: Set<string>): void {
    if (visited.has(atomId)) return;
    visited.add(atomId);

    const atom = this.atoms.get(atomId);
    if (!atom) return;

    atom.velocity.x += vx;
    atom.velocity.y += vy;

    atom.bondedTo.forEach((bondedId) => {
      this.applyMomentumToConnected(bondedId, vx, vy, visited);
    });
  }

  private mergeMolecules(atom1Id: string, atom2Id: string): void {
    const atom1 = this.atoms.get(atom1Id);
    const atom2 = this.atoms.get(atom2Id);
    if (!atom1 || !atom2) return;

    if (atom1.moleculeId && atom2.moleculeId && atom1.moleculeId === atom2.moleculeId) {
      return;
    }

    if (!atom1.moleculeId && !atom2.moleculeId) {
      const moleculeId = this.generateId('mol');
      const molecule: Molecule = {
        id: moleculeId,
        atomIds: new Set([atom1Id, atom2Id]),
        bonds: [],
      };
      this.molecules.set(moleculeId, molecule);
      atom1.moleculeId = moleculeId;
      atom2.moleculeId = moleculeId;
    } else if (atom1.moleculeId && !atom2.moleculeId) {
      const molecule = this.molecules.get(atom1.moleculeId)!;
      molecule.atomIds.add(atom2Id);
      atom2.moleculeId = atom1.moleculeId;
    } else if (!atom1.moleculeId && atom2.moleculeId) {
      const molecule = this.molecules.get(atom2.moleculeId)!;
      molecule.atomIds.add(atom1Id);
      atom1.moleculeId = atom2.moleculeId;
    } else {
      const mol1 = this.molecules.get(atom1.moleculeId!)!;
      const mol2 = this.molecules.get(atom2.moleculeId!)!;

      mol2.atomIds.forEach((id) => {
        mol1.atomIds.add(id);
        const a = this.atoms.get(id);
        if (a) a.moleculeId = mol1.id;
      });

      this.molecules.delete(mol2.id);
    }
  }

  private removeFromMolecule(moleculeId: string, atomId: string): void {
    const molecule = this.molecules.get(moleculeId);
    if (!molecule) return;

    molecule.atomIds.delete(atomId);

    if (molecule.atomIds.size === 0) {
      this.molecules.delete(moleculeId);
      return;
    }

    if (molecule.atomIds.size === 1) {
      const [remainingId] = [...molecule.atomIds];
      const remaining = this.atoms.get(remainingId);
      if (remaining) {
        remaining.moleculeId = null;
      }
      this.molecules.delete(moleculeId);
      return;
    }

    this.rebuildMoleculeConnections(moleculeId);
  }

  private rebuildMoleculeConnections(moleculeId: string): void {
    const molecule = this.molecules.get(moleculeId);
    if (!molecule) return;

    const atomIds = [...molecule.atomIds];
    const visited = new Set<string>();
    const components: Set<string>[] = [];

    const traverse = (startId: string, component: Set<string>): void => {
      const stack = [startId];
      while (stack.length > 0) {
        const id = stack.pop()!;
        if (visited.has(id)) continue;
        visited.add(id);
        component.add(id);

        const atom = this.atoms.get(id);
        if (atom) {
          atom.bondedTo.forEach((bondedId) => {
            if (molecule.atomIds.has(bondedId) && !visited.has(bondedId)) {
              stack.push(bondedId);
            }
          });
        }
      }
    };

    for (const id of atomIds) {
      if (!visited.has(id)) {
        const component = new Set<string>();
        traverse(id, component);
        components.push(component);
      }
    }

    if (components.length > 1) {
      this.molecules.delete(moleculeId);
      for (const component of components) {
        if (component.size === 1) {
          const [singleId] = [...component];
          const single = this.atoms.get(singleId);
          if (single) single.moleculeId = null;
        } else {
          const newMoleculeId = this.generateId('mol');
          const newMolecule: Molecule = {
            id: newMoleculeId,
            atomIds: component,
            bonds: [],
          };
          this.molecules.set(newMoleculeId, newMolecule);
          component.forEach((id) => {
            const a = this.atoms.get(id);
            if (a) a.moleculeId = newMoleculeId;
          });
        }
      }
    }
  }

  public getAtomCount(): number {
    return this.atoms.size;
  }

  public getMoleculeCount(): number {
    return this.molecules.size;
  }

  public getBondCount(): number {
    return this.bonds.size;
  }

  public reset(): void {
    this.atoms.clear();
    this.molecules.clear();
    this.bonds.clear();
  }

  private getBondKey(id1: string, id2: string): string {
    return [id1, id2].sort().join('-');
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public enforceBondConstraints(bondRules: { getBondDistance: (t1: AtomType, t2: AtomType) => number }): void {
    const processedBonds = new Set<string>();
    this.atoms.forEach((atom) => {
      atom.bondedTo.forEach((bondedId) => {
        const bondKey = this.getBondKey(atom.id, bondedId);
        if (processedBonds.has(bondKey)) return;
        processedBonds.add(bondKey);

        const bonded = this.atoms.get(bondedId);
        if (!bonded) return;

        const idealDistance = bondRules.getBondDistance(atom.type, bonded.type);
        const dx = bonded.position.x - atom.position.x;
        const dy = bonded.position.y - atom.position.y;
        const currentDistance = Math.sqrt(dx * dx + dy * dy);

        if (currentDistance === 0) return;

        const diff = currentDistance - idealDistance;
        const correctionFactor = 0.15;
        const cx = (dx / currentDistance) * diff * correctionFactor;
        const cy = (dy / currentDistance) * diff * correctionFactor;

        atom.position.x += cx;
        atom.position.y += cy;
        bonded.position.x -= cx;
        bonded.position.y -= cy;
      });
    });
  }

  public getCanvasBounds(): { width: number; height: number } {
    return { width: this.canvasWidth, height: this.canvasHeight };
  }
}
