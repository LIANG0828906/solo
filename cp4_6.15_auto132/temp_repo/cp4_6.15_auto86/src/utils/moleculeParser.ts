import * as d3 from 'd3';
import { v4 as uuidv4 } from 'uuid';
import { Molecule, Atom, Bond } from '../types/molecule';
import { ELEMENT_PROPERTIES } from '../data/presetMolecules';

const SMILES_PATTERN = /([A-Z][a-z]?)(\d*)|(\[.*?\])|(\()|(\))|(\d)|(\.)|(=)|(#)|(-)/g;

interface ParseState {
  atoms: Atom[];
  bonds: Bond[];
  currentAtomIndex: number;
  branchStack: number[];
  ringClosures: Map<number, number>;
  lastAtomIndex: number | null;
  currentBondOrder: number;
}

export function parseSMILES(smiles: string): Molecule {
  const state: ParseState = {
    atoms: [],
    bonds: [],
    currentAtomIndex: 0,
    branchStack: [],
    ringClosures: new Map(),
    lastAtomIndex: null,
    currentBondOrder: 1,
  };

  let match;
  SMILES_PATTERN.lastIndex = 0;

  while ((match = SMILES_PATTERN.exec(smiles)) !== null) {
    const [token, element, charge, bracket, lparen, rparen, ring, dot, doubleBond, tripleBond, singleBond] = match;

    if (element) {
      addAtom(state, element);
      if (state.lastAtomIndex !== null) {
        addBond(state, state.lastAtomIndex, state.currentAtomIndex - 1, state.currentBondOrder);
      }
      state.lastAtomIndex = state.currentAtomIndex - 1;
      state.currentBondOrder = 1;
    } else if (bracket) {
      const elementMatch = bracket.match(/[A-Z][a-z]?/);
      if (elementMatch) {
        addAtom(state, elementMatch[0]);
        if (state.lastAtomIndex !== null) {
          addBond(state, state.lastAtomIndex, state.currentAtomIndex - 1, state.currentBondOrder);
        }
        state.lastAtomIndex = state.currentAtomIndex - 1;
        state.currentBondOrder = 1;
      }
    } else if (lparen) {
      state.branchStack.push(state.lastAtomIndex!);
    } else if (rparen) {
      state.lastAtomIndex = state.branchStack.pop()!;
    } else if (ring) {
      const ringNum = parseInt(ring);
      if (state.ringClosures.has(ringNum)) {
        const otherIndex = state.ringClosures.get(ringNum)!;
        addBond(state, otherIndex, state.lastAtomIndex!, state.currentBondOrder);
        state.ringClosures.delete(ringNum);
      } else {
        state.ringClosures.set(ringNum, state.lastAtomIndex!);
      }
      state.currentBondOrder = 1;
    } else if (doubleBond) {
      state.currentBondOrder = 2;
    } else if (tripleBond) {
      state.currentBondOrder = 3;
    } else if (singleBond) {
      state.currentBondOrder = 1;
    } else if (dot) {
      state.lastAtomIndex = null;
      state.currentBondOrder = 1;
    }
  }

  const atomsWithCoords = generate3DCoordinates(state.atoms, state.bonds);

  const formula = generateFormula(atomsWithCoords);

  return {
    id: uuidv4(),
    name: smiles,
    formula,
    atoms: atomsWithCoords,
    bonds: state.bonds,
  };
}

function addAtom(state: ParseState, element: string): void {
  const props = ELEMENT_PROPERTIES[element] || { color: '#909090', radius: 0.75 };
  const atom: Atom = {
    id: uuidv4(),
    element,
    x: 0,
    y: 0,
    z: 0,
    radius: props.radius,
    color: props.color,
  };
  state.atoms.push(atom);
  state.currentAtomIndex++;
}

function addBond(state: ParseState, atom1Idx: number, atom2Idx: number, order: number): void {
  const existingBond = state.bonds.find(
    (b) =>
      (b.atom1Id === state.atoms[atom1Idx]?.id && b.atom2Id === state.atoms[atom2Idx]?.id) ||
      (b.atom1Id === state.atoms[atom2Idx]?.id && b.atom2Id === state.atoms[atom1Idx]?.id)
  );

  if (!existingBond && state.atoms[atom1Idx] && state.atoms[atom2Idx]) {
    state.bonds.push({
      id: uuidv4(),
      atom1Id: state.atoms[atom1Idx].id,
      atom2Id: state.atoms[atom2Idx].id,
      order,
    });
  }
}

function generate3DCoordinates(atoms: Atom[], bonds: Bond[]): Atom[] {
  if (atoms.length === 0) return atoms;

  const n = atoms.length;
  const positions = new Array(n).fill(null).map(() => ({ x: 0, y: 0, z: 0 }));

  const adjacencyList: number[][] = new Array(n).fill(null).map(() => []);
  const atomIndexMap = new Map<string, number>();
  atoms.forEach((atom, index) => atomIndexMap.set(atom.id, index));

  bonds.forEach((bond) => {
    const idx1 = atomIndexMap.get(bond.atom1Id);
    const idx2 = atomIndexMap.get(bond.atom2Id);
    if (idx1 !== undefined && idx2 !== undefined) {
      adjacencyList[idx1].push(idx2);
      adjacencyList[idx2].push(idx1);
    }
  });

  const visited = new Set<number>();
  const queue: number[] = [0];
  const angleStep = (2 * Math.PI) / Math.max(n, 1);
  const radius = 1.5;

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    const depth = getDepth(0, current, adjacencyList);
    const angle = current * angleStep;

    positions[current] = {
      x: radius * Math.cos(angle) * (1 + depth * 0.3),
      y: radius * Math.sin(angle) * (1 + depth * 0.3),
      z: depth * 0.5,
    };

    adjacencyList[current].forEach((neighbor) => {
      if (!visited.has(neighbor)) {
        queue.push(neighbor);
      }
    });
  }

  const simulation = d3
    .forceSimulation(positions as d3.SimulationNodeDatum[])
    .force(
      'link',
      d3
        .forceLink(
          bonds.map((b) => ({
            source: atomIndexMap.get(b.atom1Id)!,
            target: atomIndexMap.get(b.atom2Id)!,
          }))
        )
        .distance(1.5)
        .strength(0.8)
    )
    .force('charge', d3.forceManyBody().strength(-2))
    .force('center', d3.forceCenter(0, 0))
    .stop();

  for (let i = 0; i < 100; i++) {
    simulation.tick();
  }

  return atoms.map((atom, index) => ({
    ...atom,
    x: positions[index].x,
    y: positions[index].y,
    z: positions[index].z,
  }));
}

function getDepth(start: number, target: number, adjacencyList: number[][]): number {
  const visited = new Set<number>();
  const queue: { node: number; depth: number }[] = [{ node: start, depth: 0 }];

  while (queue.length > 0) {
    const { node, depth } = queue.shift()!;
    if (node === target) return depth;
    if (visited.has(node)) continue;
    visited.add(node);

    adjacencyList[node].forEach((neighbor) => {
      if (!visited.has(neighbor)) {
        queue.push({ node: neighbor, depth: depth + 1 });
      }
    });
  }

  return 0;
}

function generateFormula(atoms: Atom[]): string {
  const elementCounts: Record<string, number> = {};

  atoms.forEach((atom) => {
    elementCounts[atom.element] = (elementCounts[atom.element] || 0) + 1;
  });

  const order = ['C', 'H', 'N', 'O', 'F', 'Cl', 'Br', 'I', 'P', 'S'];
  const sortedElements = Object.keys(elementCounts).sort((a, b) => {
    const idxA = order.indexOf(a);
    const idxB = order.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  return sortedElements
    .map((el) => {
      const count = elementCounts[el];
      return count > 1 ? `${el}${toSubscript(count)}` : el;
    })
    .join('');
}

function toSubscript(num: number): string {
  const subscripts = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];
  return num.toString().split('').map((d) => subscripts[parseInt(d)]).join('');
}

export function getBondedAtoms(atomId: string, molecule: Molecule): Atom[] {
  const bondedAtomIds = new Set<string>();

  molecule.bonds.forEach((bond) => {
    if (bond.atom1Id === atomId) {
      bondedAtomIds.add(bond.atom2Id);
    } else if (bond.atom2Id === atomId) {
      bondedAtomIds.add(bond.atom1Id);
    }
  });

  return molecule.atoms.filter((atom) => bondedAtomIds.has(atom.id));
}
