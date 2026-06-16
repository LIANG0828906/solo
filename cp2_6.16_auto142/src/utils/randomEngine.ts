import { v4 as uuidv4 } from 'uuid';
import type { Atom, Bond, ElementType, MaterialData, Vec3 } from '../types';

export class RandomEngine {
  private seed: number;

  constructor(seed?: number) {
    this.seed = seed ?? Date.now();
  }

  private random(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  public range(min: number, max: number): number {
    return min + this.random() * (max - min);
  }

  public chance(probability: number): boolean {
    return this.random() < probability;
  }

  public pickInt(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  public applyVacancyDefects(
    material: MaterialData,
    density: number
  ): MaterialData {
    if (density <= 0) return material;

    const removeCount = Math.floor(material.atoms.length * density);
    const removeIndices = new Set<number>();

    while (removeIndices.size < removeCount && removeIndices.size < material.atoms.length) {
      removeIndices.add(this.pickInt(0, material.atoms.length - 1));
    }

    const removedIds = new Set<string>();
    const newAtoms: Atom[] = [];

    material.atoms.forEach((atom, idx) => {
      if (removeIndices.has(idx)) {
        removedIds.add(atom.id);
      } else {
        newAtoms.push({ ...atom });
      }
    });

    const newBonds = material.bonds.filter(
      (bond) => !removedIds.has(bond.atomAId) && !removedIds.has(bond.atomBId)
    );

    newAtoms.forEach((atom) => {
      atom.neighbors = atom.neighbors.filter((n) => !removedIds.has(n));
      atom.coordinationNumber = atom.neighbors.length;
    });

    return {
      ...material,
      atoms: newAtoms,
      bonds: newBonds,
    };
  }

  public applyInterstitialDefects(
    material: MaterialData,
    density: number,
    element: ElementType = 'C'
  ): MaterialData {
    if (density <= 0) return material;

    const addCount = Math.floor(material.atoms.length * density);
    const newAtoms = [...material.atoms];
    const newBonds = [...material.bonds];

    const bounds = this.computeBounds(material.atoms);

    for (let i = 0; i < addCount; i++) {
      const pos: Vec3 = {
        x: this.range(bounds.minX, bounds.maxX),
        y: this.range(bounds.minY, bounds.maxY),
        z: this.range(bounds.minZ, bounds.maxZ),
      };

      const newAtom: Atom = {
        id: uuidv4(),
        element,
        position: pos,
        coordinationNumber: 0,
        neighbors: [],
        isDefect: true,
      };

      newAtoms.forEach((existing) => {
        const dist = this.distance(existing.position, pos);
        if (dist < 1.8 && dist > 0.5) {
          newBonds.push({
            id: uuidv4(),
            atomAId: existing.id,
            atomBId: newAtom.id,
            length: dist,
          });
          existing.neighbors.push(newAtom.id);
          existing.coordinationNumber++;
          newAtom.neighbors.push(existing.id);
          newAtom.coordinationNumber++;
        }
      });

      newAtoms.push(newAtom);
    }

    return {
      ...material,
      atoms: newAtoms,
      bonds: newBonds,
    };
  }

  private computeBounds(atoms: Atom[]) {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    atoms.forEach((a) => {
      minX = Math.min(minX, a.position.x);
      maxX = Math.max(maxX, a.position.x);
      minY = Math.min(minY, a.position.y);
      maxY = Math.max(maxY, a.position.y);
      minZ = Math.min(minZ, a.position.z);
      maxZ = Math.max(maxZ, a.position.z);
    });

    return { minX, maxX, minY, maxY, minZ, maxZ };
  }

  public distance(a: Vec3, b: Vec3): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  public generateDefects(
    material: MaterialData,
    density: number
  ): MaterialData {
    let result = this.applyVacancyDefects(material, density * 0.6);
    result = this.applyInterstitialDefects(result, density * 0.4);
    return result;
  }
}

export const randomEngine = new RandomEngine();
