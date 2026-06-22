import { v4 as uuidv4 } from 'uuid';
import type { BodyType, Vector2, RigidBody, RopeConstraint } from './PhysicsEngine';

export interface ElementDefinition {
  id: string;
  type: BodyType;
  x: number;
  y: number;
  rotation?: number;
  width?: number;
  height?: number;
  radius?: number;
  isStatic: boolean;
}

export interface LevelDefinition {
  id: number;
  name: string;
  description: string;
  availableElements: BodyType[];
  maxSteps: number;
  timeLimit: number;
  startPosition: Vector2;
  goalPosition: Vector2;
  goalRadius: number;
  preplacedElements: ElementDefinition[];
  preplacedConstraints: Omit<RopeConstraint, 'id' | 'tension'>[];
  starThresholds: { threeStar: { time: number; steps: number }; twoStar: { time: number; steps: number } };
}

function createBody(def: ElementDefinition): RigidBody {
  return {
    id: def.id || uuidv4(),
    type: def.type,
    position: { x: def.x, y: def.y },
    velocity: { x: 0, y: 0 },
    mass: def.type === 'ball' ? 1 : def.type === 'anchor' ? 10000 : def.type === 'pulley' ? 0.5 : 10,
    rotation: def.rotation || 0,
    angularVelocity: 0,
    width: def.width,
    height: def.height,
    radius: def.radius,
    isStatic: def.isStatic,
    restitution: def.type === 'ball' ? 0.5 : 0.3,
    friction: def.type === 'incline' ? 0.3 : def.type === 'lever' ? 0.5 : 0.8,
  };
}

function createBall(position: Vector2): RigidBody {
  return {
    id: 'ball',
    type: 'ball',
    position: { ...position },
    velocity: { x: 0, y: 0 },
    mass: 1,
    rotation: 0,
    angularVelocity: 0,
    radius: 10,
    isStatic: false,
    restitution: 0.6,
    friction: 0.3,
  };
}

export class LevelBuilder {
  private static levels: LevelDefinition[] = [
    {
      id: 1,
      name: '初识杠杆',
      description: '使用杠杆和固定点，将小球弹到终点',
      availableElements: ['lever', 'anchor', 'rope'],
      maxSteps: 10,
      timeLimit: 120,
      startPosition: { x: 150, y: 100 },
      goalPosition: { x: 700, y: 200 },
      goalRadius: 25,
      preplacedElements: [],
      preplacedConstraints: [],
      starThresholds: {
        threeStar: { time: 30, steps: 3 },
        twoStar: { time: 60, steps: 6 },
      },
    },
    {
      id: 2,
      name: '滑轮升降',
      description: '加入滑轮，利用绳索改变力的方向',
      availableElements: ['lever', 'pulley', 'anchor', 'rope'],
      maxSteps: 12,
      timeLimit: 120,
      startPosition: { x: 150, y: 80 },
      goalPosition: { x: 700, y: 450 },
      goalRadius: 25,
      preplacedElements: [],
      preplacedConstraints: [],
      starThresholds: {
        threeStar: { time: 40, steps: 4 },
        twoStar: { time: 70, steps: 8 },
      },
    },
    {
      id: 3,
      name: '斜面滑行',
      description: '组合斜面和杠杆，让小球滑向终点',
      availableElements: ['lever', 'incline', 'anchor', 'rope'],
      maxSteps: 10,
      timeLimit: 120,
      startPosition: { x: 100, y: 100 },
      goalPosition: { x: 750, y: 500 },
      goalRadius: 25,
      preplacedElements: [],
      preplacedConstraints: [],
      starThresholds: {
        threeStar: { time: 35, steps: 3 },
        twoStar: { time: 65, steps: 6 },
      },
    },
    {
      id: 4,
      name: '机械联动',
      description: '综合运用杠杆、滑轮和斜面',
      availableElements: ['lever', 'pulley', 'incline', 'anchor', 'rope'],
      maxSteps: 15,
      timeLimit: 120,
      startPosition: { x: 100, y: 80 },
      goalPosition: { x: 780, y: 480 },
      goalRadius: 25,
      preplacedElements: [],
      preplacedConstraints: [],
      starThresholds: {
        threeStar: { time: 50, steps: 5 },
        twoStar: { time: 80, steps: 10 },
      },
    },
    {
      id: 5,
      name: '自由搭建',
      description: '自由发挥，无步数限制',
      availableElements: ['lever', 'pulley', 'incline', 'anchor', 'rope'],
      maxSteps: 999,
      timeLimit: 300,
      startPosition: { x: 100, y: 100 },
      goalPosition: { x: 750, y: 500 },
      goalRadius: 25,
      preplacedElements: [],
      preplacedConstraints: [],
      starThresholds: {
        threeStar: { time: 60, steps: 5 },
        twoStar: { time: 120, steps: 10 },
      },
    },
  ];

  static getLevels(): LevelDefinition[] {
    return this.levels;
  }

  static getLevel(id: number): LevelDefinition | undefined {
    return this.levels.find((l) => l.id === id);
  }

  static getDefaultElementSize(type: BodyType): { width?: number; height?: number; radius?: number } {
    switch (type) {
      case 'lever':
        return { width: 150, height: 12 };
      case 'incline':
        return { width: 180, height: 80 };
      case 'pulley':
        return { radius: 20 };
      case 'anchor':
        return { radius: 10 };
      default:
        return {};
    }
  }

  static createElementBody(element: ElementDefinition): RigidBody {
    return createBody(element);
  }

  static createBallBody(position: Vector2): RigidBody {
    return createBall(position);
  }

  static createRopeConstraint(
    bodyAId: string,
    bodyBId: string,
    anchorA: Vector2,
    anchorB: Vector2,
    length?: number
  ): RopeConstraint {
    const dx = anchorB.x - anchorA.x;
    const dy = anchorB.y - anchorA.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return {
      id: uuidv4(),
      bodyAId,
      bodyBId,
      anchorA: { ...anchorA },
      anchorB: { ...anchorB },
      length: length || Math.max(dist, 20),
      tension: 0,
    };
  }

  static calculateStars(
    level: LevelDefinition,
    elapsedTime: number,
    steps: number
  ): number {
    const { threeStar, twoStar } = level.starThresholds;
    if (elapsedTime <= threeStar.time && steps <= threeStar.steps) return 3;
    if (elapsedTime <= twoStar.time && steps <= twoStar.steps) return 2;
    return 1;
  }
}
