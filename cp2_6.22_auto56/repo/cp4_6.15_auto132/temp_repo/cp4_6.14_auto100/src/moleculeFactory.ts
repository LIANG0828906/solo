export interface AtomType {
  name: string;
  color: number;
  radius: number;
}

export interface Atom {
  type: string;
  position: [number, number, number];
}

export interface Bond {
  from: number;
  to: number;
}

export interface MoleculeData {
  atoms: Atom[];
  bonds: Bond[];
}

export const ATOM_TYPES: Record<string, AtomType> = {
  H: { name: 'hydrogen', color: 0xffffff, radius: 0.3 },
  C: { name: 'carbon', color: 0x808080, radius: 0.5 },
  O: { name: 'oxygen', color: 0xff0000, radius: 0.6 }
};

export type MoleculeName = 'water' | 'methane' | 'glucose';

function createWater(): MoleculeData {
  return {
    atoms: [
      { type: 'O', position: [0, 0, 0] },
      { type: 'H', position: [0.96, 0, 0] },
      { type: 'H', position: [-0.24, 0.93, 0] }
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 0, to: 2 }
    ]
  };
}

function createMethane(): MoleculeData {
  const d = 1.09;
  const sqrt2over3 = Math.sqrt(2) / 3;
  const sqrt8over9 = Math.sqrt(8 / 9);
  const onethird = 1 / 3;
  return {
    atoms: [
      { type: 'C', position: [0, 0, 0] },
      { type: 'H', position: [d, 0, 0] },
      { type: 'H', position: [-d / 3, d * sqrt8over9, 0] },
      { type: 'H', position: [-d / 3, -d * sqrt2over3, d * sqrt2over3] },
      { type: 'H', position: [-d / 3, -d * sqrt2over3, -d * sqrt2over3] }
    ],
    bonds: [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
      { from: 0, to: 3 },
      { from: 0, to: 4 }
    ]
  };
}

function createGlucose(): MoleculeData {
  const atoms: Atom[] = [];
  const bonds: Bond[] = [];

  const rCC = 1.54;
  const rCO = 1.43;
  const rCH = 1.09;
  const rOH = 0.96;
  const sin60 = Math.sin(Math.PI / 3);
  const cos60 = Math.cos(Math.PI / 3);
  const sin120 = Math.sin(2 * Math.PI / 3);
  const cos120 = Math.cos(2 * Math.PI / 3);

  const ringZ = 0.3;

  atoms.push({ type: 'C', position: [0, 0, 0] });
  atoms.push({ type: 'C', position: [rCC, 0, 0] });
  atoms.push({ type: 'C', position: [rCC + rCC * cos60, rCC * sin60, 0] });
  atoms.push({ type: 'C', position: [rCC, 2 * rCC * sin60, 0] });
  atoms.push({ type: 'C', position: [0, 2 * rCC * sin60, 0] });
  atoms.push({ type: 'O', position: [-rCO * cos60, rCC * sin60, 0] });
  atoms.push({ type: 'C', position: [-rCO * cos60 - rCC * cos60, rCC * sin60 + rCC * sin60, 0] });

  const idx = {
    C1: 0, C2: 1, C3: 2, C4: 3, C5: 4, O1: 5, C6: 6
  };

  bonds.push(
    { from: idx.C1, to: idx.C2 },
    { from: idx.C2, to: idx.C3 },
    { from: idx.C3, to: idx.C4 },
    { from: idx.C4, to: idx.C5 },
    { from: idx.C5, to: idx.O1 },
    { from: idx.O1, to: idx.C1 },
    { from: idx.C5, to: idx.C6 }
  );

  function addH(x: number, y: number, z: number) {
    atoms.push({ type: 'H', position: [x, y, z] });
    return atoms.length - 1;
  }

  function addO(x: number, y: number, z: number) {
    atoms.push({ type: 'O', position: [x, y, z] });
    return atoms.length - 1;
  }

  const hC1 = addH(-sin60 * rCH, -cos60 * rCH, ringZ);
  bonds.push({ from: idx.C1, to: hC1 });
  const oC1 = addO(-sin60 * rCO, -cos60 * rCO, -ringZ);
  bonds.push({ from: idx.C1, to: oC1 });
  const hoC1 = addH(oC1.position[0] - 1, oC1.position[1], -ringZ);
  bonds.push({ from: oC1, to: hoC1 });

  const hC2 = addH(rCC + sin60 * rCH, -cos60 * rCH, -ringZ);
  bonds.push({ from: idx.C2, to: hC2 });
  const oC2 = addO(rCC + sin60 * rCO, -cos60 * rCO, ringZ);
  bonds.push({ from: idx.C2, to: oC2 });
  const hoC2 = addH(oC2.position[0] + 0.5, oC2.position[1] - 0.7, ringZ);
  bonds.push({ from: oC2, to: hoC2 });

  const hC3 = addH(rCC + rCC * cos60 + cos60 * rCH, rCC * sin60 + sin60 * rCH, ringZ);
  bonds.push({ from: idx.C3, to: hC3 });
  const oC3 = addO(rCC + rCC * cos60 + cos60 * rCO, rCC * sin60 + sin60 * rCO, -ringZ);
  bonds.push({ from: idx.C3, to: oC3 });
  const hoC3 = addH(oC3.position[0] + 0.7, oC3.position[1] + 0.5, -ringZ);
  bonds.push({ from: oC3, to: hoC3 });

  const hC4 = addH(rCC + sin60 * rCH, 2 * rCC * sin60 + cos60 * rCH, -ringZ);
  bonds.push({ from: idx.C4, to: hC4 });
  const oC4 = addO(rCC + sin60 * rCO, 2 * rCC * sin60 + cos60 * rCO, ringZ);
  bonds.push({ from: idx.C4, to: oC4 });
  const hoC4 = addH(oC4.position[0] + 0.5, oC4.position[1] + 0.7, ringZ);
  bonds.push({ from: oC4, to: hoC4 });

  const hC5 = addH(-sin60 * rCH, 2 * rCC * sin60 + cos60 * rCH, ringZ);
  bonds.push({ from: idx.C5, to: hC5 });

  const hC6a = addH(idx.C6 ? atoms[idx.C6].position[0] - rCH : 0,
                     (atoms[idx.C6]?.position[1] ?? 0) + rCH * 0.5,
                     -ringZ);
  bonds.push({ from: idx.C6, to: hC6a });
  const hC6b = addH((atoms[idx.C6]?.position[0] ?? 0) - rCH * 0.5,
                     (atoms[idx.C6]?.position[1] ?? 0) + rCH,
                     ringZ);
  bonds.push({ from: idx.C6, to: hC6b });
  const oC6 = addO((atoms[idx.C6]?.position[0] ?? 0) + rCO * 0.5,
                    (atoms[idx.C6]?.position[1] ?? 0) + rCO * 0.8,
                    -ringZ * 0.5);
  bonds.push({ from: idx.C6, to: oC6 });
  const hoC6 = addH(oC6.position[0] + 0.7, oC6.position[1] + 0.5, -ringZ * 0.5);
  bonds.push({ from: oC6, to: hoC6 });

  return { atoms, bonds };
}

const factories: Record<MoleculeName, () => MoleculeData> = {
  water: createWater,
  methane: createMethane,
  glucose: createGlucose
};

export function createMolecule(name: MoleculeName): MoleculeData {
  const factory = factories[name];
  if (!factory) {
    throw new Error(`Unknown molecule: ${name}`);
  }
  return factory();
}

export function getAtomType(type: string): AtomType {
  return ATOM_TYPES[type] ?? ATOM_TYPES.C;
}

export function colorToHex(color: number): string {
  return '#' + color.toString(16).padStart(6, '0').toUpperCase();
}
