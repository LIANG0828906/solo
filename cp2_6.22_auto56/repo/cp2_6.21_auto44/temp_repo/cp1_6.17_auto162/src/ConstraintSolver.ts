import {
  Atom,
  Molecule,
  AtomType,
  ConstraintResult,
  ConstraintViolation,
  Suggestion,
  AtomSpecs,
  eventBus,
  moleculeData,
} from './MoleculeData';

type BondKey = string;

const getBondKey = (a: AtomType, b: AtomType, order: number): BondKey => {
  const x = a;
  const y = b;
  const sorted = x < y ? `${x}-${y}` : `${y}-${x}`;
  const orderSuffix = order >= 3 ? '\u2261' : order === 2 ? '=' : '-';
  return sorted + orderSuffix;
};

interface BondConstraint {
  minLength: number;
  maxLength: number;
  idealLength: number;
}

const BondConstraints: Record<BondKey, BondConstraint> = {
  'H-H-': { minLength: 0.6, maxLength: 0.9, idealLength: 0.74 },
  'C-H-': { minLength: 0.9, maxLength: 1.3, idealLength: 1.09 },
  'C-C-': { minLength: 1.2, maxLength: 1.7, idealLength: 1.54 },
  'C-C=': { minLength: 1.1, maxLength: 1.5, idealLength: 1.34 },
  'C-C≡': { minLength: 1.0, maxLength: 1.35, idealLength: 1.20 },
  'C-N-': { minLength: 1.1, maxLength: 1.6, idealLength: 1.47 },
  'C-N=': { minLength: 1.0, maxLength: 1.45, idealLength: 1.27 },
  'C-O-': { minLength: 1.1, maxLength: 1.6, idealLength: 1.43 },
  'C-O=': { minLength: 1.0, maxLength: 1.35, idealLength: 1.20 },
  'N-H-': { minLength: 0.85, maxLength: 1.25, idealLength: 1.01 },
  'O-H-': { minLength: 0.8, maxLength: 1.2, idealLength: 0.96 },
  'S-H-': { minLength: 1.1, maxLength: 1.5, idealLength: 1.34 },
  'P-H-': { minLength: 1.2, maxLength: 1.6, idealLength: 1.42 },
  'N-N-': { minLength: 1.1, maxLength: 1.6, idealLength: 1.45 },
  'N-N=': { minLength: 1.0, maxLength: 1.4, idealLength: 1.20 },
  'N-O-': { minLength: 1.1, maxLength: 1.6, idealLength: 1.40 },
  'O-O-': { minLength: 1.0, maxLength: 1.6, idealLength: 1.47 },
  'C-S-': { minLength: 1.5, maxLength: 2.0, idealLength: 1.81 },
  'C-S=': { minLength: 1.35, maxLength: 1.75, idealLength: 1.56 },
  'C-P-': { minLength: 1.6, maxLength: 2.0, idealLength: 1.84 },
  'N-S-': { minLength: 1.4, maxLength: 1.9, idealLength: 1.71 },
  'O-S-': { minLength: 1.3, maxLength: 1.8, idealLength: 1.57 },
  'H-S-': { minLength: 1.1, maxLength: 1.5, idealLength: 1.34 },
};

function getConstraint(atomA: Atom, atomB: Atom, order: number): BondConstraint {
  const k1 = getBondKey(atomA.type, atomB.type, order);
  if (BondConstraints[k1]) return BondConstraints[k1];
  const k2 = getBondKey(atomA.type, atomB.type, 1);
  if (BondConstraints[k2]) return BondConstraints[k2];
  const rA = AtomSpecs[atomA.type]?.covalentRadius ?? 0.7;
  const rB = AtomSpecs[atomB.type]?.covalentRadius ?? 0.7;
  const ideal = rA + rB;
  return {
    minLength: Math.max(0.6, ideal * 0.8),
    maxLength: ideal * 1.4,
    idealLength: ideal,
  };
}

function vecDist(ax: number, ay: number, az: number, bx: number, by: number, bz: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  const dz = az - bz;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function bondAngleDeg(
  ax: number, ay: number, az: number,
  bx: number, by: number, bz: number,
  cx: number, cy: number, cz: number
): number {
  const bax = ax - bx;
  const bay = ay - by;
  const baz = az - bz;
  const bcx = cx - bx;
  const bcy = cy - by;
  const bcz = cz - bz;
  const baLen = Math.sqrt(bax * bax + bay * bay + baz * baz);
  const bcLen = Math.sqrt(bcx * bcx + bcy * bcy + bcz * bcz);
  if (baLen < 1e-6 || bcLen < 1e-6) return 0;
  const cos = (bax * bcx + bay * bcy + baz * bcz) / (baLen * bcLen);
  const clamped = Math.max(-1, Math.min(1, cos));
  return (Math.acos(clamped) * 180) / Math.PI;
}

function expectedAngleRange(typeA: AtomType, typeB: AtomType, typeC: AtomType): [number, number] {
  const central = AtomSpecs[typeB];
  void typeA; void typeC; void central;
  return [80, 180];
}

export class ConstraintSolver {
  constructor() {
    eventBus.on('molecule:changed', (mol) => {
      const res = this.solve(mol);
      eventBus.emit('constraint:result', res);
    });
    eventBus.on('atom:updated', () => {
      const mol = moleculeData.getMolecule();
      if (mol) {
        const res = this.solve(mol);
        eventBus.emit('constraint:result', res);
      }
    });
  }

  public solve(molecule: Molecule): ConstraintResult {
    const violations: ConstraintViolation[] = [];
    const suggestions: Suggestion[] = [];
    const bondLengths: Record<string, number> = {};
    const atomMap: Record<string, Atom> = {};
    for (const a of molecule.atoms) atomMap[a.id] = a;
    for (const bond of molecule.bonds) {
      const a = atomMap[bond.atomA];
      const b = atomMap[bond.atomB];
      if (!a || !b) continue;
      const dist = vecDist(a.x, a.y, a.z, b.x, b.y, b.z);
      bondLengths[bond.id] = dist;
      const c = getConstraint(a, b, bond.order);
      if (dist < c.minLength || dist > c.maxLength) {
        violations.push({
          bondId: bond.id,
          type: 'bond-length',
          message:
          `键长 ${a.type}-${b.type}超出范围`,
          actual: Number(dist.toFixed(3)),
          min: Number(c.minLength.toFixed(3)),
          max: Number(c.maxLength.toFixed(3)),
          atomA: a.id,
          atomB: b.id,
        });
        if (dist > 0) {
          const diff = dist - c.idealLength;
          const nx = (b.x - a.x) / dist;
          const ny = (b.y - a.y) / dist;
          const nz = (b.z - a.z) / dist;
          const adj = diff * 0.3;
          suggestions.push({ atomId: a.id, dx: nx * adj, dy: ny * adj, dz: nz * adj });
          suggestions.push({ atomId: b.id, dx: -nx * adj, dy: -ny * adj, dz: -nz * adj });
        }
      }
    }
    const bondAngles: Array<{ atomA: string; atomB: string; atomC: string; angle: number }> = [];
    const adjacency: Record<string, string[]> = {};
    for (const bond of molecule.bonds) {
      if (!adjacency[bond.atomA]) adjacency[bond.atomA] = [];
      if (!adjacency[bond.atomB]) adjacency[bond.atomB] = [];
      adjacency[bond.atomA].push(bond.atomB);
      adjacency[bond.atomB].push(bond.atomA);
    }
    for (const centerId of Object.keys(adjacency)) {
      const neighbors = adjacency[centerId];
      const center = atomMap[centerId];
      if (!center || neighbors.length < 2) continue;
      for (let i = 0; i < neighbors.length; i++) {
        for (let j = i + 1; j < neighbors.length; j++) {
          const aId = neighbors[i];
          const cId = neighbors[j];
          const a = atomMap[aId];
          const c = atomMap[cId];
          if (!a || !c) continue;
          const angle = bondAngleDeg(
            a.x, a.y, a.z,
            center.x, center.y, center.z,
            c.x, c.y, c.z
          );
          bondAngles.push({ atomA: aId, atomB: centerId, atomC: cId, angle: Number(angle.toFixed(2)) });
          const [angMin, angMax] = expectedAngleRange(a.type, center.type, c.type);
          if (angle < angMin || angle > angMax) {
            violations.push({
              bondId: `angle_${aId}_${centerId}_${cId}`,
              type: 'bond-angle',
              message: `键角 ${a.type}-${center.type}-${c.type}超出范围`,
              actual: Number(angle.toFixed(2)),
              min: angMin,
              max: angMax,
              atomA: aId,
              atomB: centerId,
              atomC: cId,
            });
          }
        }
      }
    }
    return {
      isValid: violations.length === 0,
      violations,
      suggestions,
      bondLengths,
      bondAngles,
    };
  }
}

export const constraintSolver = new ConstraintSolver();
