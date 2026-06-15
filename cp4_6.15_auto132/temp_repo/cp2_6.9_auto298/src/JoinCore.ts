export type JointType = 'straight' | 'dovetail' | 'corner'

export interface Position {
  x: number
  y: number
  angle: number
}

export interface JointComponent {
  id: string
  type: 'tenon' | 'mortise'
  position: Position
  targetPosition: Position
  size: { width: number; height: number; depth: number }
  attached: boolean
  jointType: JointType
  order: number
}

export interface JointConfig {
  type: JointType
  name: string
  description: string
  tenonCount: number
  mortiseCount: number
  tolerance: number
}

export const JOINT_CONFIGS: Record<JointType, JointConfig> = {
  straight: {
    type: 'straight',
    name: '直榫',
    description: '最基本的榫卯结构，榫头垂直插入卯眼，常用于框架连接。特点是结构简单，受力直接，是学习榫卯的入门之选。',
    tenonCount: 1,
    mortiseCount: 3,
    tolerance: 15
  },
  dovetail: {
    type: 'dovetail',
    name: '燕尾榫',
    description: '形如燕尾的榫卯结构，榫头呈梯形，越拉越紧，具有极强的抗拉能力。常用于抽屉、箱子等需要承受拉力的部位。',
    tenonCount: 1,
    mortiseCount: 3,
    tolerance: 15
  },
  corner: {
    type: 'corner',
    name: '粽角榫',
    description: '三根方材在角部结合的榫卯结构，形似粽子角，故名粽角榫。常用于家具的角部连接，结构稳固，外形美观。',
    tenonCount: 1,
    mortiseCount: 3,
    tolerance: 15
  }
}

export function detectJoint(
  component: JointComponent,
  _tenon: JointComponent,
  tolerance: number = 15
): { success: boolean; snappedPosition?: Position } {
  if (component.attached) return { success: false }
  if (component.type !== 'mortise') return { success: false }

  const dx = component.position.x - component.targetPosition.x
  const dy = component.position.y - component.targetPosition.y
  const distance = Math.sqrt(dx * dx + dy * dy)

  const angleDiff = Math.abs(component.position.angle - component.targetPosition.angle)
  const normalizedAngleDiff = Math.min(angleDiff, 360 - angleDiff)

  if (distance < tolerance && normalizedAngleDiff < 10) {
    return {
      success: true,
      snappedPosition: { ...component.targetPosition }
    }
  }

  return { success: false }
}

export function animateJoint(_component: JointComponent): {
  scale: number[]
  glow: boolean
  sound: string
} {
  return {
    scale: [1, 1.05, 1],
    glow: true,
    sound: 'click'
  }
}

export function generateTargetPositions(
  jointType: JointType,
  workbenchWidth: number,
  workbenchHeight: number
): { tenon: Position; mortises: Position[] } {
  const centerX = workbenchWidth / 2
  const centerY = workbenchHeight / 2

  const tenon: Position = {
    x: centerX - 60,
    y: centerY - 30,
    angle: 0
  }

  let mortises: Position[] = []

  switch (jointType) {
    case 'straight':
      mortises = [
        { x: centerX + 60, y: centerY - 90, angle: 0 },
        { x: centerX + 60, y: centerY - 30, angle: 0 },
        { x: centerX + 60, y: centerY + 30, angle: 0 }
      ]
      break
    case 'dovetail':
      mortises = [
        { x: centerX + 60, y: centerY - 90, angle: -15 },
        { x: centerX + 60, y: centerY - 30, angle: 0 },
        { x: centerX + 60, y: centerY + 30, angle: 15 }
      ]
      break
    case 'corner':
      mortises = [
        { x: centerX + 60, y: centerY - 90, angle: -45 },
        { x: centerX + 60, y: centerY - 30, angle: 0 },
        { x: centerX + 60, y: centerY + 30, angle: 45 }
      ]
      break
  }

  return { tenon, mortises }
}

export function generateInitialPositions(
  jointType: JointType,
  workbenchWidth: number,
  workbenchHeight: number
): { tenon: Position; mortises: Position[] } {
  const { tenon, mortises } = generateTargetPositions(jointType, workbenchWidth, workbenchHeight)

  const scatteredMortises = mortises.map((_, index) => ({
    x: 50 + Math.random() * 100,
    y: 50 + index * 100 + Math.random() * 40,
    angle: Math.random() * 30 - 15
  }))

  return { tenon, mortises: scatteredMortises }
}

export function validateAssembly(components: JointComponent[]): boolean {
  const mortises = components.filter(c => c.type === 'mortise')
  return mortises.every(m => m.attached)
}

export function calculateStressTest(
  components: JointComponent[],
  isCorrect: boolean
): {
  crackLocations: { x: number; y: number; length: number; angle: number }[]
  collapse: boolean
  particleCount: number
} {
  if (isCorrect) {
    return {
      crackLocations: [
        { x: 0.5, y: 0.3, length: 20, angle: 45 },
        { x: 0.55, y: 0.5, length: 15, angle: -30 }
      ],
      collapse: false,
      particleCount: 0
    }
  } else {
    return {
      crackLocations: [
        { x: 0.4, y: 0.4, length: 40, angle: 60 },
        { x: 0.6, y: 0.45, length: 35, angle: -45 },
        { x: 0.5, y: 0.6, length: 50, angle: 0 }
      ],
      collapse: true,
      particleCount: 30
    }
  }
}
