import type { Atom, Residue, StructureData } from '../../types'

export interface PdbValidateResult {
  valid: boolean
  error: string | null
}

export interface PdbParseResult {
  success: boolean
  data: StructureData | null
  error: string | null
}

export class PdbLoader {
  private atomCount: number = 0
  private residueCount: number = 0
  private lastError: string | null = null

  parse(pdbContent: string): PdbParseResult {
    this.lastError = null
    this.atomCount = 0
    this.residueCount = 0

    const validation = this.validate(pdbContent)
    if (!validation.valid) {
      this.lastError = validation.error
      return {
        success: false,
        data: null,
        error: validation.error
      }
    }

    const lines = pdbContent.split('\n')
    const atoms: Atom[] = []
    const residueMap = new Map<string, Residue>()
    const chains = new Set<string>()

    let atomId = 0
    let lineNumber = 0
    const parseErrors: string[] = []

    for (const rawLine of lines) {
      lineNumber++
      const line = rawLine.replace(/\r$/, '')

      if (line.startsWith('ATOM') || line.startsWith('HETATM')) {
        if (line.length < 54) {
          parseErrors.push(`第${lineNumber}行: 列数不足(至少需要54列，当前${line.length}列)`)
          continue
        }

        const atom = this.parseAtomLine(line, atomId, lineNumber, parseErrors)
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

    if (atoms.length === 0) {
      const errorMsg = parseErrors.length > 0
        ? `无法解析任何有效原子数据。错误示例: ${parseErrors[0]}`
        : '未找到有效的ATOM记录'
      this.lastError = errorMsg
      return {
        success: false,
        data: null,
        error: errorMsg
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
      success: true,
      data: {
        atoms,
        residues,
        chains: Array.from(chains).sort()
      },
      error: null
    }
  }

  private parseAtomLine(
    line: string,
    atomId: number,
    lineNumber: number,
    errors: string[]
  ): Atom | null {
    try {
      if (line.length < 54) {
        errors.push(`第${lineNumber}行: 格式错误，列数不足`)
        return null
      }

      const name = line.substring(12, 16).trim()
      const element = this.getElementFromName(name)

      const xStr = line.substring(30, 38).trim()
      const yStr = line.substring(38, 46).trim()
      const zStr = line.substring(46, 54).trim()

      if (!xStr || !yStr || !zStr) {
        errors.push(`第${lineNumber}行: 原子坐标字段为空`)
        return null
      }

      const x = parseFloat(xStr)
      const y = parseFloat(yStr)
      const z = parseFloat(zStr)

      if (isNaN(x)) {
        errors.push(`第${lineNumber}行: X坐标"${xStr}"不是有效数字`)
        return null
      }
      if (isNaN(y)) {
        errors.push(`第${lineNumber}行: Y坐标"${yStr}"不是有效数字`)
        return null
      }
      if (isNaN(z)) {
        errors.push(`第${lineNumber}行: Z坐标"${zStr}"不是有效数字`)
        return null
      }

      const residueStr = line.substring(22, 26).trim()
      if (!residueStr) {
        errors.push(`第${lineNumber}行: 残基序号字段为空`)
        return null
      }

      const residueId = parseInt(residueStr, 10)
      if (isNaN(residueId)) {
        errors.push(`第${lineNumber}行: 残基序号"${residueStr}"不是有效整数`)
        return null
      }

      const chainId = line.substring(21, 22).trim() || 'A'

      if (!name) {
        errors.push(`第${lineNumber}行: 原子名称为空`)
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
    } catch (e) {
      errors.push(`第${lineNumber}行: 解析异常 - ${e instanceof Error ? e.message : String(e)}`)
      return null
    }
  }

  private getResidueName(line: string): string {
    if (line.length >= 20) {
      return line.substring(17, 20).trim() || 'UNK'
    }
    return 'UNK'
  }

  private getElementFromName(atomName: string): string {
    const name = atomName.trim().toUpperCase()
    if (name.startsWith('FE')) return 'FE'
    if (name.startsWith('ZN')) return 'ZN'
    if (name.startsWith('CA') && name.length > 2) return 'CA'
    if (name.startsWith('MG')) return 'MG'
    if (name.startsWith('C')) return 'C'
    if (name.startsWith('N')) return 'N'
    if (name.startsWith('O')) return 'O'
    if (name.startsWith('S')) return 'S'
    if (name.startsWith('P')) return 'P'
    if (name.startsWith('H')) return 'H'
    return 'C'
  }

  getAtomCount(): number {
    return this.atomCount
  }

  getLastError(): string | null {
    return this.lastError
  }

  validate(pdbContent: string): PdbValidateResult {
    if (!pdbContent || pdbContent.trim().length === 0) {
      return {
        valid: false,
        error: 'PDB文件内容为空'
      }
    }

    const lines = pdbContent.split('\n')

    if (lines.length < 2) {
      return {
        valid: false,
        error: 'PDB文件内容过短，缺少必要的记录行'
      }
    }

    const hasHeader = lines.some(line => 
      line.startsWith('HEADER') ||
      line.startsWith('TITLE') ||
      line.startsWith('COMPND') ||
      line.startsWith('SOURCE')
    )

    const hasAtomRecord = lines.some(line => 
      line.startsWith('ATOM') || line.startsWith('HETATM')
    )

    if (!hasHeader && !hasAtomRecord) {
      return {
        valid: false,
        error: 'PDB文件格式错误：缺少文件头(HEADER/TITLE等)和ATOM记录，请确认文件格式正确'
      }
    }

    if (!hasAtomRecord) {
      return {
        valid: false,
        error: 'PDB文件格式错误：未找到任何ATOM或HETATM记录，文件中不包含原子坐标数据'
      }
    }

    let validAtomCount = 0
    let invalidAtomCount = 0
    const sampleErrors: string[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].replace(/\r$/, '')
      
      if (line.startsWith('ATOM') || line.startsWith('HETATM')) {
        if (line.length < 54) {
          invalidAtomCount++
          if (sampleErrors.length < 3) {
            sampleErrors.push(`第${i + 1}行: 列数不足(需要≥54列，当前${line.length}列)`)
          }
          continue
        }

        const xStr = line.substring(30, 38).trim()
        const yStr = line.substring(38, 46).trim()
        const zStr = line.substring(46, 54).trim()
        const residueStr = line.substring(22, 26).trim()

        const x = parseFloat(xStr)
        const y = parseFloat(yStr)
        const z = parseFloat(zStr)
        const residueId = parseInt(residueStr, 10)

        if (isNaN(x) || isNaN(y) || isNaN(z) || isNaN(residueId)) {
          invalidAtomCount++
          if (sampleErrors.length < 3) {
            const reasons: string[] = []
            if (isNaN(x)) reasons.push(`X坐标"${xStr}"非法`)
            if (isNaN(y)) reasons.push(`Y坐标"${yStr}"非法`)
            if (isNaN(z)) reasons.push(`Z坐标"${zStr}"非法`)
            if (isNaN(residueId)) reasons.push(`残基序号"${residueStr}"非法`)
            sampleErrors.push(`第${i + 1}行: ${reasons.join('; ')}`)
          }
        } else {
          validAtomCount++
        }
      }
    }

    if (validAtomCount === 0) {
      const errorMsg = sampleErrors.length > 0
        ? `PDB文件中所有ATOM记录的坐标格式均无效。示例错误：${sampleErrors.join(' | ')}`
        : 'PDB文件中无法解析有效的原子坐标数据'
      return {
        valid: false,
        error: errorMsg
      }
    }

    if (invalidAtomCount > 0 && invalidAtomCount >= validAtomCount) {
      const errorMsg = `PDB文件格式异常：有效原子(${validAtomCount}个)少于无效原子(${invalidAtomCount}个)。示例错误：${sampleErrors[0]}`
      return {
        valid: false,
        error: errorMsg
      }
    }

    return {
      valid: true,
      error: null
    }
  }
}

export const pdbLoader = new PdbLoader()
