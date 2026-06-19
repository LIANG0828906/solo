import type { Atom, Residue, StructureData } from '../../types'

export class PdbLoader {
  private atomCount: number = 0
  private residueCount: number = 0

  parse(pdbContent: string): StructureData {
    const lines = pdbContent.split('\n')
    const atoms: Atom[] = []
    const residueMap = new Map<string, Residue>()
    const chains = new Set<string>()

    let atomId = 0

    for (const line of lines) {
      if (line.startsWith('ATOM') || line.startsWith('HETATM')) {
        const atom = this.parseAtomLine(line, atomId)
        if (atom) {
          atoms.push(atom)
          chains.add(atom.chainId)

          const residueKey = `${atom.chainId}_${atom.residueId}`
          if (!residueMap.has(residueKey)) {
            residueMap.set(residueKey, {
              id: this.residueCount++,
              name: this.getResidueName(line),
              seqNum: atom.residueId,
              chainId: atom.chainId,
              atoms: [],
              center: { x: 0, y: 0, z: 0 }
            })
          }

          const residue = residueMap.get(residueKey)!
          residue.atoms.push(atom)

          atomId++
        }
      }
    }

    const residues = Array.from(residueMap.values())
    
    for (const residue of residues) {
      if (residue.atoms.length > 0) {
        const sum = residue.atoms.reduce(
          (acc, atom) => ({
            x: acc.x + atom.x,
            y: acc.y + atom.y,
            z: acc.z + atom.z
          }),
          { x: 0, y: 0, z: 0 }
        )
        residue.center = {
          x: sum.x / residue.atoms.length,
          y: sum.y / residue.atoms.length,
          z: sum.z / residue.atoms.length
        }
      }
    }

    this.atomCount = atoms.length

    return {
      atoms,
      residues,
      chains: Array.from(chains).sort()
    }
  }

  private parseAtomLine(line: string, atomId: number): Atom | null {
    try {
      const name = line.substring(12, 16).trim()
      const element = this.getElementFromName(name)
      const x = parseFloat(line.substring(30, 38).trim())
      const y = parseFloat(line.substring(38, 46).trim())
      const z = parseFloat(line.substring(46, 54).trim())
      const residueId = parseInt(line.substring(22, 26).trim(), 10)
      const chainId = line.substring(21, 22).trim() || 'A'

      if (isNaN(x) || isNaN(y) || isNaN(z)) {
        return null
      }

      return {
        id: atomId,
        name,
        element,
        x,
        y,
        z,
        residueId,
        chainId
      }
    } catch {
      return null
    }
  }

  private getResidueName(line: string): string {
    return line.substring(17, 20).trim()
  }

  private getElementFromName(atomName: string): string {
    const name = atomName.trim().toUpperCase()
    if (name.startsWith('C')) return 'C'
    if (name.startsWith('N')) return 'N'
    if (name.startsWith('O')) return 'O'
    if (name.startsWith('S')) return 'S'
    if (name.startsWith('P')) return 'P'
    if (name.startsWith('H')) return 'H'
    if (name.startsWith('FE')) return 'FE'
    if (name.startsWith('ZN')) return 'ZN'
    if (name.startsWith('CA')) return 'CA'
    if (name.startsWith('MG')) return 'MG'
    return 'C'
  }

  getAtomCount(): number {
    return this.atomCount
  }

  validate(pdbContent: string): boolean {
    const lines = pdbContent.split('\n')
    const hasAtomRecord = lines.some(line => line.startsWith('ATOM'))
    const hasValidFormat = lines.some(line => {
      if (line.startsWith('ATOM')) {
        const x = parseFloat(line.substring(30, 38).trim())
        return !isNaN(x)
      }
      return false
    })
    return hasAtomRecord && hasValidFormat
  }
}

export const pdbLoader = new PdbLoader()
