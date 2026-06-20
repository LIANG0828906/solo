import type { Atom, Bond, MoleculeData } from './store'
import { getAtomicWeight } from './store'

const workerCode = `
  self.onmessage = function(e) {
    const { fileContent, fileName } = e.data
    try {
      const extension = fileName.split('.').pop()?.toLowerCase()
      let result
      if (extension === 'pdb') {
        result = parsePDB(fileContent)
      } else if (extension === 'sdf') {
        result = parseSDF(fileContent)
      } else {
        throw new Error('不支持的文件格式，请上传 .pdb 或 .sdf 文件')
      }
      self.postMessage({ success: true, data: result })
    } catch (error) {
      self.postMessage({ success: false, error: error.message })
    }
  }

  function parsePDB(content) {
    const atoms = []
    const bonds = []
    const lines = content.split('\\n')
    let atomId = 1
    let bondId = 1

    for (const line of lines) {
      if (line.startsWith('ATOM') || line.startsWith('HETATM')) {
        const element = line.slice(76, 78).trim() || line.slice(12, 14).trim()
        const x = parseFloat(line.slice(30, 38))
        const y = parseFloat(line.slice(38, 46))
        const z = parseFloat(line.slice(46, 54))
        const charge = parseInt(line.slice(78, 80).trim()) || 0
        atoms.push({ id: atomId++, element, x, y, z, charge })
      }
      if (line.startsWith('CONECT')) {
        const parts = line.slice(6).trim().split(/\\s+/).map(Number)
        const atom1 = parts[0]
        for (let i = 1; i < parts.length; i++) {
          const atom2 = parts[i]
          if (atom1 < atom2) {
            bonds.push({ id: bondId++, atom1Id: atom1, atom2Id: atom2, type: 'single' })
          }
        }
      }
    }

    if (bonds.length === 0) {
      const threshold = 1.8
      for (let i = 0; i < atoms.length; i++) {
        for (let j = i + 1; j < atoms.length; j++) {
          const dx = atoms[i].x - atoms[j].x
          const dy = atoms[i].y - atoms[j].y
          const dz = atoms[i].z - atoms[j].z
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
          if (dist < threshold) {
            bonds.push({ id: bondId++, atom1Id: atoms[i].id, atom2Id: atoms[j].id, type: 'single' })
          }
        }
      }
    }

    return computeDerivedData(atoms, bonds)
  }

  function parseSDF(content) {
    const lines = content.split('\\n')
    const atoms = []
    const bonds = []
    let currentLine = 0

    while (currentLine < lines.length && !lines[currentLine].includes('V2000')) {
      currentLine++
    }
    currentLine++

    if (currentLine < lines.length) {
      const counts = lines[currentLine - 1].trim().split(/\\s+/)
      const atomCount = parseInt(counts[0]) || 0
      const bondCount = parseInt(counts[1]) || 0

      for (let i = 0; i < atomCount && currentLine < lines.length; i++) {
        const parts = lines[currentLine++].trim().split(/\\s+/)
        atoms.push({
          id: i + 1,
          element: parts[3],
          x: parseFloat(parts[0]),
          y: parseFloat(parts[1]),
          z: parseFloat(parts[2]),
          charge: 0
        })
      }

      for (let i = 0; i < bondCount && currentLine < lines.length; i++) {
        const parts = lines[currentLine++].trim().split(/\\s+/)
        const atom1 = parseInt(parts[0])
        const atom2 = parseInt(parts[1])
        const type = parseInt(parts[2])
        const bondType = type === 2 ? 'double' : type === 3 ? 'triple' : 'single'
        bonds.push({ id: i + 1, atom1Id: atom1, atom2Id: atom2, type: bondType })
      }
    }

    return computeDerivedData(atoms, bonds)
  }

  function computeDerivedData(atoms, bonds) {
    const elementCounts = {}
    let molecularWeight = 0
    let totalCharge = 0

    for (const atom of atoms) {
      elementCounts[atom.element] = (elementCounts[atom.element] || 0) + 1
      molecularWeight += getAtomicWeight(atom.element)
      totalCharge += atom.charge
    }

    const sortedElements = Object.keys(elementCounts).sort((a, b) => {
      if (a === 'C') return -1
      if (b === 'C') return 1
      if (a === 'H') return -1
      if (b === 'H') return 1
      return a.localeCompare(b)
    })

    let formula = ''
    for (const el of sortedElements) {
      formula += el + (elementCounts[el] > 1 ? elementCounts[el] : '')
    }

    return { atoms, bonds, formula, molecularWeight, totalCharge }
  }

  function getAtomicWeight(element) {
    const weights = {
      H: 1.008, C: 12.011, N: 14.007, O: 15.999, S: 32.06,
      P: 30.974, F: 18.998, Cl: 35.45, Br: 79.904, I: 126.904,
      Fe: 55.845, Ca: 40.078, Na: 22.990, K: 39.098, Mg: 24.305,
      Zn: 65.38, Cu: 63.546, Li: 6.941, Si: 28.086, Se: 78.96,
    }
    return weights[element] || 0
  }
`

function createWorker(): Worker {
  const blob = new Blob([workerCode], { type: 'application/javascript' })
  const url = URL.createObjectURL(blob)
  return new Worker(url)
}

export interface SampleMolecule {
  name: string
  data: MoleculeData
}

export const SAMPLE_MOLECULES: SampleMolecule[] = [
  {
    name: '咖啡因 (Caffeine)',
    data: computeSampleData('caffeine'),
  },
  {
    name: '乙醇 (Ethanol)',
    data: computeSampleData('ethanol'),
  },
  {
    name: '苯 (Benzene)',
    data: computeSampleData('benzene'),
  },
  {
    name: '水分子 (Water)',
    data: computeSampleData('water'),
  },
  {
    name: '腺嘌呤 (Adenine)',
    data: computeSampleData('adenine'),
  },
]

function computeSampleData(type: string): MoleculeData {
  let atoms: Atom[] = []
  let bonds: Bond[] = []

  switch (type) {
    case 'water':
      atoms = [
        { id: 1, element: 'O', x: 0, y: 0, z: 0, charge: 0 },
        { id: 2, element: 'H', x: 0.957, y: 0, z: 0, charge: 0 },
        { id: 3, element: 'H', x: -0.239, y: 0.927, z: 0, charge: 0 },
      ]
      bonds = [
        { id: 1, atom1Id: 1, atom2Id: 2, type: 'single' },
        { id: 2, atom1Id: 1, atom2Id: 3, type: 'single' },
      ]
      break
    case 'ethanol':
      atoms = [
        { id: 1, element: 'C', x: -0.765, y: -0.030, z: 0.000, charge: 0 },
        { id: 2, element: 'C', x: 0.765, y: 0.030, z: 0.000, charge: 0 },
        { id: 3, element: 'O', x: 1.390, y: 1.200, z: 0.000, charge: 0 },
        { id: 4, element: 'H', x: -1.160, y: -0.580, z: 0.880, charge: 0 },
        { id: 5, element: 'H', x: -1.160, y: -0.580, z: -0.880, charge: 0 },
        { id: 6, element: 'H', x: -1.180, y: 0.990, z: 0.000, charge: 0 },
        { id: 7, element: 'H', x: 1.170, y: -0.510, z: 0.890, charge: 0 },
        { id: 8, element: 'H', x: 1.170, y: -0.510, z: -0.890, charge: 0 },
        { id: 9, element: 'H', x: 2.350, y: 1.180, z: 0.000, charge: 0 },
      ]
      bonds = [
        { id: 1, atom1Id: 1, atom2Id: 2, type: 'single' },
        { id: 2, atom1Id: 2, atom2Id: 3, type: 'single' },
        { id: 3, atom1Id: 1, atom2Id: 4, type: 'single' },
        { id: 4, atom1Id: 1, atom2Id: 5, type: 'single' },
        { id: 5, atom1Id: 1, atom2Id: 6, type: 'single' },
        { id: 6, atom1Id: 2, atom2Id: 7, type: 'single' },
        { id: 7, atom1Id: 2, atom2Id: 8, type: 'single' },
        { id: 8, atom1Id: 3, atom2Id: 9, type: 'single' },
      ]
      break
    case 'benzene':
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3
        atoms.push({
          id: i + 1,
          element: 'C',
          x: 1.4 * Math.cos(angle),
          y: 1.4 * Math.sin(angle),
          z: 0,
          charge: 0,
        })
      }
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3
        atoms.push({
          id: i + 7,
          element: 'H',
          x: 2.48 * Math.cos(angle),
          y: 2.48 * Math.sin(angle),
          z: 0,
          charge: 0,
        })
      }
      for (let i = 0; i < 6; i++) {
        bonds.push({
          id: i + 1,
          atom1Id: i + 1,
          atom2Id: ((i + 1) % 6) + 1,
          type: i % 2 === 0 ? 'double' : 'single',
        })
      }
      for (let i = 0; i < 6; i++) {
        bonds.push({
          id: i + 7,
          atom1Id: i + 1,
          atom2Id: i + 7,
          type: 'single',
        })
      }
      break
    case 'caffeine':
      atoms = [
        { id: 1, element: 'N', x: -1.210, y: -0.670, z: 0.000, charge: 0 },
        { id: 2, element: 'C', x: -0.080, y: -1.210, z: 0.000, charge: 0 },
        { id: 3, element: 'N', x: 1.030, y: -0.540, z: 0.000, charge: 0 },
        { id: 4, element: 'C', x: 0.690, y: 0.780, z: 0.000, charge: 0 },
        { id: 5, element: 'C', x: -0.650, y: 0.690, z: 0.000, charge: 0 },
        { id: 6, element: 'C', x: -1.790, y: 0.240, z: 0.000, charge: 0 },
        { id: 7, element: 'O', x: -2.850, y: 0.870, z: 0.000, charge: 0 },
        { id: 8, element: 'N', x: -1.570, y: 1.650, z: 0.000, charge: 0 },
        { id: 9, element: 'C', x: -0.360, y: 1.950, z: 0.000, charge: 0 },
        { id: 10, element: 'O', x: 1.750, y: 1.440, z: 0.000, charge: 0 },
        { id: 11, element: 'N', x: 2.350, y: -1.140, z: 0.000, charge: 0 },
        { id: 12, element: 'C', x: 2.140, y: -2.560, z: 0.000, charge: 0 },
        { id: 13, element: 'C', x: -2.630, y: -1.060, z: 0.000, charge: 0 },
        { id: 14, element: 'C', x: 0.030, y: -2.740, z: 0.000, charge: 0 },
        { id: 15, element: 'H', x: -2.580, y: -2.130, z: 0.000, charge: 0 },
        { id: 16, element: 'H', x: -3.280, y: -0.510, z: 0.860, charge: 0 },
        { id: 17, element: 'H', x: -3.280, y: -0.510, z: -0.860, charge: 0 },
        { id: 18, element: 'H', x: -0.940, y: -3.120, z: 0.000, charge: 0 },
        { id: 19, element: 'H', x: 0.550, y: -3.080, z: 0.890, charge: 0 },
        { id: 20, element: 'H', x: 0.550, y: -3.080, z: -0.890, charge: 0 },
        { id: 21, element: 'H', x: 3.060, y: -0.610, z: 0.000, charge: 0 },
        { id: 22, element: 'H', x: 3.140, y: -2.990, z: 0.000, charge: 0 },
        { id: 23, element: 'H', x: 1.580, y: -3.020, z: 0.860, charge: 0 },
        { id: 24, element: 'H', x: 1.580, y: -3.020, z: -0.860, charge: 0 },
      ]
      bonds = [
        { id: 1, atom1Id: 1, atom2Id: 2, type: 'single' },
        { id: 2, atom1Id: 2, atom2Id: 3, type: 'single' },
        { id: 3, atom1Id: 3, atom2Id: 4, type: 'single' },
        { id: 4, atom1Id: 4, atom2Id: 5, type: 'double' },
        { id: 5, atom1Id: 5, atom2Id: 1, type: 'single' },
        { id: 6, atom1Id: 1, atom2Id: 6, type: 'single' },
        { id: 7, atom1Id: 6, atom2Id: 7, type: 'double' },
        { id: 8, atom1Id: 6, atom2Id: 8, type: 'single' },
        { id: 9, atom1Id: 8, atom2Id: 9, type: 'single' },
        { id: 10, atom1Id: 9, atom2Id: 4, type: 'single' },
        { id: 11, atom1Id: 4, atom2Id: 10, type: 'double' },
        { id: 12, atom1Id: 3, atom2Id: 11, type: 'single' },
        { id: 13, atom1Id: 11, atom2Id: 12, type: 'single' },
        { id: 14, atom1Id: 1, atom2Id: 13, type: 'single' },
        { id: 15, atom1Id: 2, atom2Id: 14, type: 'single' },
        { id: 16, atom1Id: 13, atom2Id: 15, type: 'single' },
        { id: 17, atom1Id: 13, atom2Id: 16, type: 'single' },
        { id: 18, atom1Id: 13, atom2Id: 17, type: 'single' },
        { id: 19, atom1Id: 14, atom2Id: 18, type: 'single' },
        { id: 20, atom1Id: 14, atom2Id: 19, type: 'single' },
        { id: 21, atom1Id: 14, atom2Id: 20, type: 'single' },
        { id: 22, atom1Id: 11, atom2Id: 21, type: 'single' },
        { id: 23, atom1Id: 12, atom2Id: 22, type: 'single' },
        { id: 24, atom1Id: 12, atom2Id: 23, type: 'single' },
        { id: 25, atom1Id: 12, atom2Id: 24, type: 'single' },
      ]
      break
    case 'adenine':
      atoms = [
        { id: 1, element: 'N', x: -2.470, y: 0.000, z: 0.000, charge: 0 },
        { id: 2, element: 'C', x: -1.250, y: -0.740, z: 0.000, charge: 0 },
        { id: 3, element: 'C', x: -0.000, y: -0.020, z: 0.000, charge: 0 },
        { id: 4, element: 'N', x: 1.170, y: -0.640, z: 0.000, charge: 0 },
        { id: 5, element: 'C', x: 2.290, y: 0.160, z: 0.000, charge: 0 },
        { id: 6, element: 'N', x: 1.950, y: 1.410, z: 0.000, charge: 0 },
        { id: 7, element: 'C', x: 0.690, y: 1.390, z: 0.000, charge: 0 },
        { id: 8, element: 'N', x: -0.190, y: 2.450, z: 0.000, charge: 0 },
        { id: 9, element: 'N', x: -1.130, y: 0.650, z: 0.000, charge: 0 },
        { id: 10, element: 'C', x: -3.690, y: 0.390, z: 0.000, charge: 0 },
        { id: 11, element: 'H', x: -1.270, y: -1.820, z: 0.000, charge: 0 },
        { id: 12, element: 'H', x: 3.280, y: -0.290, z: 0.000, charge: 0 },
        { id: 13, element: 'H', x: 2.730, y: 2.230, z: 0.000, charge: 0 },
        { id: 14, element: 'H', x: -0.740, y: 3.350, z: 0.000, charge: 0 },
        { id: 15, element: 'H', x: -3.930, y: 1.380, z: 0.000, charge: 0 },
        { id: 16, element: 'H', x: -4.390, y: -0.380, z: 0.660, charge: 0 },
        { id: 17, element: 'H', x: -4.390, y: -0.380, z: -0.660, charge: 0 },
      ]
      bonds = [
        { id: 1, atom1Id: 1, atom2Id: 2, type: 'single' },
        { id: 2, atom1Id: 2, atom2Id: 3, type: 'double' },
        { id: 3, atom1Id: 3, atom2Id: 4, type: 'single' },
        { id: 4, atom1Id: 4, atom2Id: 5, type: 'double' },
        { id: 5, atom1Id: 5, atom2Id: 6, type: 'single' },
        { id: 6, atom1Id: 6, atom2Id: 7, type: 'single' },
        { id: 7, atom1Id: 7, atom2Id: 3, type: 'single' },
        { id: 8, atom1Id: 7, atom2Id: 8, type: 'double' },
        { id: 9, atom1Id: 2, atom2Id: 9, type: 'single' },
        { id: 10, atom1Id: 9, atom2Id: 1, type: 'double' },
        { id: 11, atom1Id: 9, atom2Id: 7, type: 'single' },
        { id: 12, atom1Id: 1, atom2Id: 10, type: 'single' },
        { id: 13, atom1Id: 2, atom2Id: 11, type: 'single' },
        { id: 14, atom1Id: 5, atom2Id: 12, type: 'single' },
        { id: 15, atom1Id: 6, atom2Id: 13, type: 'single' },
        { id: 16, atom1Id: 8, atom2Id: 14, type: 'single' },
        { id: 17, atom1Id: 10, atom2Id: 15, type: 'single' },
        { id: 18, atom1Id: 10, atom2Id: 16, type: 'single' },
        { id: 19, atom1Id: 10, atom2Id: 17, type: 'single' },
      ]
      break
  }

  return computeDerivedData(atoms, bonds)
}

function computeDerivedData(atoms: Atom[], bonds: Bond[]): MoleculeData {
  const elementCounts: Record<string, number> = {}
  let molecularWeight = 0
  let totalCharge = 0

  for (const atom of atoms) {
    elementCounts[atom.element] = (elementCounts[atom.element] || 0) + 1
    molecularWeight += getAtomicWeight(atom.element)
    totalCharge += atom.charge
  }

  const sortedElements = Object.keys(elementCounts).sort((a, b) => {
    if (a === 'C') return -1
    if (b === 'C') return 1
    if (a === 'H') return -1
    if (b === 'H') return 1
    return a.localeCompare(b)
  })

  let formula = ''
  for (const el of sortedElements) {
    formula += el + (elementCounts[el] > 1 ? elementCounts[el] : '')
  }

  return { atoms, bonds, formula, molecularWeight, totalCharge }
}

export function parseMoleculeAsync(fileContent: string, fileName: string): Promise<MoleculeData> {
  return new Promise((resolve, reject) => {
    const worker = createWorker()

    worker.onmessage = (e: MessageEvent) => {
      worker.terminate()
      if (e.data.success) {
        resolve(e.data.data)
      } else {
        reject(new Error(e.data.error))
      }
    }

    worker.onerror = (error: ErrorEvent) => {
      worker.terminate()
      reject(new Error(error.message))
    }

    worker.postMessage({ fileContent, fileName })
  })
}

export function parseMoleculeSync(fileContent: string, fileName: string): MoleculeData {
  const extension = fileName.split('.').pop()?.toLowerCase()
  let atoms: Atom[] = []
  let bonds: Bond[] = []
  let atomId = 1
  let bondId = 1

  if (extension === 'pdb') {
    const lines = fileContent.split('\n')
    for (const line of lines) {
      if (line.startsWith('ATOM') || line.startsWith('HETATM')) {
        const element = line.slice(76, 78).trim() || line.slice(12, 14).trim()
        const x = parseFloat(line.slice(30, 38))
        const y = parseFloat(line.slice(38, 46))
        const z = parseFloat(line.slice(46, 54))
        const charge = parseInt(line.slice(78, 80).trim()) || 0
        atoms.push({ id: atomId++, element, x, y, z, charge })
      }
      if (line.startsWith('CONECT')) {
        const parts = line.slice(6).trim().split(/\s+/).map(Number)
        const atom1 = parts[0]
        for (let i = 1; i < parts.length; i++) {
          const atom2 = parts[i]
          if (atom1 < atom2) {
            bonds.push({ id: bondId++, atom1Id: atom1, atom2Id: atom2, type: 'single' })
          }
        }
      }
    }

    if (bonds.length === 0) {
      const threshold = 1.8
      for (let i = 0; i < atoms.length; i++) {
        for (let j = i + 1; j < atoms.length; j++) {
          const dx = atoms[i].x - atoms[j].x
          const dy = atoms[i].y - atoms[j].y
          const dz = atoms[i].z - atoms[j].z
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
          if (dist < threshold) {
            bonds.push({ id: bondId++, atom1Id: atoms[i].id, atom2Id: atoms[j].id, type: 'single' })
          }
        }
      }
    }
  } else if (extension === 'sdf') {
    const lines = fileContent.split('\n')
    let currentLine = 0
    while (currentLine < lines.length && !lines[currentLine].includes('V2000')) {
      currentLine++
    }
    currentLine++

    if (currentLine < lines.length) {
      const counts = lines[currentLine - 1].trim().split(/\s+/)
      const atomCount = parseInt(counts[0]) || 0
      const bondCount = parseInt(counts[1]) || 0

      for (let i = 0; i < atomCount && currentLine < lines.length; i++) {
        const parts = lines[currentLine++].trim().split(/\s+/)
        atoms.push({
          id: i + 1,
          element: parts[3],
          x: parseFloat(parts[0]),
          y: parseFloat(parts[1]),
          z: parseFloat(parts[2]),
          charge: 0,
        })
      }

      for (let i = 0; i < bondCount && currentLine < lines.length; i++) {
        const parts = lines[currentLine++].trim().split(/\s+/)
        const atom1 = parseInt(parts[0])
        const atom2 = parseInt(parts[1])
        const type = parseInt(parts[2])
        const bondType = type === 2 ? 'double' : type === 3 ? 'triple' : 'single'
        bonds.push({ id: i + 1, atom1Id: atom1, atom2Id: atom2, type: bondType })
      }
    }
  } else {
    throw new Error('不支持的文件格式，请上传 .pdb 或 .sdf 文件')
  }

  return computeDerivedData(atoms, bonds)
}
