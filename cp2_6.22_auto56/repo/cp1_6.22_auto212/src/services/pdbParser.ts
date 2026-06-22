import type { AminoAcid, Atom, PDBData, SecondaryStructure } from '@/types'

const AMINO_ACIDS: Record<string, { name: string; threeLetterCode: string; oneLetterCode: string }> = {
  ALA: { name: '丙氨酸', threeLetterCode: 'ALA', oneLetterCode: 'A' },
  ARG: { name: '精氨酸', threeLetterCode: 'ARG', oneLetterCode: 'R' },
  ASN: { name: '天冬酰胺', threeLetterCode: 'ASN', oneLetterCode: 'N' },
  ASP: { name: '天冬氨酸', threeLetterCode: 'ASP', oneLetterCode: 'D' },
  CYS: { name: '半胱氨酸', threeLetterCode: 'CYS', oneLetterCode: 'C' },
  GLN: { name: '谷氨酰胺', threeLetterCode: 'GLN', oneLetterCode: 'Q' },
  GLU: { name: '谷氨酸', threeLetterCode: 'GLU', oneLetterCode: 'E' },
  GLY: { name: '甘氨酸', threeLetterCode: 'GLY', oneLetterCode: 'G' },
  HIS: { name: '组氨酸', threeLetterCode: 'HIS', oneLetterCode: 'H' },
  ILE: { name: '异亮氨酸', threeLetterCode: 'ILE', oneLetterCode: 'I' },
  LEU: { name: '亮氨酸', threeLetterCode: 'LEU', oneLetterCode: 'L' },
  LYS: { name: '赖氨酸', threeLetterCode: 'LYS', oneLetterCode: 'K' },
  MET: { name: '甲硫氨酸', threeLetterCode: 'MET', oneLetterCode: 'M' },
  PHE: { name: '苯丙氨酸', threeLetterCode: 'PHE', oneLetterCode: 'F' },
  PRO: { name: '脯氨酸', threeLetterCode: 'PRO', oneLetterCode: 'P' },
  SER: { name: '丝氨酸', threeLetterCode: 'SER', oneLetterCode: 'S' },
  THR: { name: '苏氨酸', threeLetterCode: 'THR', oneLetterCode: 'T' },
  TRP: { name: '色氨酸', threeLetterCode: 'TRP', oneLetterCode: 'W' },
  TYR: { name: '酪氨酸', threeLetterCode: 'TYR', oneLetterCode: 'Y' },
  VAL: { name: '缬氨酸', threeLetterCode: 'VAL', oneLetterCode: 'V' },
}

const RESIDUE_CODES = Object.keys(AMINO_ACIDS)

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

function generateSecondaryStructure(index: number, total: number, seed: number): SecondaryStructure {
  const rand = seededRandom(seed + index * 7)()
  const pos = index / total
  if (pos < 0.3) return rand > 0.3 ? 'helix' : 'coil'
  if (pos < 0.5) return rand > 0.4 ? 'sheet' : 'coil'
  if (pos < 0.7) return rand > 0.35 ? 'helix' : 'coil'
  return rand > 0.5 ? 'sheet' : 'coil'
}

function generateProteinData(pdbId: string, name: string, residueCount: number, seed: number): PDBData {
  const random = seededRandom(seed)
  const residues: AminoAcid[] = []
  const allAtoms: Atom[] = []
  const positions: { x: number; y: number; z: number }[] = []

  let x = 0, y = 0, z = 0
  for (let i = 0; i < residueCount; i++) {
    const codeIdx = Math.floor(random() * RESIDUE_CODES.length)
    const code = RESIDUE_CODES[codeIdx]
    const aaInfo = AMINO_ACIDS[code]
    const ss = generateSecondaryStructure(i, residueCount, seed)

    const helixAngle = ss === 'helix' ? 1.5 : ss === 'sheet' ? 0.3 : 2.0 + random()
    const rise = ss === 'helix' ? 1.5 : ss === 'sheet' ? 3.2 : 1.5 + random()

    if (ss === 'helix') {
      x += Math.cos(i * helixAngle) * 1.8
      y += rise
      z += Math.sin(i * helixAngle) * 1.8
    } else if (ss === 'sheet') {
      x += 3.5
      y = Math.sin(i * 0.5) * 2
      z = (i % 2 === 0 ? 1 : -1) * 2
    } else {
      x += (random() - 0.5) * 3
      y += rise * (random() + 0.5)
      z += (random() - 0.5) * 3
    }

    positions.push({ x, y, z })

    const caAtom: Atom = {
      name: 'CA',
      element: 'C',
      position: { x, y, z },
      residueId: i,
      isSideChain: false,
    }

    const nAtom: Atom = {
      name: 'N',
      element: 'N',
      position: { x: x - 0.8, y: y + 0.5, z: z },
      residueId: i,
      isSideChain: false,
    }

    const cAtom: Atom = {
      name: 'C',
      element: 'C',
      position: { x: x + 0.8, y: y - 0.3, z: z },
      residueId: i,
      isSideChain: false,
    }

    const oAtom: Atom = {
      name: 'O',
      element: 'O',
      position: { x: x + 1.2, y: y - 0.3, z: z + 1.0 },
      residueId: i,
      isSideChain: false,
    }

    const sideChainAtoms: Atom[] = []
    const sideChainCount = Math.min(3, Math.floor(random() * 3) + 1)
    for (let j = 0; j < sideChainCount; j++) {
      sideChainAtoms.push({
        name: `SC${j}`,
        element: random() > 0.5 ? 'C' : 'N',
        position: {
          x: x + (random() - 0.5) * 3,
          y: y + 1.5 + j * 1.2,
          z: z + (random() - 0.5) * 3,
        },
        residueId: i,
        isSideChain: true,
      })
    }

    const residueAtoms = [nAtom, caAtom, cAtom, oAtom, ...sideChainAtoms]
    residueAtoms.forEach((a) => allAtoms.push(a))

    residues.push({
      id: i,
      name: aaInfo.name,
      threeLetterCode: aaInfo.threeLetterCode,
      oneLetterCode: aaInfo.oneLetterCode,
      secondaryStructure: ss,
      atoms: residueAtoms,
      position: { x, y, z },
      caAtom,
    })
  }

  const allPositions = allAtoms.map((a) => a.position)
  const minX = Math.min(...allPositions.map((p) => p.x))
  const maxX = Math.max(...allPositions.map((p) => p.x))
  const minY = Math.min(...allPositions.map((p) => p.y))
  const maxY = Math.max(...allPositions.map((p) => p.y))
  const minZ = Math.min(...allPositions.map((p) => p.z))
  const maxZ = Math.max(...allPositions.map((p) => p.z))

  return {
    id: pdbId,
    name,
    sequence: residues,
    atoms: allAtoms,
    boundingBox: {
      min: { x: minX, y: minY, z: minZ },
      max: { x: maxX, y: maxY, z: maxZ },
      center: {
        x: (minX + maxX) / 2,
        y: (minY + maxY) / 2,
        z: (minZ + maxZ) / 2,
      },
    },
  }
}

const PDB_DATABASE: Record<string, PDBData> = {
  '1BRS': generateProteinData('1BRS', 'Barnase (核糖核酸酶)', 110, 1001),
  '4HHB': generateProteinData('4HHB', '血红蛋白 Hemoglobin', 141, 2002),
  '1CRN': generateProteinData('1CRN', 'Crambin (植物种子蛋白)', 46, 3003),
}

export function getAvailablePdbIds(): string[] {
  return Object.keys(PDB_DATABASE)
}

export function parsePdb(pdbId: string): PDBData {
  const data = PDB_DATABASE[pdbId]
  if (!data) {
    throw new Error(`PDB ID ${pdbId} not found`)
  }
  return data
}

export function getResidueColor(ss: SecondaryStructure): string {
  switch (ss) {
    case 'helix':
      return '#FF6B6B'
    case 'sheet':
      return '#4ECDC4'
    case 'coil':
      return '#95A5A6'
  }
}
