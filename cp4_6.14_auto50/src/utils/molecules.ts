import { Molecule } from '../types';
import { v4 as uuidv4 } from 'uuid';

function makeId(): string {
  return uuidv4();
}

const waterAtoms = [
  { id: makeId(), name: 'O1', element: 'O', position: [0, 0, 0] as [number, number, number] },
  { id: makeId(), name: 'H1', element: 'H', position: [0.957, 0, 0] as [number, number, number] },
  { id: makeId(), name: 'H2', element: 'H', position: [-0.239, 0.927, 0] as [number, number, number] },
];

const waterBonds = [
  { id: makeId(), from: waterAtoms[0].id, to: waterAtoms[1].id, order: 1 },
  { id: makeId(), from: waterAtoms[0].id, to: waterAtoms[2].id, order: 1 },
];

const co2Atoms = [
  { id: makeId(), name: 'C1', element: 'C', position: [0, 0, 0] as [number, number, number] },
  { id: makeId(), name: 'O1', element: 'O', position: [1.16, 0, 0] as [number, number, number] },
  { id: makeId(), name: 'O2', element: 'O', position: [-1.16, 0, 0] as [number, number, number] },
];

const co2Bonds = [
  { id: makeId(), from: co2Atoms[0].id, to: co2Atoms[1].id, order: 2 },
  { id: makeId(), from: co2Atoms[0].id, to: co2Atoms[2].id, order: 2 },
];

const methaneAtoms = [
  { id: makeId(), name: 'C1', element: 'C', position: [0, 0, 0] as [number, number, number] },
  { id: makeId(), name: 'H1', element: 'H', position: [0.629, 0.629, 0.629] as [number, number, number] },
  { id: makeId(), name: 'H2', element: 'H', position: [-0.629, -0.629, 0.629] as [number, number, number] },
  { id: makeId(), name: 'H3', element: 'H', position: [-0.629, 0.629, -0.629] as [number, number, number] },
  { id: makeId(), name: 'H4', element: 'H', position: [0.629, -0.629, -0.629] as [number, number, number] },
];

const methaneBonds = [
  { id: makeId(), from: methaneAtoms[0].id, to: methaneAtoms[1].id, order: 1 },
  { id: makeId(), from: methaneAtoms[0].id, to: methaneAtoms[2].id, order: 1 },
  { id: makeId(), from: methaneAtoms[0].id, to: methaneAtoms[3].id, order: 1 },
  { id: makeId(), from: methaneAtoms[0].id, to: methaneAtoms[4].id, order: 1 },
];

const ethanolC1 = { id: makeId(), name: 'C1', element: 'C', position: [-0.75, 0, 0] as [number, number, number] };
const ethanolC2 = { id: makeId(), name: 'C2', element: 'C', position: [0.75, 0, 0] as [number, number, number] };
const ethanolO = { id: makeId(), name: 'O1', element: 'O', position: [1.65, 1.1, 0] as [number, number, number] };
const ethanolOH = { id: makeId(), name: 'H_o', element: 'H', position: [2.4, 0.9, 0] as [number, number, number] };
const ethanolH1 = { id: makeId(), name: 'H1', element: 'H', position: [-1.2, -0.95, 0.6] as [number, number, number] };
const ethanolH2 = { id: makeId(), name: 'H2', element: 'H', position: [-1.2, 0.3, -0.85] as [number, number, number] };
const ethanolH3 = { id: makeId(), name: 'H3', element: 'H', position: [-1.1, 0.9, 0.55] as [number, number, number] };
const ethanolH4 = { id: makeId(), name: 'H4', element: 'H', position: [0.5, -0.55, 0.9] as [number, number, number] };
const ethanolH5 = { id: makeId(), name: 'H5', element: 'H', position: [0.6, -0.75, -0.85] as [number, number, number] };

const ethanolAtoms = [
  ethanolC1, ethanolC2, ethanolO, ethanolOH, ethanolH1, ethanolH2, ethanolH3, ethanolH4, ethanolH5,
];

const ethanolBonds = [
  { id: makeId(), from: ethanolC1.id, to: ethanolC2.id, order: 1 },
  { id: makeId(), from: ethanolC2.id, to: ethanolO.id, order: 1 },
  { id: makeId(), from: ethanolO.id, to: ethanolOH.id, order: 1 },
  { id: makeId(), from: ethanolC1.id, to: ethanolH1.id, order: 1 },
  { id: makeId(), from: ethanolC1.id, to: ethanolH2.id, order: 1 },
  { id: makeId(), from: ethanolC1.id, to: ethanolH3.id, order: 1 },
  { id: makeId(), from: ethanolC2.id, to: ethanolH4.id, order: 1 },
  { id: makeId(), from: ethanolC2.id, to: ethanolH5.id, order: 1 },
];

const benzeneRadius = 1.39;
const benzeneCHBond = 1.09;
const benzeneAtoms = [];
const benzeneBonds = [];

for (let i = 0; i < 6; i++) {
  const angle = (i * Math.PI) / 3;
  const cid = makeId();
  benzeneAtoms.push({
    id: cid,
    name: `C${i + 1}`,
    element: 'C',
    position: [
      benzeneRadius * Math.cos(angle),
      benzeneRadius * Math.sin(angle),
      0,
    ] as [number, number, number],
  });
  const hid = makeId();
  benzeneAtoms.push({
    id: hid,
    name: `H${i + 1}`,
    element: 'H',
    position: [
      (benzeneRadius + benzeneCHBond) * Math.cos(angle),
      (benzeneRadius + benzeneCHBond) * Math.sin(angle),
      0,
    ] as [number, number, number],
  });
  benzeneBonds.push({
    id: makeId(),
    from: cid,
    to: hid,
    order: 1,
  });
}

for (let i = 0; i < 6; i++) {
  const next = (i + 1) % 6;
  benzeneBonds.push({
    id: makeId(),
    from: benzeneAtoms[i * 2].id,
    to: benzeneAtoms[next * 2].id,
    order: i % 2 === 0 ? 2 : 1,
  });
}

const glucoseAtomsData = [
  { element: 'C', name: 'C1', pos: [0.0, 0.0, 0.0] },
  { element: 'C', name: 'C2', pos: [1.52, 0.0, 0.0] },
  { element: 'C', name: 'C3', pos: [2.28, 1.25, 0.0] },
  { element: 'C', name: 'C4', pos: [1.52, 2.5, 0.0] },
  { element: 'C', name: 'C5', pos: [0.0, 2.5, 0.0] },
  { element: 'O', name: 'O5', pos: [-0.5, 1.25, 0.0] },
  { element: 'O', name: 'O1', pos: [-0.7, -0.7, 0.0] },
  { element: 'O', name: 'O2', pos: [2.28, -0.75, 0.0] },
  { element: 'O', name: 'O3', pos: [3.78, 1.25, 0.0] },
  { element: 'O', name: 'O4', pos: [2.0, 3.7, 0.0] },
  { element: 'O', name: 'O6', pos: [-0.7, 3.7, 0.0] },
  { element: 'C', name: 'C6', pos: [-0.2, 3.7, 0.0] },
  { element: 'H', name: 'H1', pos: [0.3, -0.4, 0.0] },
  { element: 'H', name: 'H2', pos: [1.7, 0.4, 0.0] },
  { element: 'H', name: 'H3', pos: [2.0, 1.6, 0.0] },
  { element: 'H', name: 'H4', pos: [1.2, 2.9, 0.0] },
  { element: 'H', name: 'H5', pos: [-0.2, 2.1, 0.0] },
  { element: 'H', name: 'HO1', pos: [-1.4, -0.4, 0.0] },
  { element: 'H', name: 'HO2', pos: [2.7, -1.1, 0.0] },
  { element: 'H', name: 'HO3', pos: [4.1, 1.6, 0.0] },
  { element: 'H', name: 'HO4', pos: [2.5, 4.1, 0.0] },
  { element: 'H', name: 'H6a', pos: [-0.2, 4.1, 0.0] },
  { element: 'H', name: 'H6b', pos: [0.2, 4.2, 0.0] },
  { element: 'H', name: 'HO6', pos: [-1.2, 3.9, 0.0] },
];

const glucoseAtoms = glucoseAtomsData.map((a) => ({
  id: makeId(),
  name: a.name,
  element: a.element,
  position: a.pos as [number, number, number],
}));

const glucoseBondsData: Array<[number, number, number]> = [
  [0, 1, 1],
  [1, 2, 1],
  [2, 3, 1],
  [3, 4, 1],
  [4, 5, 1],
  [0, 5, 1],
  [0, 6, 1],
  [1, 7, 1],
  [2, 8, 1],
  [3, 9, 1],
  [4, 10, 1],
  [4, 11, 1],
  [0, 12, 1],
  [1, 13, 1],
  [2, 14, 1],
  [3, 15, 1],
  [4, 16, 1],
  [6, 17, 1],
  [7, 18, 1],
  [8, 19, 1],
  [9, 20, 1],
  [11, 21, 1],
  [11, 22, 1],
  [10, 23, 1],
];

const glucoseBonds = glucoseBondsData.map(([fromIdx, toIdx, order]) => ({
  id: makeId(),
  from: glucoseAtoms[fromIdx].id,
  to: glucoseAtoms[toIdx].id,
  order,
}));

export const MOLECULE_LIBRARY: Molecule[] = [
  {
    id: 'water',
    name: '水',
    formula: 'H₂O',
    atoms: waterAtoms,
    bonds: waterBonds,
  },
  {
    id: 'carbon-dioxide',
    name: '二氧化碳',
    formula: 'CO₂',
    atoms: co2Atoms,
    bonds: co2Bonds,
  },
  {
    id: 'methane',
    name: '甲烷',
    formula: 'CH₄',
    atoms: methaneAtoms,
    bonds: methaneBonds,
  },
  {
    id: 'ethanol',
    name: '乙醇',
    formula: 'C₂H₅OH',
    atoms: ethanolAtoms,
    bonds: ethanolBonds,
  },
  {
    id: 'benzene',
    name: '苯',
    formula: 'C₆H₆',
    atoms: benzeneAtoms,
    bonds: benzeneBonds,
  },
  {
    id: 'glucose',
    name: '葡萄糖',
    formula: 'C₆H₁₂O₆',
    atoms: glucoseAtoms,
    bonds: glucoseBonds,
  },
];

export function getMoleculeById(id: string): Molecule | undefined {
  return MOLECULE_LIBRARY.find((m) => m.id === id);
}
