import type { DungeonData, Room } from './dungeonGenerator'
import type { InventoryState } from './playerInventory'
import type { Equipment } from './combatSystem'

export interface GameSaveData {
  version: string
  timestamp: number
  dungeon: {
    rooms: Room[]
    adjacencyList: [string, string[]][]
    startRoomId: string
    width: number
    height: number
  }
  inventory: InventoryState
  currentRoomId: string
  exploredRooms: string[]
}

const SAVE_VERSION = '1.0.0'

export function exportGameState(
  dungeon: DungeonData,
  inventory: InventoryState,
  currentRoomId: string
): GameSaveData {
  const adjacencyListArray: [string, string[]][] = Array.from(
    dungeon.adjacencyList.entries()
  )

  const exploredRooms = dungeon.rooms
    .filter((r) => r.explored)
    .map((r) => r.id)

  return {
    version: SAVE_VERSION,
    timestamp: Date.now(),
    dungeon: {
      rooms: dungeon.rooms,
      adjacencyList: adjacencyListArray,
      startRoomId: dungeon.startRoomId,
      width: dungeon.width,
      height: dungeon.height,
    },
    inventory: JSON.parse(JSON.stringify(inventory)),
    currentRoomId,
    exploredRooms,
  }
}

export function gameStateToJson(data: GameSaveData): string {
  return JSON.stringify(data, null, 2)
}

export function downloadSaveFile(data: GameSaveData): void {
  const json = gameStateToJson(data)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `dungeon_save_${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function importGameState(json: string): GameSaveData | null {
  try {
    const data = JSON.parse(json) as GameSaveData
    if (data.version !== SAVE_VERSION) {
      console.warn('Save file version mismatch')
    }
    return data
  } catch (e) {
    console.error('Failed to parse save file:', e)
    return null
  }
}

export function restoreDungeonFromSave(
  saveData: GameSaveData
): DungeonData {
  const adjacencyList = new Map<string, string[]>(saveData.dungeon.adjacencyList)

  return {
    rooms: saveData.dungeon.rooms,
    adjacencyList,
    startRoomId: saveData.dungeon.startRoomId,
    width: saveData.dungeon.width,
    height: saveData.dungeon.height,
  }
}

export function getSaveFileSize(data: GameSaveData): number {
  const json = gameStateToJson(data)
  return new Blob([json]).size
}

export function validateSaveData(data: GameSaveData): boolean {
  if (!data || typeof data !== 'object') return false
  if (!data.version || !data.dungeon || !data.inventory) return false
  if (!Array.isArray(data.dungeon.rooms)) return false
  if (!Array.isArray(data.dungeon.adjacencyList)) return false
  if (!data.inventory.playerStats) return false
  if (!data.inventory.equipped) return false
  if (!Array.isArray(data.inventory.equipment)) return false
  return true
}

export const equipmentTypeNames: Record<string, string> = {
  weapon: '武器',
  armor: '护甲',
  ring: '戒指',
  helmet: '头盔',
}
