import { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { PatternParams, BaseShape, SymmetryType } from '@/types/pattern';
import { generateColorPalette } from '@/utils/colorSchemes';

export interface PatternCanvasRef {
  exportPNG: () => Promise<string | null>;
  getCanvas: () => HTMLCanvasElement | null;
  resize: (width: number, height: number) => void;
}

interface PatternCanvasProps {
  params: PatternParams;
}

const PatternCanvas = forwardRef<PatternCanvasRef, PatternCanvasProps>(({ params }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const patternContainerRef = useRef<PIXI.Container | null>(null);
  const graphicsPoolRef = useRef<PIXI.Graphics[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const rotationRef = useRef<number>(0);
  const isDraggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const viewportRef = useRef({ scale: 1, x: 0, y: 0 });
  const lastParamsRef = useRef<PatternParams | null>(null);

  const drawShape = useCallback((
    graphics: PIXI.Graphics,
    shape: BaseShape,
    size: number,
    color: number,
    rotation: number
  ) => {
    graphics.clear();
    graphics.beginFill(color);
    graphics.rotation = rotation * Math.PI / 180;

    switch (shape) {
      case 'circle':
        graphics.drawCircle(0, 0, size);
        break;
      case 'triangle': {
        const h = size * Math.sqrt(3) / 2;
        graphics.moveTo(0, -size * 2 / 3);
        graphics.lineTo(-size / 2, h - size * 2 / 3);
        graphics.lineTo(size / 2, h - size * 2 / 3);
        graphics.closePath();
        break;
      }
      case 'hexagon': {
        graphics.moveTo(0, -size);
        for (let i = 1; i < 6; i++) {
          const angle = (i * 60 - 90) * Math.PI / 180;
          graphics.lineTo(Math.cos(angle) * size, Math.sin(angle) * size);
        }
        graphics.closePath();
        break;
      }
      case 'spiral': {
        graphics.endFill();
        graphics.lineStyle(3, color, 1);
        const turns = 3;
        const steps = 60;
        let first = true;
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const angle = t * turns * Math.PI * 2;
          const r = t * size;
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;
          if (first) {
            graphics.moveTo(x, y);
            first = false;
          } else {
            graphics.lineTo(x, y);
          }
        }
        return;
      }
    }

    graphics.endFill();
  }, []);

  const applySymmetry = useCallback((
    container: PIXI.Container,
    graphics: PIXI.Graphics,
    symmetryType: SymmetryType,
    complexity: number,
    size: number
  ) => {
    while (container.children.length > 0) {
      const child = container.children[0];
      container.removeChild(child);
      if (child instanceof PIXI.Graphics) {
        graphicsPoolRef.current.push(child);
      }
    }

    const getGraphics = (): PIXI.Graphics => {
      if (graphicsPoolRef.current.length > 0) {
        return graphicsPoolRef.current.pop()!;
      }
      return new PIXI.Graphics();
    };

    switch (symmetryType) {
      case 'rotation': {
        const count = complexity + 3;
        const angleStep = (Math.PI * 2) / count;
        const dist = size * 0.3;

        for (let i = 0; i < count; i++) {
          const g = getGraphics();
          g.copyFrom(graphics);
          g.x = Math.cos(angleStep * i - Math.PI / 2) * dist;
          g.y = Math.sin(angleStep * i - Math.PI / 2) * dist;
          g.rotation = angleStep * i;
          container.addChild(g);
        }
        break;
      }

      case 'reflection': {
        const g1 = getGraphics();
        g1.copyFrom(graphics);
        container.addChild(g1);

        const g2 = getGraphics();
        g2.copyFrom(graphics);
        g2.scale.x = -1;
        container.addChild(g2);

        const children = [...container.children];
        children.forEach((child) => {
          const g = getGraphics();
          g.copyFrom(child as PIXI.Graphics);
          g.scale.y *= -1;
          container.addChild(g);
        });
        break;
      }

      case 'translation': {
        const count = Math.floor(complexity / 2) + 2;
        const spacing = (size * 2) / count;

        for (let row = -count; row <= count; row++) {
          for (let col = -count; col <= count; col++) {
            const g = getGraphics();
            g.copyFrom(graphics);
            const offsetX = col * spacing + (row % 2 === 0 ? 0 : spacing / 2);
            const offsetY = row * spacing * 0.866;
            g.x = offsetX;
            g.y = offsetY;
            container.addChild(g);
          }
        }
        break;
      }
    }
  }, []);

  const redrawPattern = useCallback(() => {
    if (!appRef.current || !patternContainerRef.current) return;

    const { symmetryType, baseShape, colorScheme, complexity, baseColors } = params;

    const canvasWidth = appRef.current.screen.width;
    const canvasHeight = appRef.current.screen.height;
    const size = Math.min(canvasWidth, canvasHeight) * 0.4;

    const palette = generateColorPalette(baseColors, colorScheme, Math.max(complexity * 2, 5));

    const baseGraphics = new PIXI.Graphics();
    const layers = Math.min(complexity, 15);

    const tempContainer = new PIXI.Container();

    for (let i = 0; i < layers; i++) {
      const t = i / Math.max(layers - 1, 1);
      const shapeSize = size * (1 - t * 0.7);
      const colorHex = palette[i % palette.length];
      const colorNum = parseInt(colorHex.replace('#', ''), 16);
      const rotation = t * 180;

      const g = new PIXI.Graphics();
      drawShape(g, baseShape, Math.max(shapeSize, 5), colorNum, rotation);

      applySymmetry(tempContainer, g, symmetryType, complexity, size);

      g.destroy();
    }

    while (patternContainerRef.current.children.length > 0) {
      const child = patternContainerRef.current.children[0];
      patternContainerRef.current.removeChild(child);
      if (child instanceof PIXI.Graphics) {
        graphicsPoolRef.current.push(child);
      }
    }

    while (tempContainer.children.length > 0) {
      const child = tempContainer.children[0];
      tempContainer.removeChild(child);
      patternContainerRef.current.addChild(child);
    }

    lastParamsRef.current = { ...params };
  }, [params, drawShape, applySymmetry]);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const app = new PIXI.Application({
      width,
      height,
      backgroundColor: parseInt(params.backgroundColor.replace('#', ''), 16),
      antialias: true,
      resolution: Math.min(window.devicePixelRatio, 2),
      autoDensity: true,
    });

    containerRef.current.appendChild(app.view as HTMLCanvasElement);
    appRef.current = app;

    const patternContainer = new PIXI.Container();
    patternContainer.x = width / 2;
    patternContainer.y = height / 2;
    app.stage.addChild(patternContainer);
    patternContainerRef.current = patternContainer;

    viewportRef.current = { scale: 1, x: width / 2, y: height / 2 };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!appRef.current || !patternContainerRef.current) return;

      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.5, Math.min(3, viewportRef.current.scale * delta));

      const rect = containerRef.current!.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const oldScale = viewportRef.current.scale;
      const scaleDiff = newScale / oldScale;

      viewportRef.current.x = mouseX - (mouseX - viewportRef.current.x) * scaleDiff;
      viewportRef.current.y = mouseY - (mouseY - viewportRef.current.y) * scaleDiff;
      viewportRef.current.scale = newScale;

      patternContainerRef.current.scale.set(newScale);
      patternContainerRef.current.x = viewportRef.current.x;
      patternContainerRef.current.y = viewportRef.current.y;
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      lastPosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !patternContainerRef.current) return;

      const dx = e.clientX - lastPosRef.current.x;
      const dy = e.clientY - lastPosRef.current.y;

      viewportRef.current.x += dx;
      viewportRef.current.y += dy;
      patternContainerRef.current.x = viewportRef.current.x;
      patternContainerRef.current.y = viewportRef.current.y;

      lastPosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const canvas = app.view as HTMLCanvasElement;
    canvas.style.cursor = 'grab';
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    let lastTime = 0;
    const animate = (time: number) => {
      animationFrameRef.current = requestAnimationFrame(animate);

      if (patternContainerRef.current && params.rotationSpeed > 0) {
        const deltaTime = (time - lastTime) / 1000;
        lastTime = time;

        const degreesPerSecond = params.rotationSpeed * 72;
        rotationRef.current += degreesPerSecond * deltaTime;
        patternContainerRef.current.rotation = rotationRef.current * Math.PI / 180;
      }
    };
    animationFrameRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!containerRef.current || !appRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      appRef.current.renderer.resize(newWidth, newHeight);
      redrawPattern();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      app.destroy(true);
      appRef.current = null;
      graphicsPoolRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (appRef.current) {
      appRef.current.renderer.backgroundColor = parseInt(
        params.backgroundColor.replace('#', ''),
        16
      );
    }
  }, [params.backgroundColor]);

  useEffect(() => {
    const timer = setTimeout(() => {
      redrawPattern();
    }, 16);

    return () => clearTimeout(timer);
  }, [params.symmetryType, params.baseShape, params.colorScheme, params.complexity, params.baseColors, redrawPattern]);

  useImperativeHandle(ref, () => ({
    exportPNG: async (): Promise<string | null> => {
      if (!appRef.current) return null;

      const canvas = appRef.current.view as HTMLCanvasElement;
      return canvas.toDataURL('image/png');
    },

    getCanvas: (): HTMLCanvasElement | null => {
      if (!appRef.current) return null;
      return appRef.current.view as HTMLCanvasElement;
    },

    resize: (width: number, height: number) => {
      if (appRef.current) {
        appRef.current.renderer.resize(width, height);
        redrawPattern();
      }
    },
  }));

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden"
      style={{ touchAction: 'none' }}
    />
  );
});

PatternCanvas.displayName = 'PatternCanvas';

export default PatternCanvas;
