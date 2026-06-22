import type { AtomPosition } from '@/utils/store'

export interface BondChange {
  bondId: string
  action: 'break' | 'form'
  timing: number
  newBond?: { atomA: string; atomB: string; energy: number }
}

export interface AtomKeyframe {
  atomId: string
  position: AtomPosition
}

export interface ReactionPath {
  id: string
  name: string
  moleculeName: string
  duration: number
  keyframes: {
    time: number
    atoms: AtomKeyframe[]
  }[]
  bondChanges: BondChange[]
  energyProfile: { time: number; energy: number; isPeak: boolean }[]
}

const ANIMATION_DURATION = 5

export const reactionPaths: ReactionPath[] = [
  {
    id: 'halogenation',
    name: '卤代反应 (甲烷与氯气)',
    moleculeName: '氯甲烷 (CH₃Cl)',
    duration: ANIMATION_DURATION,
    keyframes: [
      {
        time: 0,
        atoms: [
          { atomId: 'C1', position: { x: 0, y: 0, z: 0 } },
          { atomId: 'H1', position: { x: 0.63, y: 0.63, z: 0.63 } },
          { atomId: 'H2', position: { x: -0.63, y: -0.63, z: 0.63 } },
          { atomId: 'H3', position: { x: -0.63, y: 0.63, z: -0.63 } },
          { atomId: 'H4', position: { x: 0.63, y: -0.63, z: -0.63 } },
          { atomId: 'Cl1', position: { x: 3, y: 0, z: 0 } },
          { atomId: 'Cl2', position: { x: 4, y: 0, z: 0 } }
        ]
      },
      {
        time: 1.5,
        atoms: [
          { atomId: 'C1', position: { x: 0, y: 0, z: 0 } },
          { atomId: 'H1', position: { x: 0.63, y: 0.63, z: 0.63 } },
          { atomId: 'H2', position: { x: -0.63, y: -0.63, z: 0.63 } },
          { atomId: 'H3', position: { x: -0.63, y: 0.63, z: -0.63 } },
          { atomId: 'H4', position: { x: 1.5, y: -0.63, z: -0.63 } },
          { atomId: 'Cl1', position: { x: 1.5, y: 0, z: 0 } },
          { atomId: 'Cl2', position: { x: 3.5, y: 0.5, z: 0 } }
        ]
      },
      {
        time: 2.5,
        atoms: [
          { atomId: 'C1', position: { x: 0, y: 0, z: 0 } },
          { atomId: 'H1', position: { x: 0.63, y: 0.63, z: 0.63 } },
          { atomId: 'H2', position: { x: -0.63, y: -0.63, z: 0.63 } },
          { atomId: 'H3', position: { x: -0.63, y: 0.63, z: -0.63 } },
          { atomId: 'H4', position: { x: 2.5, y: -0.3, z: -0.3 } },
          { atomId: 'Cl1', position: { x: 0.9, y: -0.4, z: -0.4 } },
          { atomId: 'Cl2', position: { x: 3.5, y: 0.5, z: 0 } }
        ]
      },
      {
        time: ANIMATION_DURATION,
        atoms: [
          { atomId: 'C1', position: { x: 0, y: 0, z: 0 } },
          { atomId: 'H1', position: { x: 0.63, y: 0.63, z: 0.63 } },
          { atomId: 'H2', position: { x: -0.63, y: -0.63, z: 0.63 } },
          { atomId: 'H3', position: { x: -0.63, y: 0.63, z: -0.63 } },
          { atomId: 'H4', position: { x: 3.5, y: 0.3, z: 0.3 } },
          { atomId: 'Cl1', position: { x: 0.9, y: -0.4, z: -0.4 } },
          { atomId: 'Cl2', position: { x: 3.5, y: 0.5, z: 0 } }
        ]
      }
    ],
    bondChanges: [
      { bondId: 'bond-C1-H4', action: 'break', timing: 2.0 },
      { bondId: 'bond-Cl1-Cl2', action: 'break', timing: 1.8 },
      {
        bondId: 'bond-C1-Cl1',
        action: 'form',
        timing: 2.8,
        newBond: { atomA: 'C1', atomB: 'Cl1', energy: 3.3 }
      },
      {
        bondId: 'bond-H4-Cl2',
        action: 'form',
        timing: 3.2,
        newBond: { atomA: 'H4', atomB: 'Cl2', energy: 4.4 }
      }
    ],
    energyProfile: [
      { time: 0, energy: 0, isPeak: false },
      { time: 0.5, energy: 10, isPeak: false },
      { time: 1.0, energy: 25, isPeak: false },
      { time: 1.5, energy: 45, isPeak: false },
      { time: 2.2, energy: 65, isPeak: true },
      { time: 2.8, energy: 50, isPeak: false },
      { time: 3.5, energy: 30, isPeak: false },
      { time: 4.2, energy: 15, isPeak: false },
      { time: ANIMATION_DURATION, energy: 5, isPeak: false }
    ]
  },
  {
    id: 'oxidation',
    name: '氧化反应 (甲烷燃烧)',
    moleculeName: '二氧化碳 + 水 (CO₂ + H₂O)',
    duration: ANIMATION_DURATION,
    keyframes: [
      {
        time: 0,
        atoms: [
          { atomId: 'C1', position: { x: 0, y: 0, z: 0 } },
          { atomId: 'H1', position: { x: 0.63, y: 0.63, z: 0.63 } },
          { atomId: 'H2', position: { x: -0.63, y: -0.63, z: 0.63 } },
          { atomId: 'H3', position: { x: -0.63, y: 0.63, z: -0.63 } },
          { atomId: 'H4', position: { x: 0.63, y: -0.63, z: -0.63 } },
          { atomId: 'O1', position: { x: -3, y: 2, z: 0 } },
          { atomId: 'O2', position: { x: -3, y: -2, z: 0 } },
          { atomId: 'H5', position: { x: -4, y: 2.5, z: 0 } },
          { atomId: 'H6', position: { x: -4, y: -2.5, z: 0 } },
          { atomId: 'C2', position: { x: 0, y: 3, z: 0 } }
        ]
      },
      {
        time: 1.5,
        atoms: [
          { atomId: 'C1', position: { x: 0, y: 0, z: 0 } },
          { atomId: 'H1', position: { x: 1.2, y: 1.2, z: 1.2 } },
          { atomId: 'H2', position: { x: -1.2, y: -1.2, z: 1.2 } },
          { atomId: 'H3', position: { x: -1.2, y: 1.2, z: -1.2 } },
          { atomId: 'H4', position: { x: 1.2, y: -1.2, z: -1.2 } },
          { atomId: 'O1', position: { x: -1.5, y: 1.5, z: 0 } },
          { atomId: 'O2', position: { x: -1.5, y: -1.5, z: 0 } },
          { atomId: 'H5', position: { x: -2.5, y: 2, z: 0 } },
          { atomId: 'H6', position: { x: -2.5, y: -2, z: 0 } },
          { atomId: 'C2', position: { x: 0, y: 2, z: 0 } }
        ]
      },
      {
        time: 2.5,
        atoms: [
          { atomId: 'C1', position: { x: 0, y: 0, z: 0 } },
          { atomId: 'H1', position: { x: -1.8, y: 2.2, z: 0.5 } },
          { atomId: 'H2', position: { x: -1.8, y: -2.2, z: 0.5 } },
          { atomId: 'H3', position: { x: -1.5, y: 1.8, z: -0.5 } },
          { atomId: 'H4', position: { x: -1.5, y: -1.8, z: -0.5 } },
          { atomId: 'O1', position: { x: -1, y: 2, z: 0 } },
          { atomId: 'O2', position: { x: -1, y: -2, z: 0 } },
          { atomId: 'H5', position: { x: -2, y: 2.5, z: 0 } },
          { atomId: 'H6', position: { x: -2, y: -2.5, z: 0 } },
          { atomId: 'C2', position: { x: 2, y: 0, z: 0 } }
        ]
      },
      {
        time: ANIMATION_DURATION,
        atoms: [
          { atomId: 'C1', position: { x: 0, y: 0, z: 0 } },
          { atomId: 'H1', position: { x: -2.2, y: 2.5, z: 0.5 } },
          { atomId: 'H2', position: { x: -2.2, y: -2.5, z: 0.5 } },
          { atomId: 'H3', position: { x: -2, y: 2.2, z: -0.5 } },
          { atomId: 'H4', position: { x: -2, y: -2.2, z: -0.5 } },
          { atomId: 'O1', position: { x: -1.5, y: 2, z: 0 } },
          { atomId: 'O2', position: { x: -1.5, y: -2, z: 0 } },
          { atomId: 'H5', position: { x: -2.5, y: 2.8, z: 0 } },
          { atomId: 'H6', position: { x: -2.5, y: -2.8, z: 0 } },
          { atomId: 'O1_2', position: { x: 1.5, y: 0, z: 0 } as AtomPosition } as unknown as AtomKeyframe,
          { atomId: 'C2', position: { x: 3, y: 0, z: 0 } },
          { atomId: 'O2_2', position: { x: 4.5, y: 0, z: 0 } as AtomPosition } as unknown as AtomKeyframe
        ]
      }
    ],
    bondChanges: [
      { bondId: 'bond-C1-H1', action: 'break', timing: 1.2 },
      { bondId: 'bond-C1-H2', action: 'break', timing: 1.4 },
      { bondId: 'bond-C1-H3', action: 'break', timing: 1.6 },
      { bondId: 'bond-C1-H4', action: 'break', timing: 1.8 },
      { bondId: 'bond-O1-H5', action: 'break', timing: 2.0 },
      { bondId: 'bond-O2-H6', action: 'break', timing: 2.2 },
      {
        bondId: 'bond-H1-O1',
        action: 'form',
        timing: 2.8,
        newBond: { atomA: 'H1', atomB: 'O1', energy: 4.8 }
      },
      {
        bondId: 'bond-H3-O1',
        action: 'form',
        timing: 3.0,
        newBond: { atomA: 'H3', atomB: 'O1', energy: 4.8 }
      },
      {
        bondId: 'bond-H2-O2',
        action: 'form',
        timing: 3.2,
        newBond: { atomA: 'H2', atomB: 'O2', energy: 4.8 }
      },
      {
        bondId: 'bond-H4-O2',
        action: 'form',
        timing: 3.4,
        newBond: { atomA: 'H4', atomB: 'O2', energy: 4.8 }
      }
    ],
    energyProfile: [
      { time: 0, energy: 0, isPeak: false },
      { time: 0.5, energy: 20, isPeak: false },
      { time: 1.0, energy: 45, isPeak: false },
      { time: 1.8, energy: 85, isPeak: true },
      { time: 2.5, energy: 60, isPeak: false },
      { time: 3.2, energy: 35, isPeak: false },
      { time: 4.0, energy: 15, isPeak: false },
      { time: ANIMATION_DURATION, energy: -10, isPeak: false }
    ]
  }
]

export const getReactionById = (id: string): ReactionPath | undefined => {
  return reactionPaths.find((r) => r.id === id)
}
