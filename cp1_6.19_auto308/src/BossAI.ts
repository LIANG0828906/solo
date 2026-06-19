import type { GameState, BossPhase } from './store'

export interface StateTransition {
  from: BossPhase
  to: BossPhase
  condition: string
  check: (state: GameState, elapsed: number, now: number) => boolean
}

export interface StateNode {
  name: BossPhase
  label: string
  description: string
  duration?: number
  color: string
}

export const STATE_NODES: StateNode[] = [
  { name: 'idle', label: '待机', description: 'Boss进入战场，准备战斗', duration: 2000, color: '#95A5A6' },
  { name: 'chase', label: '追击', description: '追踪玩家X轴位置', duration: 5000, color: '#3498DB' },
  { name: 'charge', label: '蓄力散射', description: '原地蓄力1秒后扇形发射8颗子弹', duration: 1000, color: '#E74C3C' },
  { name: 'summon', label: '召唤小兵', description: '召唤3只小兵沿抛物线落向玩家', duration: 1500, color: '#9B59B6' },
]

export const STATE_TRANSITIONS: StateTransition[] = [
  {
    from: 'idle',
    to: 'chase',
    condition: '2秒后自动进入战斗',
    check: (_state, elapsed) => elapsed >= 2000,
  },
  {
    from: 'chase',
    to: 'charge',
    condition: '追击阶段结束时',
    check: (state, elapsed) => elapsed >= state.phaseDuration && state.bullets.length < state.maxBullets - 8,
  },
  {
    from: 'chase',
    to: 'summon',
    condition: '冷却时间结束 (10秒)',
    check: (state, _elapsed, now) => now - state.lastSummonTime >= state.summonCooldown && state.minions.length < state.maxMinions - 3,
  },
  {
    from: 'charge',
    to: 'chase',
    condition: '蓄力完成，发射弹幕',
    check: (_state, elapsed) => elapsed >= 1000,
  },
  {
    from: 'summon',
    to: 'chase',
    condition: '召唤完成',
    check: (_state, elapsed) => elapsed >= 1500,
  },
]

export function getNextState(
  state: GameState,
  now: number
): { phase: BossPhase; duration: number } | null {
  const elapsed = now - state.phaseStartTime
  const currentPhase = state.bossPhase

  const transitions = STATE_TRANSITIONS.filter((t) => t.from === currentPhase)

  for (const transition of transitions) {
    if (transition.check(state, elapsed, now)) {
      const targetNode = STATE_NODES.find((n) => n.name === transition.to)
      return {
        phase: transition.to,
        duration: targetNode?.duration ?? 3000,
      }
    }
  }

  return null
}

export function getStateDescription(phase: BossPhase): string {
  const node = STATE_NODES.find((n) => n.name === phase)
  return node?.description ?? ''
}

export function getStateLabel(phase: BossPhase): string {
  const node = STATE_NODES.find((n) => n.name === phase)
  return node?.label ?? phase
}

export function getStateColor(phase: BossPhase): string {
  const node = STATE_NODES.find((n) => n.name === phase)
  return node?.color ?? '#FFFFFF'
}

export function getTransitionsFrom(phase: BossPhase): StateTransition[] {
  return STATE_TRANSITIONS.filter((t) => t.from === phase)
}
