import {
  Block,
  AnimationSequence,
  ComputedShapeState,
  ShapeParams,
  AnimationParams,
  AnimationTypes,
  ShapeTypes
} from '../types';

const TRANSITION_GAP = 200;

export const easeInOutQuad = (t: number): number => {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
};

export const linearInterpolate = (a: number, b: number, t: number): number => {
  return a + (b - a) * t;
};

export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : { r: 255, g: 255, b: 255 };
};

export const rgbToHex = (r: number, g: number, b: number): string => {
  return (
    '#' +
    [r, g, b]
      .map(x => {
        const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
};

export const interpolateColor = (color1: string, color2: string, t: number): string => {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  return rgbToHex(
    linearInterpolate(c1.r, c2.r, t),
    linearInterpolate(c1.g, c2.g, t),
    linearInterpolate(c1.b, c2.b, t)
  );
};

export interface AnimationFrameData {
  shapeStates: Map<string, ComputedShapeState>;
  sequenceProgress: Map<string, number>;
}

const getBaseState = (shapeBlock: Block): ComputedShapeState => {
  const params = shapeBlock.params as ShapeParams & { _baseX?: number; _baseY?: number };
  return {
    id: shapeBlock.id,
    x: params._baseX ?? 200,
    y: params._baseY ?? 200,
    rotation: 0,
    scale: 1,
    fill: params.fill || '#e94560',
    opacity: 1
  };
};

const applyAnimationEffect = (
  state: ComputedShapeState,
  animBlock: Block,
  progress: number,
  degraded: boolean
): ComputedShapeState => {
  const params = animBlock.params as AnimationParams;
  const eased = degraded ? progress : easeInOutQuad(progress);

  switch (animBlock.animationType) {
    case AnimationTypes.MOVE:
      return {
        ...state,
        x: state.x + (params.dx ?? 0) * eased,
        y: state.y + (params.dy ?? 0) * eased
      };

    case AnimationTypes.ROTATE:
      return {
        ...state,
        rotation: state.rotation + (params.angle ?? 0) * eased
      };

    case AnimationTypes.SCALE: {
      const factor = params.factor ?? 1;
      if (factor >= 1) {
        return {
          ...state,
          scale: state.scale * (1 + (factor - 1) * eased)
        };
      } else {
        return {
          ...state,
          scale: state.scale * (1 - (1 - factor) * eased)
        };
      }
    }

    case AnimationTypes.COLOR: {
      const targetColor = params.targetColor ?? state.fill;
      return {
        ...state,
        fill: interpolateColor(state.fill, targetColor, eased)
      };
    }

    case AnimationTypes.BLINK: {
      const frequency = params.frequency ?? 2;
      const blinkT = Math.sin(progress * Math.PI * 2 * frequency * (animBlock.params as any).duration / 1000);
      const opacity = 0.3 + 0.7 * Math.abs(blinkT);
      return {
        ...state,
        opacity: degraded ? (progress > 0.5 ? 0.5 : 1) : opacity
      };
    }

    default:
      return state;
  }
};

const getTotalAnimationDuration = (animations: Block[]): number => {
  return animations.reduce((total, anim) => {
    const params = anim.params as AnimationParams;
    return total + params.duration * params.repeat + TRANSITION_GAP;
  }, 0);
};

export const computeAnimationFrame = (
  blocks: Block[],
  sequences: AnimationSequence[],
  currentTime: number,
  degraded: boolean = false
): AnimationFrameData => {
  const shapeStates = new Map<string, ComputedShapeState>();
  const sequenceProgress = new Map<string, number>();

  const shapeBlocks = blocks.filter(b => b.type === 'shape');

  for (const shapeBlock of shapeBlocks) {
    let state = getBaseState(shapeBlock);

    const seq = sequences.find(s => s.shapeId === shapeBlock.id);
    const animationIds = seq?.animationIds ?? [];
    const animations = animationIds
      .map(id => blocks.find(b => b.id === id))
      .filter((b): b is Block => b !== undefined);

    if (animations.length === 0) {
      shapeStates.set(shapeBlock.id, state);
      sequenceProgress.set(shapeBlock.id, 0);
      continue;
    }

    const totalDuration = getTotalAnimationDuration(animations);
    const loopedTime = totalDuration > 0 ? currentTime % totalDuration : 0;
    sequenceProgress.set(shapeBlock.id, totalDuration > 0 ? loopedTime / totalDuration : 0);

    let remainingTime = loopedTime;

    for (const animBlock of animations) {
      const params = animBlock.params as AnimationParams;
      const fullDuration = params.duration * params.repeat;
      const animTotalDuration = fullDuration + TRANSITION_GAP;

      if (remainingTime < fullDuration) {
        const progressInAnim = remainingTime / params.duration;
        const cycleIndex = Math.floor(progressInAnim);
        const localProgress = progressInAnim - cycleIndex;

        if (cycleIndex < params.repeat) {
          state = applyAnimationEffect(state, animBlock, localProgress, degraded);
        }
        break;
      } else if (remainingTime < animTotalDuration) {
        state = applyAnimationEffect(state, animBlock, 1, degraded);
        break;
      } else {
        state = applyAnimationEffect(state, animBlock, 1, degraded);
        remainingTime -= animTotalDuration;
      }
    }

    shapeStates.set(shapeBlock.id, state);
  }

  return { shapeStates, sequenceProgress };
};

export const getShapeCenter = (block: Block, state: ComputedShapeState): { cx: number; cy: number } => {
  const params = block.params as ShapeParams;

  switch (block.shapeType) {
    case ShapeTypes.CIRCLE:
      return { cx: state.x, cy: state.y };
    case ShapeTypes.RECTANGLE:
      return {
        cx: state.x + (params.width ?? 0) / 2,
        cy: state.y + (params.height ?? 0) / 2
      };
    case ShapeTypes.TRIANGLE: {
      const side = params.sideLength ?? 80;
      return {
        cx: state.x + side / 2,
        cy: state.y + (side * Math.sqrt(3)) / 4
      };
    }
    case ShapeTypes.STAR:
      return { cx: state.x, cy: state.y };
    default:
      return { cx: state.x, cy: state.y };
  }
};
