import { FossilPreset, Rotation } from './types'

const trilobitePatterns = [
  'M70,10 L95,25 L90,55 L70,70 L50,55 L45,25 Z',
  'M35,30 L55,20 L55,50 L45,65 L30,55 L25,40 Z',
  'M85,30 L105,20 L115,40 L110,55 L95,65 L85,50 Z',
  'M30,55 L50,45 L70,50 L70,75 L50,90 L30,80 L20,65 Z',
  'M70,50 L90,45 L110,55 L120,65 L110,80 L90,90 L70,75 Z',
  'M45,75 L65,70 L65,100 L55,115 L40,110 L35,90 Z',
  'M75,70 L95,75 L105,90 L100,110 L85,115 L75,100 Z',
]

const archaeopteryxPatterns = [
  'M60,15 L80,10 L95,30 L85,50 L65,55 L50,40 L45,25 Z',
  'M20,40 L45,35 L55,55 L50,75 L30,80 L15,65 Z',
  'M85,35 L110,40 L125,65 L115,80 L95,75 L85,55 Z',
  'M55,50 L85,50 L95,80 L80,105 L60,105 L45,80 Z',
  'M25,75 L45,70 L55,95 L50,120 L35,125 L20,105 Z',
  'M85,70 L105,75 L115,105 L105,125 L90,120 L85,95 Z',
  'M50,100 L70,95 L90,100 L95,125 L70,135 L50,125 L45,110 Z',
  'M30,110 L45,105 L40,130 L30,135 L22,125 Z',
]

export const FOSSIL_PRESETS: FossilPreset[] = [
  {
    name: '三叶虫',
    era: 'Devonian',
    eraLabel: '泥盆纪 · 约4.1亿年前',
    description: 'Trilobita',
    pieces: [
      { id: 'tri-1', index: 0, targetX: 310, targetY: 120, correctRotation: 0 as Rotation, patternPath: trilobitePatterns[0], label: '头甲' },
      { id: 'tri-2', index: 1, targetX: 190, targetY: 200, correctRotation: 0 as Rotation, patternPath: trilobitePatterns[1], label: '左颊部' },
      { id: 'tri-3', index: 2, targetX: 430, targetY: 200, correctRotation: 0 as Rotation, patternPath: trilobitePatterns[2], label: '右颊部' },
      { id: 'tri-4', index: 3, targetX: 200, targetY: 340, correctRotation: 0 as Rotation, patternPath: trilobitePatterns[3], label: '左肋叶' },
      { id: 'tri-5', index: 4, targetX: 420, targetY: 340, correctRotation: 0 as Rotation, patternPath: trilobitePatterns[4], label: '右肋叶' },
      { id: 'tri-6', index: 5, targetX: 260, targetY: 460, correctRotation: 0 as Rotation, patternPath: trilobitePatterns[5], label: '左尾甲' },
      { id: 'tri-7', index: 6, targetX: 400, targetY: 460, correctRotation: 0 as Rotation, patternPath: trilobitePatterns[6], label: '右尾甲' },
    ],
  },
  {
    name: '始祖鸟',
    era: 'Jurassic',
    eraLabel: '侏罗纪 · 约1.5亿年前',
    description: 'Archaeopteryx',
    pieces: [
      { id: 'arc-1', index: 0, targetX: 350, targetY: 100, correctRotation: 0 as Rotation, patternPath: archaeopteryxPatterns[0], label: '头颅' },
      { id: 'arc-2', index: 1, targetX: 170, targetY: 220, correctRotation: 0 as Rotation, patternPath: archaeopteryxPatterns[1], label: '左翼尖' },
      { id: 'arc-3', index: 2, targetX: 530, targetY: 220, correctRotation: 0 as Rotation, patternPath: archaeopteryxPatterns[2], label: '右翼尖' },
      { id: 'arc-4', index: 3, targetX: 350, targetY: 280, correctRotation: 0 as Rotation, patternPath: archaeopteryxPatterns[3], label: '躯干' },
      { id: 'arc-5', index: 4, targetX: 210, targetY: 400, correctRotation: 0 as Rotation, patternPath: archaeopteryxPatterns[4], label: '左翅基' },
      { id: 'arc-6', index: 5, targetX: 490, targetY: 400, correctRotation: 0 as Rotation, patternPath: archaeopteryxPatterns[5], label: '右翅基' },
      { id: 'arc-7', index: 6, targetX: 350, targetY: 480, correctRotation: 0 as Rotation, patternPath: archaeopteryxPatterns[6], label: '尾羽' },
      { id: 'arc-8', index: 7, targetX: 260, targetY: 540, correctRotation: 0 as Rotation, patternPath: archaeopteryxPatterns[7], label: '爪骨' },
    ],
  },
]

export function getRandomFossil(): FossilPreset {
  const idx = Math.floor(Math.random() * FOSSIL_PRESETS.length)
  return FOSSIL_PRESETS[idx]
}

export function getRandomRotation(): Rotation {
  const rotations: Rotation[] = [0, 90, 180, 270]
  return rotations[Math.floor(Math.random() * rotations.length)]
}
