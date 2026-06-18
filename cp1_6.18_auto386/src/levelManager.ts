import { v4 as uuidv4 } from 'uuid';
import { LevelConfig, Mechanism, MovingPlank, Vector2D } from './types';

const GEM_COLORS = ['#FF6B6B', '#4ECDC4', '#FFA07A', '#45B7D1'];

function rect(
  type: 'trigger' | 'moving_plank' | 'goal',
  x: number,
  y: number,
  w: number,
  h: number,
  rotation = 0,
  extras: Partial<Mechanism> = {}
): Mechanism {
  return {
    id: uuidv4(),
    type,
    position: { x, y },
    basePosition: { x, y },
    active: true,
    shape: 'rectangle',
    width: w,
    height: h,
    rotation,
    ...extras,
  } as Mechanism;
}

function circle(
  type: 'gem' | 'portal' | 'goal',
  x: number,
  y: number,
  r: number,
  extras: Partial<Mechanism> = {}
): Mechanism {
  return {
    id: uuidv4(),
    type,
    position: { x, y },
    basePosition: { x, y },
    active: true,
    shape: 'circle',
    radius: r,
    ...extras,
  } as Mechanism;
}

function gem(x: number, y: number, index = 0): Mechanism {
  return circle('gem', x, y, 14, { gemColor: GEM_COLORS[index % GEM_COLORS.length] } as any);
}

function portal(x: number, y: number, pairedId: string): Mechanism {
  return circle('portal', x, y, 28, { pairedPortalId: pairedId } as any);
}

function movingPlank(
  x: number,
  y: number,
  w: number,
  h: number,
  axis: 'x' | 'y',
  range: number,
  period: number,
  phase = 0
): Mechanism {
  return {
    id: uuidv4(),
    type: 'moving_plank',
    position: { x, y },
    basePosition: { x, y },
    active: true,
    shape: 'rectangle',
    width: w,
    height: h,
    rotation: 0,
    motionAxis: axis,
    motionRange: range,
    motionPeriod: period,
    phase,
  } as MovingPlank;
}

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: '第1关：初识灵摆',
    pivot: { x: 400, y: 120 },
    initialAngle: 0,
    ropeLength: 200,
    totalGems: 2,
    mechanisms: [
      rect('trigger', 220, 360, 80, 16, 0.35),
      rect('trigger', 580, 360, 80, 16, -0.35),
      gem(220, 430, 0),
      gem(580, 430, 1),
      rect('goal', 400, 530, 100, 20, 0),
    ],
  },
  {
    id: 2,
    name: '第2关：流动之障',
    pivot: { x: 120, y: 120 },
    initialAngle: 0,
    ropeLength: 180,
    totalGems: 3,
    mechanisms: [
      movingPlank(400, 300, 120, 16, 'x', 180, 3, 0),
      rect('trigger', 340, 420, 70, 14, 0.2),
      rect('trigger', 580, 460, 70, 14, -0.25),
      gem(200, 420, 0),
      gem(450, 500, 1),
      gem(680, 380, 2),
      rect('goal', 700, 520, 90, 20, 0),
    ],
  },
  {
    id: 3,
    name: '第3关：虚空之门',
    pivot: { x: 400, y: 100 },
    initialAngle: 0,
    ropeLength: 160,
    totalGems: 3,
    mechanisms: (() => {
      const pA = portal(150, 340, 'TBD');
      const pB = portal(650, 460, pA.id);
      (pA as any).pairedPortalId = pB.id;
      return [
        pA,
        pB,
        rect('trigger', 150, 240, 60, 12, 0),
        rect('trigger', 650, 360, 60, 12, 0),
        gem(150, 450, 0),
        gem(400, 480, 1),
        gem(650, 550, 2),
        rect('goal', 400, 540, 100, 20, 0),
      ];
    })(),
  },
  {
    id: 4,
    name: '第4关：光阴紧迫',
    pivot: { x: 400, y: 110 },
    initialAngle: 0,
    ropeLength: 170,
    timeLimit: 15,
    totalGems: 2,
    mechanisms: [
      rect('trigger', 210, 350, 70, 14, 0.3),
      rect('trigger', 590, 350, 70, 14, -0.3),
      rect('trigger', 400, 260, 80, 12, 0),
      gem(400, 400, 0),
      gem(400, 500, 1),
      rect('goal', 400, 555, 100, 20, 0),
    ],
  },
  {
    id: 5,
    name: '第5关：终极试炼',
    pivot: { x: 150, y: 110 },
    initialAngle: 0,
    ropeLength: 150,
    timeLimit: 25,
    totalGems: 4,
    mechanisms: (() => {
      const pA = portal(300, 200, 'TBD');
      const pB = portal(600, 500, pA.id);
      (pA as any).pairedPortalId = pB.id;
      return [
        movingPlank(400, 320, 110, 14, 'x', 140, 3, 0),
        movingPlank(500, 440, 100, 14, 'y', 80, 2.5, 1.2),
        pA,
        pB,
        rect('trigger', 150, 330, 60, 12, 0.25),
        rect('trigger', 720, 260, 60, 12, -0.3),
        gem(150, 430, 0),
        gem(400, 500, 1),
        gem(700, 380, 2),
        gem(600, 160, 3),
        rect('goal', 720, 530, 90, 20, 0),
      ];
    })(),
  },
];

export const TOTAL_LEVELS = LEVELS.length;

export function getLevelConfig(index: number): LevelConfig {
  const i = Math.max(0, Math.min(LEVELS.length - 1, index));
  const src = LEVELS[i];
  return {
    ...src,
    pivot: { ...src.pivot },
    mechanisms: src.mechanisms.map((m) => ({
      ...m,
      id: uuidv4(),
      position: { ...(m.basePosition || m.position) },
      basePosition: { ...(m.basePosition || m.position) },
      active: true,
      triggered: false,
    })),
  };
}

export function getMechanismObstacles(mechanisms: Mechanism[]): Mechanism[] {
  return mechanisms.filter((m) => m.active);
}

export function updateMechanismsWithTime(
  mechanisms: Mechanism[],
  timeSec: number
): Mechanism[] {
  return mechanisms.map((m) => {
    if (!m.active) return m;
    if (m.shape === 'rectangle' && (m as MovingPlank).motionPeriod !== undefined) {
      const mp = m as MovingPlank;
      const base = mp.basePosition || mp.position;
      const omega = (2 * Math.PI) / mp.motionPeriod;
      const offset = Math.sin(omega * timeSec + mp.phase) * mp.motionRange;
      const newPos: Vector2D = { ...base };
      if (mp.motionAxis === 'x') newPos.x += offset;
      else newPos.y += offset;
      return { ...mp, position: newPos };
    }
    return m;
  });
}

export function hasAllTriggersActivated(mechanisms: Mechanism[]): boolean {
  const triggers = mechanisms.filter((m) => m.type === 'trigger' && m.active);
  return triggers.length === 0 || triggers.every((t) => t.triggered);
}
