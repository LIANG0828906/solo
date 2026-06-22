import { ICellOrganelle, CELL_RADIUS } from './CellTypes';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randomPositionInCell(maxRadius: number): [number, number, number] {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const r = Math.random() * maxRadius * 0.7;
  return [
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi)
  ];
}

export function initOrganelles(): ICellOrganelle[] {
  const organelles: ICellOrganelle[] = [];

  organelles.push({
    id: generateId(),
    name: '细胞膜',
    type: 'membrane',
    position: [0, 0, 0],
    radius: CELL_RADIUS,
    color: '#88CCFF',
    emissive: '#88CCFF',
    emissiveIntensity: 0.3,
    rotation: [0, 0, 0],
    rotationSpeed: [0, 0.1, 0],
    opacity: 0.2
  });

  organelles.push({
    id: generateId(),
    name: '细胞核',
    type: 'nucleus',
    position: [0, 0, 0],
    radius: 1,
    color: '#FF6B6B',
    emissive: '#FF6B6B',
    emissiveIntensity: 0.5,
    rotation: [0, 0, 0],
    rotationSpeed: [0.2, 0.15, 0.1],
    pulsePhase: 0,
    pulseSpeed: 1.5
  });

  const mitochondriaCount = 2;
  for (let i = 0; i < mitochondriaCount; i++) {
    organelles.push({
      id: generateId(),
      name: `线粒体 ${i + 1}`,
      type: 'mitochondria',
      position: randomPositionInCell(CELL_RADIUS),
      radius: 0.4,
      color: '#FFD93D',
      emissive: '#FFD93D',
      emissiveIntensity: 0.4,
      rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0],
      rotationSpeed: [
        randomInRange(0.1, 0.3),
        randomInRange(0.1, 0.3),
        randomInRange(0.1, 0.3)
      ]
    });
  }

  organelles.push({
    id: generateId(),
    name: '高尔基体',
    type: 'golgi',
    position: randomPositionInCell(CELL_RADIUS),
    radius: 0.8,
    color: '#6BCB77',
    emissive: '#6BCB77',
    emissiveIntensity: 0.4,
    rotation: [0, Math.random() * Math.PI, 0],
    rotationSpeed: [0.05, 0.1, 0.05]
  });

  organelles.push({
    id: generateId(),
    name: '内质网',
    type: 'er',
    position: randomPositionInCell(CELL_RADIUS),
    radius: 1.2,
    color: '#4F8FD3',
    emissive: '#4F8FD3',
    emissiveIntensity: 0.3,
    rotation: [0, 0, 0],
    rotationSpeed: [0.05, 0.08, 0.03]
  });

  organelles.push({
    id: generateId(),
    name: '液泡',
    type: 'vacuole',
    position: randomPositionInCell(CELL_RADIUS),
    radius: 0.6,
    color: '#9B59B6',
    emissive: '#9B59B6',
    emissiveIntensity: 0.4,
    rotation: [0, 0, 0],
    rotationSpeed: [0.1, 0.15, 0.1]
  });

  return organelles;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function updatePositions(
  organelles: ICellOrganelle[],
  animationProgress: number
): ICellOrganelle[] {
  if (animationProgress <= 0) {
    return organelles;
  }

  const cellOffset = 0;
  const stretchPhase = Math.min(animationProgress * 2, 1);
  const splitPhase = Math.max(0, Math.min((animationProgress - 0.5) * 2, 1));
  const separatePhase = Math.max(0, Math.min((animationProgress - 0.75) * 4, 1));
  const resetPhase = Math.max(0, Math.min((animationProgress - 0.875) * 8, 1));

  return organelles.map((org) => {
    if (org.type === 'membrane') {
      let scaleX = 1;
      let scaleY = 1;
      let scaleZ = 1;
      let opacity = org.opacity || 0.2;

      if (resetPhase > 0) {
        const t = easeInOutCubic(resetPhase);
        scaleX = lerp(2, 1, t);
        scaleY = lerp(0.7, 1, t);
        scaleZ = lerp(0.7, 1, t);
        opacity = lerp(0.1, 0.2, t);
      } else if (separatePhase > 0) {
        const t = easeInOutCubic(separatePhase);
        scaleX = 2;
        scaleY = 0.7;
        scaleZ = 0.7;
        opacity = 0.1;
      } else if (splitPhase > 0) {
        const t = easeInOutCubic(splitPhase);
        scaleX = lerp(1.8, 2, t);
        scaleY = lerp(1, 0.7, t);
        scaleZ = lerp(0.7, 0.7, t);
        opacity = lerp(0.2, 0.1, t);
      } else if (stretchPhase > 0) {
        const t = easeInOutCubic(stretchPhase);
        scaleX = lerp(1, 1.8, t);
        scaleZ = lerp(1, 0.7, t);
      }

      return {
        ...org,
        scale: [scaleX, scaleY, scaleZ],
        opacity
      };
    }

    if (org.type === 'nucleus') {
      let pos: [number, number, number] = [0, 0, 0];

      if (resetPhase > 0) {
        const t = easeInOutCubic(resetPhase);
        pos = [0, 0, 0];
      } else if (separatePhase > 0) {
        const t = easeInOutCubic(separatePhase);
        const offset = lerp(0, 3, t);
        if (org.cellIndex === 0) {
          pos = [-offset, 0, 0];
        } else {
          pos = [0, 0, 0];
        }
      } else if (splitPhase > 0) {
        const t = easeInOutCubic(splitPhase);
        const offset = lerp(0, 1.5, t);
        pos = [-offset, 0, 0];
      }

      return {
        ...org,
        position: pos,
        targetPosition: pos
      };
    }

    let newPosition = [...org.position] as [number, number, number];

    if (resetPhase > 0) {
      const t = easeInOutCubic(resetPhase);
      const origPos = org.targetPosition || org.position;
      newPosition = [
        lerp(org.position[0], origPos[0], t),
        lerp(org.position[1], origPos[1], t),
        lerp(org.position[2], origPos[2], t)
      ];
    } else if (separatePhase > 0) {
      const t = easeInOutCubic(separatePhase);
      const offset = lerp(0, 3, t);
      if (org.cellIndex === 0) {
        newPosition = [
          org.position[0] - offset,
          org.position[1],
          org.position[2]
        ];
      }
    } else if (splitPhase > 0) {
      const t = easeInOutCubic(splitPhase);
      const offset = lerp(0, 1.5, t);
      if (org.cellIndex === 0) {
        newPosition = [
          org.position[0] - offset,
          org.position[1],
          org.position[2]
        ];
      }
    }

    return {
      ...org,
      position: newPosition
    };
  });
}
