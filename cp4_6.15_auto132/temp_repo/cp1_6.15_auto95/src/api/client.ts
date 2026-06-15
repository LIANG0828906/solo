import type { DungeonGenerateResponse, LootItem, EnemyConfig } from '@/game/types'

const API_BASE = '/api'

export async function generateDungeon(seed?: number, floor: number = 1): Promise<DungeonGenerateResponse> {
  const res = await fetch(`${API_BASE}/dungeon/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seed, floor }),
  })
  if (!res.ok) throw new Error('Failed to generate dungeon')
  return res.json()
}

export async function getEnemyConfig(floor: number): Promise<EnemyConfig[]> {
  const res = await fetch(`${API_BASE}/enemies/config?floor=${floor}`)
  if (!res.ok) throw new Error('Failed to get enemy config')
  return res.json()
}

export async function rollLoot(playerLevel: number, floor: number): Promise<LootItem> {
  const res = await fetch(`${API_BASE}/loot/roll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerLevel, floor }),
  })
  if (!res.ok) throw new Error('Failed to roll loot')
  return res.json()
}
