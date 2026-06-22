import type { CommandMeta, RobotTypeMeta } from '@/core/types'

export const GRID_SIZE = 8
export const COMMAND_SLOTS = 6
export const MAX_ROBOTS = 4
export const MAX_TURNS = 50
export const TURN_DELAY_MS = 650
export const TRAIL_LIFETIME_TURNS = 2

export const THEME = {
  colors: {
    bgDeep: '#0A0E27',
    bgMid: '#141028',
    bgLight: '#1A1033',
    neonCyan: '#00FFFF',
    neonCyanSoft: '#33FFFF',
    neonPurple: '#8B00FF',
    neonPurpleSoft: '#B14DFF',
    neonRed: '#FF0033',
    neonRedSoft: '#FF6685',
    neonGreen: '#00FF88',
    neonGreenSoft: '#66FFB8',
    neonGold: '#FFD700',
    neonGoldSoft: '#FFE880',
    textPrimary: '#E6F0FF',
    textSecondary: '#8B95C9',
    textMuted: '#4A4F75',
    borderGlow: '#1A3A5C',
    gridLine: 'rgba(0, 255, 255, 0.18)',
    gridLineStrong: 'rgba(0, 255, 255, 0.35)'
  },
  fonts: {
    display: "'Orbitron', sans-serif",
    body: "'Rajdhani', sans-serif"
  }
} as const

export const ROBOT_TYPES: Record<string, RobotTypeMeta> = {
  scout: {
    type: 'scout',
    name: 'SCOUT-X1',
    nameCn: '侦察型',
    description: '高机动高速单位，擅长迂回与扫描。装甲薄弱，依赖走位生存。',
    stats: {
      maxHp: 60,
      speed: 9,
      attack: 14,
      range: 3,
      viewRange: 5
    },
    color: '#00FFFF',
    accentColor: '#33FFFF'
  },
  attacker: {
    type: 'attacker',
    name: 'STRIKER-A7',
    nameCn: '攻击型',
    description: '高输出均衡单位，火力与机动兼备。核心输出位。',
    stats: {
      maxHp: 85,
      speed: 6,
      attack: 26,
      range: 4,
      viewRange: 3
    },
    color: '#FF0033',
    accentColor: '#FF6685'
  },
  tank: {
    type: 'tank',
    name: 'FORTRESS-T3',
    nameCn: '坦克型',
    description: '厚甲高血量单位，防御端压制力强。速度较慢但可抵御致命打击。',
    stats: {
      maxHp: 140,
      speed: 3,
      attack: 18,
      range: 2,
      viewRange: 2
    },
    color: '#FFD700',
    accentColor: '#FFE880'
  }
}

export const COMMANDS: Record<string, CommandMeta> = {
  forward: {
    type: 'forward',
    label: 'FWD',
    labelCn: '前进',
    icon: 'ArrowUp',
    color: '#00FFFF',
    description: '向当前朝向前进1格'
  },
  backward: {
    type: 'backward',
    label: 'BWD',
    labelCn: '后退',
    icon: 'ArrowDown',
    color: '#33FFFF',
    description: '向反方向后退1格（不转向）'
  },
  turnLeft: {
    type: 'turnLeft',
    label: 'TRN-L',
    labelCn: '左转',
    icon: 'Undo2',
    color: '#B14DFF',
    description: '原地逆时针旋转90°'
  },
  turnRight: {
    type: 'turnRight',
    label: 'TRN-R',
    labelCn: '右转',
    icon: 'Redo2',
    color: '#8B00FF',
    description: '原地顺时针旋转90°'
  },
  attack: {
    type: 'attack',
    label: 'ATK',
    labelCn: '攻击',
    icon: 'Zap',
    color: '#FF0033',
    description: '向前方发射能量弹，造成伤害'
  },
  defend: {
    type: 'defend',
    label: 'DEF',
    labelCn: '防御',
    icon: 'Shield',
    color: '#00FF88',
    description: '进入防御姿态，受到伤害减半'
  },
  scan: {
    type: 'scan',
    label: 'SCN',
    labelCn: '扫描',
    icon: 'Radar',
    color: '#FFD700',
    description: '侦测视野范围内所有敌人位置'
  }
}

export const COMMAND_ORDER = [
  'forward',
  'backward',
  'turnLeft',
  'turnRight',
  'attack',
  'defend',
  'scan'
] as const

export const AI_ROBOT_NAMES = [
  { name: 'RAVEN-02', color: '#FF66CC' },
  { name: 'WRAITH-03', color: '#FFAA00' },
  { name: 'VIPER-04', color: '#66FF66' }
]

export const OBSTACLE_COUNT = {
  metalCrate: 6,
  energySupply: 3
}

export const SUPPLY_HEAL_VALUE = 30
export const METAL_CRATE_HP = 30
