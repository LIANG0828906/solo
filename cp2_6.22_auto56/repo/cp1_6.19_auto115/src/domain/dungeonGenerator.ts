export type RoomType = 'normal' | 'monster' | 'treasure' | 'start'

export interface Room {
  id: string
  x: number
  y: number
  type: RoomType
  explored: boolean
  hasMonster: boolean
  monsterDefeated: boolean
  hasLoot: boolean
  lootCollected: boolean
}

export interface DungeonData {
  rooms: Room[]
  adjacencyList: Map<string, string[]>
  startRoomId: string
  width: number
  height: number
}

const GRID_WIDTH = 5
const GRID_HEIGHT = 5
const MONSTER_RATIO = 0.4

function createRoomId(x: number, y: number): string {
  return `${x},${y}`
}

function shuffle<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function generateDungeon(): DungeonData {
  const startTime = performance.now()

  const rooms: Room[] = []
  const roomMap = new Map<string, Room>()

  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      const id = createRoomId(x, y)
      const room: Room = {
        id,
        x,
        y,
        type: 'normal',
        explored: false,
        hasMonster: false,
        monsterDefeated: false,
        hasLoot: false,
        lootCollected: false,
      }
      rooms.push(room)
      roomMap.set(id, room)
    }
  }

  const adjacencyList = new Map<string, string[]>()
  rooms.forEach((room) => adjacencyList.set(room.id, []))

  const visited = new Set<string>()

  function carve(x: number, y: number) {
    const id = createRoomId(x, y)
    visited.add(id)

    const directions = shuffle([
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
    ])

    for (const { dx, dy } of directions) {
      const nx = x + dx
      const ny = y + dy
      const nid = createRoomId(nx, ny)

      if (
        nx >= 0 &&
        nx < GRID_WIDTH &&
        ny >= 0 &&
        ny < GRID_HEIGHT &&
        !visited.has(nid)
      ) {
        adjacencyList.get(id)!.push(nid)
        adjacencyList.get(nid)!.push(id)
        carve(nx, ny)
      }
    }
  }

  const startX = Math.floor(GRID_WIDTH / 2)
  const startY = Math.floor(GRID_HEIGHT / 2)
  carve(startX, startY)

  const startRoomId = createRoomId(startX, startY)
  const startRoom = roomMap.get(startRoomId)!
  startRoom.type = 'start'
  startRoom.explored = true

  const reachableRooms = rooms.filter((r) => {
    const neighbors = adjacencyList.get(r.id) || []
    return neighbors.length > 0 || r.id === startRoomId
  })

  const otherRooms = reachableRooms.filter((r) => r.id !== startRoomId)
  const monsterCount = Math.floor(otherRooms.length * MONSTER_RATIO)
  const shuffledRooms = shuffle(otherRooms)

  for (let i = 0; i < monsterCount && i < shuffledRooms.length; i++) {
    shuffledRooms[i].hasMonster = true
    shuffledRooms[i].type = 'monster'
  }

  const elapsed = performance.now() - startTime
  console.log(`Dungeon generated in ${elapsed.toFixed(2)}ms`)

  return {
    rooms,
    adjacencyList,
    startRoomId,
    width: GRID_WIDTH,
    height: GRID_HEIGHT,
  }
}

export function areRoomsConnected(
  dungeon: DungeonData,
  roomId1: string,
  roomId2: string
): boolean {
  const neighbors = dungeon.adjacencyList.get(roomId1) || []
  return neighbors.includes(roomId2)
}

export function getRoomById(dungeon: DungeonData, roomId: string): Room | undefined {
  return dungeon.rooms.find((r) => r.id === roomId)
}

export function getNeighbors(dungeon: DungeonData, roomId: string): Room[] {
  const neighborIds = dungeon.adjacencyList.get(roomId) || []
  return neighborIds
    .map((id) => getRoomById(dungeon, id))
    .filter((r): r is Room => r !== undefined)
}
