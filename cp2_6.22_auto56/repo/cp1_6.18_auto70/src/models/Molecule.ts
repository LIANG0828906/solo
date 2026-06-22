export interface Atom {
  id: string
  symbol: string
  type: string
  x: number
  y: number
  z: number
  radius: number
  color: string
}

export interface Bond {
  id: string
  atomAId: string
  atomBId: string
  bondType: 'single' | 'double' | 'triple'
  length: number
  angle: number
}

export interface Molecule {
  id: string
  name: string
  description: string
  atoms: Atom[]
  bonds: Bond[]
  icon: string
}

const ELEMENT_COLORS: Record<string, string> = {
  C: '#606060',
  H: '#CCCCCC',
  O: '#FF4444',
  N: '#4488FF',
  P: '#FF8800',
  S: '#FFFF44',
}

const ELEMENT_RADII: Record<string, number> = {
  C: 0.4,
  H: 0.25,
  O: 0.35,
  N: 0.35,
  P: 0.4,
  S: 0.4,
}

function makeAtom(id: string, symbol: string, type: string, x: number, y: number, z: number): Atom {
  return {
    id,
    symbol,
    type,
    x, y, z,
    radius: ELEMENT_RADII[symbol] || 0.3,
    color: ELEMENT_COLORS[symbol] || '#AAAAAA',
  }
}

function dist(a: Atom, b: Atom): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2)
}

function bondAngle(atoms: Atom[], aIdx: number, bIdx: number, cIdx: number): number {
  const ba = { x: atoms[aIdx].x - atoms[bIdx].x, y: atoms[aIdx].y - atoms[bIdx].y, z: atoms[aIdx].z - atoms[bIdx].z }
  const bc = { x: atoms[cIdx].x - atoms[bIdx].x, y: atoms[cIdx].y - atoms[bIdx].y, z: atoms[cIdx].z - atoms[bIdx].z }
  const dot = ba.x * bc.x + ba.y * bc.y + ba.z * bc.z
  const magBA = Math.sqrt(ba.x ** 2 + ba.y ** 2 + ba.z ** 2)
  const magBC = Math.sqrt(bc.x ** 2 + bc.y ** 2 + bc.z ** 2)
  if (magBA === 0 || magBC === 0) return 0
  return Math.acos(Math.min(1, Math.max(-1, dot / (magBA * magBC)))) * (180 / Math.PI)
}

function generateBonds(atoms: Atom[], bondLengthMax: number = 1.8): Bond[] {
  const bonds: Bond[] = []
  let bondId = 0
  for (let i = 0; i < atoms.length; i++) {
    for (let j = i + 1; j < atoms.length; j++) {
      const d = dist(atoms[i], atoms[j])
      if (d > 0.1 && d < bondLengthMax) {
        const angle = i > 0 ? bondAngle(atoms, i - 1, i, j) : 0
        bonds.push({
          id: `bond_${bondId++}`,
          atomAId: atoms[i].id,
          atomBId: atoms[j].id,
          bondType: 'single',
          length: parseFloat(d.toFixed(3)),
          angle: parseFloat(angle.toFixed(1)),
        })
      }
    }
  }
  return bonds
}

function generateDNA(): Molecule {
  const atoms: Atom[] = []
  const helixRadius = 1.0
  const pitch = 3.4
  const turns = 2.5
  const basePairsPerTurn = 10
  const totalBasePairs = Math.floor(turns * basePairsPerTurn)
  const centerY = (turns * pitch) / 2
  let atomId = 0

  for (let i = 0; i < totalBasePairs; i++) {
    const t = i / basePairsPerTurn
    const angle = t * Math.PI * 2
    const y = t * pitch - centerY

    const x1 = helixRadius * Math.cos(angle)
    const z1 = helixRadius * Math.sin(angle)
    atoms.push(makeAtom(`a${atomId++}`, 'P', 'phosphate', x1, y, z1))

    const x2 = helixRadius * Math.cos(angle + Math.PI)
    const z2 = helixRadius * Math.sin(angle + Math.PI)
    atoms.push(makeAtom(`a${atomId++}`, 'P', 'phosphate', x2, y, z2))

    const sugarOff = 0.3
    atoms.push(makeAtom(`a${atomId++}`, 'C', 'sugar', x1 + sugarOff * Math.cos(angle + 0.5), y + 0.3, z1 + sugarOff * Math.sin(angle + 0.5)))
    atoms.push(makeAtom(`a${atomId++}`, 'C', 'sugar', x2 + sugarOff * Math.cos(angle + Math.PI + 0.5), y + 0.3, z2 + sugarOff * Math.sin(angle + Math.PI + 0.5)))

    const isAT = i % 2 === 0
    const baseColor1 = isAT ? 'N' : 'O'
    const baseColor2 = isAT ? 'O' : 'N'
    const baseType1 = isAT ? 'adenine' : 'guanine'
    const baseType2 = isAT ? 'thymine' : 'cytosine'

    const steps = 3
    for (let s = 1; s <= steps; s++) {
      const frac = s / (steps + 1)
      const bx = x1 + (x2 - x1) * frac
      const bz = z1 + (z2 - z1) * frac
      const sym = s <= steps / 2 ? baseColor1 : baseColor2
      const btype = s <= steps / 2 ? baseType1 : baseType2
      atoms.push(makeAtom(`a${atomId++}`, sym, btype, bx, y + (s - 1) * 0.1, bz))
    }
  }

  const bonds = generateBonds(atoms, 1.5)
  return { id: 'dna', name: 'DNA双螺旋', description: '脱氧核糖核酸双螺旋结构，承载遗传信息', atoms, bonds, icon: '🧬' }
}

function generateInsulin(): Molecule {
  const atoms: Atom[] = []
  let atomId = 0

  const chainLengths = [21, 30]
  const chainOffsets = [-1.5, 1.0]

  for (let c = 0; c < chainLengths.length; c++) {
    const len = chainLengths[c]
    const xOff = chainOffsets[c]
    for (let i = 0; i < len; i++) {
      const t = i / len
      const y = (t - 0.5) * 6
      const helixAngle = t * Math.PI * 6
      const helixR = 0.8

      if (i % 3 === 0) {
        atoms.push(makeAtom(`a${atomId++}`, 'N', 'amino-N', xOff + helixR * Math.cos(helixAngle), y, helixR * Math.sin(helixAngle)))
      }
      atoms.push(makeAtom(`a${atomId++}`, 'C', 'alpha-C', xOff + helixR * Math.cos(helixAngle + 0.5), y + 0.15, helixR * Math.sin(helixAngle + 0.5)))
      if (i % 3 === 1) {
        atoms.push(makeAtom(`a${atomId++}`, 'O', 'carbonyl-O', xOff + helixR * 1.3 * Math.cos(helixAngle + 1.0), y + 0.05, helixR * 1.3 * Math.sin(helixAngle + 1.0)))
      }
      if (i % 4 === 0) {
        const sideSymbols = ['C', 'S', 'C', 'O']
        const sideR = 0.6
        atoms.push(makeAtom(`a${atomId++}`, sideSymbols[i % 4], 'sidechain', xOff + (helixR + sideR) * Math.cos(helixAngle), y, (helixR + sideR) * Math.sin(helixAngle)))
      }
    }
  }

  for (let i = 0; i < 3; i++) {
    const y1 = -1.5 + i * 1.5
    const y2 = y1 + 0.5
    atoms.push(makeAtom(`a${atomId++}`, 'S', 'disulfide', chainOffsets[0] + 0.9, y1, 0.5))
    atoms.push(makeAtom(`a${atomId++}`, 'S', 'disulfide', chainOffsets[1] - 0.9, y2, 0.5))
  }

  const bonds = generateBonds(atoms, 1.4)
  return { id: 'insulin', name: '胰岛素', description: '由51个氨基酸组成的蛋白质激素，调节血糖水平', atoms, bonds, icon: '💉' }
}

function generateWater(): Molecule {
  const atoms: Atom[] = []
  const bondLen = 0.96
  const halfAngle = (104.5 / 2) * (Math.PI / 180)

  atoms.push(makeAtom('a0', 'O', 'oxygen', 0, 0, 0))
  atoms.push(makeAtom('a1', 'H', 'hydrogen', bondLen * Math.sin(halfAngle), bondLen * Math.cos(halfAngle), 0))
  atoms.push(makeAtom('a2', 'H', 'hydrogen', -bondLen * Math.sin(halfAngle), bondLen * Math.cos(halfAngle), 0))

  const bonds = generateBonds(atoms, 1.5)
  return { id: 'water', name: '水分子', description: 'H₂O，生命之源，V型分子结构，键角104.5°', atoms, bonds, icon: '💧' }
}

function generateCaffeine(): Molecule {
  const atoms: Atom[] = []
  const s = 0.75
  const positions: [string, string, number, number, number][] = [
    ['N', 'ring-N', 0, 0, 0],
    ['C', 'ring-C', s * 1.2, 0, 0],
    ['N', 'ring-N', s * 1.8, s * 1.0, 0],
    ['C', 'ring-C', s * 1.2, s * 2.0, 0],
    ['C', 'ring-C', 0, s * 2.0, 0],
    ['C', 'ring-C', -s * 0.7, s * 1.0, 0],
    ['N', 'ring-N', -s * 1.5, s * 1.5, 0],
    ['C', 'ring-C', -s * 1.5, s * 2.5, 0],
    ['N', 'ring-N', -s * 0.7, s * 3.0, 0],
    ['C', 'ring-C', 0, s * 2.5, 0.2],
    ['O', 'carbonyl-O', s * 2.3, -s * 0.5, 0],
    ['O', 'carbonyl-O', -s * 2.5, s * 2.7, 0],
    ['C', 'methyl-C', s * 2.8, s * 1.0, 0],
    ['C', 'methyl-C', -s * 2.5, s * 0.5, 0],
    ['C', 'methyl-C', -s * 0.7, s * 4.2, 0],
    ['H', 'methyl-H', s * 3.3, s * 0.3, 0.3],
    ['H', 'methyl-H', s * 3.3, s * 1.7, -0.3],
    ['H', 'methyl-H', s * 2.8, s * 0.3, -0.8],
    ['H', 'methyl-H', -s * 3.0, s * 1.1, 0.3],
    ['H', 'methyl-H', -s * 3.0, -s * 0.1, -0.3],
    ['H', 'methyl-H', -s * 2.5, s * 0.5, -0.8],
    ['H', 'methyl-H', -s * 1.3, s * 4.5, 0.3],
    ['H', 'methyl-H', -s * 0.2, s * 4.5, -0.3],
    ['H', 'methyl-H', -s * 0.7, s * 4.2, -0.8],
  ]

  positions.forEach(([symbol, type, x, y, z], i) => {
    atoms.push(makeAtom(`a${i}`, symbol, type, x - s * 0.5, y - s * 1.5, z))
  })

  const bonds = generateBonds(atoms, 1.5)
  return { id: 'caffeine', name: '咖啡因', description: 'C₈H₁₀N₄O₂，中枢神经兴奋剂，嘌呤类生物碱', atoms, bonds, icon: '☕' }
}

function generateEthanol(): Molecule {
  const atoms: Atom[] = []
  const s = 0.9

  atoms.push(makeAtom('a0', 'C', 'methyl-C', 0, 0, 0))
  atoms.push(makeAtom('a1', 'C', 'methylene-C', s * 1.5, 0, 0))
  atoms.push(makeAtom('a2', 'O', 'hydroxyl-O', s * 2.7, s * 0.5, 0))
  atoms.push(makeAtom('a3', 'H', 'hydroxyl-H', s * 3.4, s * 0.0, s * 0.5))
  atoms.push(makeAtom('a4', 'H', 'methyl-H', -s * 0.5, s * 0.9, s * 0.3))
  atoms.push(makeAtom('a5', 'H', 'methyl-H', -s * 0.5, -s * 0.9, s * 0.3))
  atoms.push(makeAtom('a6', 'H', 'methyl-H', -s * 0.5, 0, -s * 0.9))
  atoms.push(makeAtom('a7', 'H', 'methylene-H', s * 1.5, s * 0.9, -s * 0.5))
  atoms.push(makeAtom('a8', 'H', 'methylene-H', s * 1.5, -s * 0.9, -s * 0.5))

  const bonds = generateBonds(atoms, 1.5)
  return { id: 'ethanol', name: '乙醇', description: 'C₂H₅OH，常见醇类有机化合物，酒类主要成分', atoms, bonds, icon: '🍺' }
}

export const MOLECULE_PRESETS: Molecule[] = [
  generateDNA(),
  generateInsulin(),
  generateWater(),
  generateCaffeine(),
  generateEthanol(),
]

export function getMoleculeById(id: string): Molecule | undefined {
  return MOLECULE_PRESETS.find(m => m.id === id)
}
