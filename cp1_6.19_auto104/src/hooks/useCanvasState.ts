import { useState, useCallback, useRef, useEffect } from 'react';
import { parsePrompt, generateColorVariants, type ParsedPrompt } from '../utils/promptParser';

export interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
  velocity: { x: number; y: number };
  jitter: { amplitude: number; period: number; phase: number };
  originalColor: string;
  hoverScale: number;
  targetHoverScale: number;
}

export interface Shape {
  type: 'circle' | 'wave' | 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  gradient?: { start: string; end: string };
  rotation: number;
}

export interface Transform {
  x: number;
  y: number;
  scale: number;
  targetX: number;
  targetY: number;
  targetScale: number;
}

export interface ColorVariant {
  id: string;
  colors: string[];
}

export interface CanvasState {
  particles: Particle[];
  shapes: Shape[];
  colors: string[];
  transform: Transform;
  prompt: string;
  parsedPrompt: ParsedPrompt | null;
  colorVariants: ColorVariant[];
  selectedColorIndex: number | null;
  isGenerated: boolean;
}

const DEFAULT_COLORS = ['#1A1A2E', '#16213E', '#0F3460', '#533483', '#E94560'];

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function generateParticles(
  count: number,
  colors: string[],
  sizeRange: [number, number],
  speedRange: [number, number],
  opacityRange: [number, number],
  canvasWidth: number,
  canvasHeight: number
): Particle[] {
  const particles: Particle[] = [];

  for (let i = 0; i < count; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    const speed = randomInRange(speedRange[0], speedRange[1]);
    const angle = Math.random() * Math.PI * 2;

    particles.push({
      x: Math.random() * canvasWidth,
      y: Math.random() * canvasHeight,
      size: randomInRange(sizeRange[0], sizeRange[1]),
      color,
      originalColor: color,
      opacity: randomInRange(opacityRange[0], opacityRange[1]),
      velocity: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      },
      jitter: {
        amplitude: 3,
        period: 0.5,
        phase: Math.random() * Math.PI * 2,
      },
      hoverScale: 1,
      targetHoverScale: 1,
    });
  }

  return particles;
}

function generateShapes(
  count: number,
  types: ('circle' | 'wave' | 'rect')[],
  colors: string[],
  canvasWidth: number,
  canvasHeight: number
): Shape[] {
  const shapes: Shape[] = [];

  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const colorIndex = Math.floor(Math.random() * colors.length);
    const color = colors[colorIndex];
    const gradientIndex = (colorIndex + 1) % colors.length;

    shapes.push({
      type,
      x: Math.random() * canvasWidth,
      y: Math.random() * canvasHeight,
      width: randomInRange(50, 200),
      height: randomInRange(30, 150),
      color,
      gradient: {
        start: color,
        end: colors[gradientIndex],
      },
      rotation: Math.random() * Math.PI * 2,
    });
  }

  return shapes;
}

export function useCanvasState(canvasWidth: number, canvasHeight: number) {
  const [state, setState] = useState<CanvasState>({
    particles: [],
    shapes: [],
    colors: DEFAULT_COLORS,
    transform: {
      x: 0,
      y: 0,
      scale: 1,
      targetX: 0,
      targetY: 0,
      targetScale: 1,
    },
    prompt: '',
    parsedPrompt: null,
    colorVariants: [],
    selectedColorIndex: null,
    isGenerated: false,
  });

  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const generateFromPrompt = useCallback(
    (prompt: string) => {
      const parsed = parsePrompt(prompt);
      const particles = generateParticles(
        parsed.particles.count,
        parsed.colors,
        parsed.particles.sizeRange,
        parsed.particles.speedRange,
        parsed.particles.opacityRange,
        canvasWidth,
        canvasHeight
      );
      const shapes = generateShapes(
        parsed.shapes.count,
        parsed.shapes.types,
        parsed.colors,
        canvasWidth,
        canvasHeight
      );

      const variants = generateColorVariants(parsed.colors, 5).map((colors, i) => ({
        id: `variant-${i}`,
        colors,
      }));

      setState(prev => ({
        ...prev,
        particles,
        shapes,
        colors: parsed.colors,
        prompt,
        parsedPrompt: parsed,
        colorVariants: variants,
        selectedColorIndex: null,
        isGenerated: true,
        transform: {
          ...prev.transform,
          targetX: 0,
          targetY: 0,
          targetScale: 1,
        },
      }));
    },
    [canvasWidth, canvasHeight]
  );

  const resetCanvas = useCallback(() => {
    setState({
      particles: [],
      shapes: [],
      colors: DEFAULT_COLORS,
      transform: {
        x: 0,
        y: 0,
        scale: 1,
        targetX: 0,
        targetY: 0,
        targetScale: 1,
      },
      prompt: '',
      parsedPrompt: null,
      colorVariants: [],
      selectedColorIndex: null,
      isGenerated: false,
    });
  }, []);

  const setTransformTarget = useCallback((target: { x?: number; y?: number; scale?: number }) => {
    setState(prev => ({
      ...prev,
      transform: {
        ...prev.transform,
        targetX: target.x !== undefined ? target.x : prev.transform.targetX,
        targetY: target.y !== undefined ? target.y : prev.transform.targetY,
        targetScale: target.scale !== undefined
          ? Math.max(0.5, Math.min(3, target.scale))
          : prev.transform.targetScale,
      },
    }));
  }, []);

  const applyColorVariant = useCallback((variantId: string) => {
    setState(prev => {
      const variant = prev.colorVariants.find(v => v.id === variantId);
      if (!variant) return prev;

      const newParticles = prev.particles.map((particle, i) => {
        const newColor = variant.colors[i % variant.colors.length];
        return {
          ...particle,
          color: newColor,
          originalColor: newColor,
        };
      });

      const newShapes = prev.shapes.map((shape, i) => ({
        ...shape,
        color: variant.colors[i % variant.colors.length],
        gradient: shape.gradient
          ? {
              start: variant.colors[i % variant.colors.length],
              end: variant.colors[(i + 1) % variant.colors.length],
            }
          : undefined,
      }));

      const newVariants = generateColorVariants(variant.colors, 5).map((colors, i) => ({
        id: `variant-${Date.now()}-${i}`,
        colors,
      }));

      return {
        ...prev,
        particles: newParticles,
        shapes: newShapes,
        colors: variant.colors,
        colorVariants: newVariants,
        selectedColorIndex: null,
      };
    });
  }, []);

  const generateNewVariants = useCallback(() => {
    setState(prev => {
      const variants = generateColorVariants(prev.colors, 5).map((colors, i) => ({
        id: `variant-${Date.now()}-${i}`,
        colors,
      }));
      return {
        ...prev,
        colorVariants: variants,
      };
    });
  }, []);

  const selectColor = useCallback((index: number | null) => {
    setState(prev => ({
      ...prev,
      selectedColorIndex: index,
    }));
  }, []);

  const updateSelectedColor = useCallback((newColor: string) => {
    setState(prev => {
      if (prev.selectedColorIndex === null) return prev;

      const index = prev.selectedColorIndex;
      const newColors = [...prev.colors];
      newColors[index] = newColor;

      const newParticles = prev.particles.map(particle => {
        const colorIndex = prev.colors.indexOf(particle.originalColor);
        if (colorIndex === index) {
          return {
            ...particle,
            color: newColor,
            originalColor: newColor,
          };
        }
        return particle;
      });

      const newShapes = prev.shapes.map(shape => {
        const colorIndex = prev.colors.indexOf(shape.color);
        if (colorIndex === index) {
          return {
            ...shape,
            color: newColor,
            gradient: shape.gradient
              ? {
                  start: newColor,
                  end: shape.gradient.end,
                }
              : undefined,
          };
        }
        if (shape.gradient) {
          const endIndex = prev.colors.indexOf(shape.gradient.end);
          if (endIndex === index) {
            return {
              ...shape,
              gradient: {
                start: shape.gradient.start,
                end: newColor,
              },
            };
          }
        }
        return shape;
      });

      return {
        ...prev,
        colors: newColors,
        particles: newParticles,
        shapes: newShapes,
      };
    });
  }, []);

  const setParticleHover = useCallback((particleIndex: number, isHovered: boolean) => {
    setState(prev => {
      if (particleIndex < 0 || particleIndex >= prev.particles.length) return prev;

      const newParticles = [...prev.particles];
      newParticles[particleIndex] = {
        ...newParticles[particleIndex],
        targetHoverScale: isHovered ? 1.5 : 1,
        color: isHovered ? '#FFFFFF' : newParticles[particleIndex].originalColor,
      };

      return {
        ...prev,
        particles: newParticles,
      };
    });
  }, []);

  const updateParticles = useCallback((deltaTime: number) => {
    setState(prev => {
      if (!prev.isGenerated) return prev;

      const newParticles = prev.particles.map(particle => {
        let newX = particle.x + particle.velocity.x * deltaTime * 60;
        let newY = particle.y + particle.velocity.y * deltaTime * 60;

        const jitterOffset = Math.sin(
          (Date.now() / 1000 / particle.jitter.period) * Math.PI * 2 + particle.jitter.phase
        ) * particle.jitter.amplitude;
        newX += jitterOffset * 0.1;
        newY += jitterOffset * 0.1;

        if (newX < -50) newX = canvasWidth + 50;
        if (newX > canvasWidth + 50) newX = -50;
        if (newY < -50) newY = canvasHeight + 50;
        if (newY > canvasHeight + 50) newY = -50;

        const hoverDiff = particle.targetHoverScale - particle.hoverScale;
        const newHoverScale = particle.hoverScale + hoverDiff * deltaTime * 10;

        return {
          ...particle,
          x: newX,
          y: newY,
          hoverScale: newHoverScale,
        };
      });

      const transformDiff = {
        x: prev.transform.targetX - prev.transform.x,
        y: prev.transform.targetY - prev.transform.y,
        scale: prev.transform.targetScale - prev.transform.scale,
      };

      const newTransform = {
        ...prev.transform,
        x: prev.transform.x + transformDiff.x * deltaTime * 5,
        y: prev.transform.y + transformDiff.y * deltaTime * 5,
        scale: prev.transform.scale + transformDiff.scale * deltaTime * 5,
      };

      return {
        ...prev,
        particles: newParticles,
        transform: newTransform,
      };
    });
  }, [canvasWidth, canvasHeight]);

  useEffect(() => {
    const animate = (time: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = time;
      }
      const deltaTime = Math.min((time - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = time;

      updateParticles(deltaTime);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [updateParticles]);

  return {
    state,
    generateFromPrompt,
    resetCanvas,
    setTransformTarget,
    applyColorVariant,
    generateNewVariants,
    selectColor,
    updateSelectedColor,
    setParticleHover,
  };
}
