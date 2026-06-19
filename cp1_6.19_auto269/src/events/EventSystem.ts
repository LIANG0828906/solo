import type { Board, Unit, EventConfig, EventResult, Position } from '@/types'
import { setCellEvent, getCell, getPositionsInRange, coordToIndex } from '@/engine/Board'

const EVENT_CONFIGS: EventConfig[] = [
  {
    type: 'fire_trap',
    name: '烈焰陷阱',
    description: '火属性伤害翻倍',
    weight: 25,
    duration: 2,
  },
  {
    type: 'ice_zone',
    name: '冰封区域',
    description: '移动耗费加倍',
    weight: 25,
    duration: 2,
  },
  {
    type: 'thunder_storm',
    name: '雷暴领域',
    description: '每回合结束区域棋子弹射伤害',
    weight: 25,
    duration: 2,
  },
  {
    type: 'shadow_mist',
    name: '暗影迷雾',
    description: '区域内棋子攻击目标有概率miss',
    weight: 25,
    duration: 2,
  },
]

function weightedRandomSelect(configs: EventConfig[]): EventConfig {
  const totalWeight = configs.reduce((sum, config) => sum + config.weight, 0)
  let random = Math.random() * totalWeight
  
  for (const config of configs) {
    random -= config.weight
    if (random <= 0) {
      return config
    }
  }
  return configs[configs.length - 1]
}

function getRandomCenter(size: number): Position {
  const margin = 1
  return {
    x: margin + Math.floor(Math.random() * (size - margin * 2)),
    y: margin + Math.floor(Math.random() * (size - margin * 2)),
  }
}

function getEventPositions(
  eventType: string,
  center: Position,
  boardSize: number
): Position[] {
  switch (eventType) {
    case 'fire_trap':
      return getPositionsInRange(center.x, center.y, 1, boardSize)
    case 'ice_zone':
      return getPositionsInRange(center.x, center.y, 1, boardSize)
    case 'thunder_storm':
      return getPositionsInRange(center.x, center.y, 2, boardSize)
    case 'shadow_mist':
      return getPositionsInRange(center.x, center.y, 2, boardSize)
    default:
      return []
  }
}

export function triggerRandomEvents(
  board: Board,
  units: Unit[]
): EventResult | null {
  const shouldTrigger = Math.random() < 0.6
  if (!shouldTrigger) return null
  
  const selectedEvent = weightedRandomSelect(EVENT_CONFIGS)
  const center = getRandomCenter(board.size)
  const positions = getEventPositions(selectedEvent.type!, center, board.size)
  
  return {
    type: selectedEvent.type,
    positions,
    duration: selectedEvent.duration,
  }
}

export function applyEventEffect(
  event: EventResult,
  board: Board
): void {
  for (const pos of event.positions) {
    setCellEvent(board, pos.x, pos.y, event.type, event.duration)
  }
}

export function decreaseEventDurations(board: Board): void {
  for (let y = 0; y < board.size; y++) {
    for (let x = 0; x < board.size; x++) {
      const cell = getCell(board, x, y)
      if (cell && cell.eventDuration > 0) {
        cell.eventDuration--
        if (cell.eventDuration <= 0) {
          cell.eventType = null
        }
      }
    }
  }
}

export function getEventColor(eventType: string): string {
  switch (eventType) {
    case 'fire_trap':
      return 'rgba(255, 87, 34, 0.3)'
    case 'ice_zone':
      return 'rgba(66, 165, 245, 0.3)'
    case 'thunder_storm':
      return 'rgba(156, 39, 176, 0.3)'
    case 'shadow_mist':
      return 'rgba(33, 33, 33, 0.5)'
    default:
      return 'transparent'
  }
}

export function getEventName(eventType: string): string {
  const config = EVENT_CONFIGS.find(c => c.type === eventType)
  return config?.name || ''
}

export { EVENT_CONFIGS }
