import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeSwitcher from './components/ThemeSwitcher';
import ToolPanel from './components/ToolPanel';
import StatusBar from './components/StatusBar';
import { NeonCanvasRenderer, createSegment } from './CanvasRenderer';
import { NeonAnimationEngine } from './AnimationEngine';
import { eventBus, EVENTS } from './eventBus';
import type { NeonSegment, Point, AnimationMode, Theme } from './types';
import { THEMES } from './types';

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 700;

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<NeonCanvasRenderer | null>(null);
  const engineRef = useRef<NeonAnimationEngine | null>(null);

  const [currentTheme, setCurrentTheme] = useState<Theme>(THEMES[2]);
  const [colorPalette, setColorPalette] = useState<string[]>(THEMES[2].colorPalette);
  const [currentColor, setCurrentColor] = useState<string>('#00D4FF');
  const [animationMode, setAnimationMode] = useState<AnimationMode>('static');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [segmentCount, setSegmentCount] = useState<number>(0);

  const isDrawingRef = useRef<boolean>(false);
  const currentPointsRef = useRef<Point[]>([]);
  const lastMoveTimeRef = useRef<number>(0);
  const segmentsRef = useRef<NeonSegment[]>([]);

  const updateSegmentCountState = useCallback(() => {
    if (rendererRef.current) {
      const segs = rendererRef.current.getSegments();
      setSegmentCount(segs.length);
      if (engineRef.current) {
        engineRef.current.setSegmentCount(segs.length);
      }
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    const renderer = new NeonCanvasRenderer(canvas);
    rendererRef.current = renderer;
    renderer.setBackgroundColor(currentTheme.backgroundColor, 0);

    const engine = new NeonAnimationEngine(0, 'static');
    engineRef.current = engine;

    const playStateHandler = (playing: unknown) => {
      if (typeof playing === 'boolean') {
        setIsPlaying(playing);
      }
    };
    eventBus.on(EVENTS.PLAY_STATE_CHANGED, playStateHandler);

    return () => {
      eventBus.off(EVENTS.PLAY_STATE_CHANGED, playStateHandler);
      engine.dispose();
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setBackgroundColor(currentTheme.backgroundColor, 0.2);
      setColorPalette(currentTheme.colorPalette);
      if (rendererRef.current.getSegments().length > 0) {
        rendererRef.current.setThemeColors(currentTheme.primaryColor, 0.8);
      }
    }
  }, [currentTheme]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setMode(animationMode);
      if (animationMode !== 'static') {
        if (isPlaying) {
          engineRef.current.play();
        }
      }
    }
  }, [animationMode]);

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const point = getCanvasPoint(e);
    isDrawingRef.current = true;
    currentPointsRef.current = [point];
    lastMoveTimeRef.current = performance.now();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;

    const now = performance.now();
    if (now - lastMoveTimeRef.current < 8) return;
    lastMoveTimeRef.current = now;

    const point = getCanvasPoint(e);
    const pts = currentPointsRef.current;
    const last = pts[pts.length - 1];

    if (last) {
      const dx = point.x - last.x;
      const dy = point.y - last.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 3) {
        pts.push(point);
      }
    }
  };

  const handleMouseUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    const pts = currentPointsRef.current;
    if (pts.length >= 2 && rendererRef.current) {
      try {
        const segment = createSegment(pts, currentColor);
        segmentsRef.current = [...segmentsRef.current, segment];
        rendererRef.current.setSegments(segmentsRef.current);
        eventBus.emit(EVENTS.SEGMENT_ADDED, segment);
        updateSegmentCountState();
      } catch (err) {
        console.error('Failed to create segment:', err);
      }
    }

    currentPointsRef.current = [];
  };

  const handleMouseLeave = () => {
    if (isDrawingRef.current) {
      handleMouseUp();
    }
  };

  const handleColorChange = (color: string) => {
    setCurrentColor(color);
    if (rendererRef.current && segmentsRef.current.length > 0) {
      rendererRef.current.setAllSegmentsColor(color, 0.6);
      eventBus.emit(EVENTS.COLOR_CHANGED, color);
    }
  };

  const handleUndo = () => {
    if (rendererRef.current && segmentsRef.current.length > 0) {
      rendererRef.current.fadeOutLastSegment(() => {
        segmentsRef.current = segmentsRef.current.slice(0, -1);
        rendererRef.current!.setSegments([...segmentsRef.current]);
        eventBus.emit(EVENTS.SEGMENT_REMOVED);
        updateSegmentCountState();
      });
    }
  };

  const handleClear = () => {
    if (rendererRef.current && segmentsRef.current.length > 0) {
      rendererRef.current.collapseAll(() => {
        segmentsRef.current = [];
        rendererRef.current!.setSegments([]);
        updateSegmentCountState();
      });
    }
  };

  const handleModeChange = (mode: AnimationMode) => {
    setAnimationMode(mode);
    if (mode !== 'static') {
      setTimeout(() => {
        if (engineRef.current) {
          engineRef.current.play();
        }
      }, 50);
    }
  };

  const handleTogglePlay = () => {
    if (!engineRef.current) return;

    if (isPlaying) {
      engineRef.current.pause();
    } else {
      engineRef.current.play();
    }
  };

  const handleThemeChange = (theme: Theme) => {
    setCurrentTheme(theme);
    eventBus.emit(EVENTS.THEME_CHANGED, theme);
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#0A0A0A',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minWidth: 1400
      }}
    >
      <ThemeSwitcher
        currentThemeId={currentTheme.id}
        onThemeChange={handleThemeChange}
      />

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          gap: 24,
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <div
          style={{
            height: CANVAS_HEIGHT,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start'
          }}
        >
          <ToolPanel
            colorPalette={colorPalette}
            currentColor={currentColor}
            onColorChange={handleColorChange}
            onUndo={handleUndo}
            onClear={handleClear}
            animationMode={animationMode}
            onModeChange={handleModeChange}
          />
        </div>

        <div
          style={{
            position: 'relative',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: `0 0 40px ${currentTheme.primaryColor}20, 0 0 80px rgba(0,0,0,0.6)`,
            border: `1px solid ${currentTheme.primaryColor}30`
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTheme.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'absolute',
                inset: -2,
                borderRadius: 18,
                background: `linear-gradient(135deg, ${currentTheme.primaryColor}40 0%, transparent 50%, ${currentTheme.glowColor}40 100%)`,
                filter: 'blur(12px)',
                zIndex: -1,
                opacity: 0.6
              }}
            />
          </AnimatePresence>

          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            style={{
              width: CANVAS_WIDTH,
              height: CANVAS_HEIGHT,
              display: 'block',
              cursor: 'crosshair'
            }}
          />

          {segmentCount === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                gap: 16
              }}
            >
              <motion.div
                animate={{
                  opacity: [0.3, 0.7, 0.3],
                  y: [0, -4, 0]
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                style={{
                  fontSize: 48,
                  filter: `drop-shadow(0 0 20px ${currentTheme.primaryColor})`
                }}
              >
                ✨
              </motion.div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#666666',
                  letterSpacing: 2
                }}
              >
                在画布上自由绘制，创造你的霓虹灯作品
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: '#444444',
                  letterSpacing: 1
                }}
              >
                提示：绘制多段线条后切换动画模式查看动态效果
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <StatusBar
        segmentCount={segmentCount}
        animationMode={animationMode}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
      />
    </div>
  );
};

export default App;
