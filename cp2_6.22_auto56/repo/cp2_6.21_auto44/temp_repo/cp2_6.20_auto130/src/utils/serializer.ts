import type { LevelData, CellValue, GameObject } from '../types'

export function exportLevel(grid: CellValue[][], objects: GameObject[], terrainTheme: string): string {
  const data: LevelData = {
    grid,
    objects,
    terrainTheme: terrainTheme as any,
  }
  return JSON.stringify(data, null, 2)
}

export function importLevel(jsonString: string): LevelData | null {
  try {
    const data = JSON.parse(jsonString) as LevelData
    if (!data.grid || !data.objects) {
      return null
    }
    if (!Array.isArray(data.grid) || !Array.isArray(data.objects)) {
      return null
    }
    return data
  } catch (e) {
    return null
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (e) {
    return false
  }
}
