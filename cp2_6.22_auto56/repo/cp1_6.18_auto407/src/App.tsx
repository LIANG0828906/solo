import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Toolbar, SettingsDrawer, TrainingPanel, RecognitionBadge } from './uiController';
import { useAppStore } from './store';
import { AnimationEngine } from './animationEngine';
import { recognizeGesture, realtimeMatchProgress } from './gestureEngine';
import { CANVAS_CONFIG, Point, GestureType, AnimationType } from './types';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animEngineRef = useRef<AnimationEngine | null>(null);
  const rafRef = useRef<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [hintFade, setHintFade] = useState(false);
  const [currentPathPoints, setCurrentPathPoints] = useState<Point[]>([]);
  const [recognitionKey, setRecognitionKey] = useState(0);
  const hintTimerRef = useRef<number | null>(null);

  const {
    isTrainingMode,
    currentGesture,
    currentAnimation,
    lastRecognitionConfidence,
    customTemplates,
    trainingSelectedTemplate,
    customTextForFlash,
    getAnimationForGesture,
    setCurrentRecognition,
    addCustomTemplate,
    setMatchPercentage,
  } = useAppStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const setupCanvas = () => {
      const rect = wrapper.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (!animEngineRef.current) {
          animEngineRef.current = new AnimationEngine(ctx, rect.width, rect.height);
          animEngineRef.current.start();
        } else {
          animEngineRef.current.setSize(rect.width, rect.height);
        }
      }
    };

    setupCanvas();
    const ro = new ResizeObserver(setupCanvas);
    ro.observe(wrapper);

    return () => {
      ro.disconnect();
      if (animEngineRef.current) {
        animEngineRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    hintTimerRef.current = window.setTimeout(() => {
      setHintFade(true);
      window.setTimeout(() => setShowHint(false), 400);
    }, 4500);
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, []);

  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      timestamp: performance.now(),
    };
  };

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!animEngineRef.current) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      const p = getCanvasPoint(e);
      if (!p) return;

      setIsDrawing(true);
      animEngineRef.current.beginPathDrawing();
      animEngineRef.current.addPathPoint(p);
      setCurrentPathPoints([p]);
      setMatchPercentage(0);

      setShowHint(false);
    },
    [setMatchPercentage]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing || !animEngineRef.current) return;
      const p = getCanvasPoint(e);
      if (!p) return;

      animEngineRef.current.addPathPoint(p);
      setCurrentPathPoints((prev) => {
        const next = [...prev, p];
        if (isTrainingMode && trainingSelectedTemplate && next.length % 4 === 0) {
          const prog = realtimeMatchProgress(next, trainingSelectedTemplate);
          setMatchPercentage(prog);
        }
        return next;
      });
    },
    [isDrawing, isTrainingMode, trainingSelectedTemplate, setMatchPercentage]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!animEngineRef.current) return;
      e.currentTarget.releasePointerCapture?.(e.pointerId);
      const finalP = getCanvasPoint(e);
      if (finalP && isDrawing) {
        animEngineRef.current.addPathPoint(finalP);
      }

      const path = animEngineRef.current.endPathDrawing();
      setIsDrawing(false);

      if (!path || path.length < 8) {
        setCurrentPathPoints([]);
        return;
      }

      setCurrentPathPoints(path);

      if (isTrainingMode && trainingSelectedTemplate) {
        const prog = realtimeMatchProgress(path, trainingSelectedTemplate);
        setMatchPercentage(prog);
        return;
      }

      if (isTrainingMode) {
        return;
      }

      const result = recognizeGesture(path, customTemplates);

      let cx = CANVAS_CONFIG.WIDTH / 2;
      let cy = CANVAS_CONFIG.HEIGHT / 2;
      if (path.length > 0 && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const ratioW = rect.width / CANVAS_CONFIG.WIDTH;
        const ratioH = rect.height / CANVAS_CONFIG.HEIGHT;
        const avg = path.reduce(
          (acc, p) => ({ x: acc.x + p.x / path.length, y: acc.y + p.y / path.length }),
          { x: 0, y: 0 }
        );
        cx = avg.x / (ratioW || 1);
        cy = avg.y / (ratioH || 1);
      }

      const wrapper = wrapperRef.current;
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      const actualW = canvasRect?.width || CANVAS_CONFIG.WIDTH;
      const actualH = canvasRect?.height || CANVAS_CONFIG.HEIGHT;
      const center = {
        x: actualW / 2,
        y: actualH / 2,
      };

      if (result.type !== 'UNKNOWN') {
        const animation = getAnimationForGesture(result.type);
        setCurrentRecognition(result.type, animation, result.confidence);
        setRecognitionKey((k) => k + 1);

        if (wrapper && animEngineRef.current) {
          const rect = wrapper.getBoundingClientRect();
          triggerAnimation(animation, rect, center);
        }
      } else {
        setCurrentRecognition('UNKNOWN', 'NONE', 0);
        setRecognitionKey((k) => k + 1);
        setTimeout(() => setCurrentRecognition('UNKNOWN', 'NONE', 0), 1200);
      }

      setTimeout(() => setCurrentPathPoints([]), 1500);
    },
    [
      isDrawing,
      isTrainingMode,
      trainingSelectedTemplate,
      customTemplates,
      getAnimationForGesture,
      setCurrentRecognition,
      setMatchPercentage,
    ]
  );

  const triggerAnimation = (
    animType: AnimationType,
    rect: DOMRect,
    center: { x: number; y: number }
  ) => {
    if (!animEngineRef.current) return;
    switch (animType) {
      case 'VORTEX':
        animEngineRef.current.triggerVortex(center.x, center.y);
        break;
      case 'PULSE':
        animEngineRef.current.triggerPulse(center.x, center.y);
        break;
      case 'WAVE':
        animEngineRef.current.triggerWave();
        break;
      case 'FLASH':
        animEngineRef.current.triggerFlash(customTextForFlash);
        break;
    }
  };

  const handleClear = () => {
    animEngineRef.current?.clearAll();
    setCurrentPathPoints([]);
    setMatchPercentage(0);
  };

  const handleSaveTemplate = (name: string, gestureType: GestureType) => {
    if (currentPathPoints.length < 10) return;
    addCustomTemplate({ name, points: currentPathPoints, gestureType });
  };

  return (
    <div className="app-shell">
      <Toolbar onClear={handleClear} />

      <div className="main-content">
        <div className="canvas-area">
          <div className="canvas-wrapper" ref={wrapperRef}>
            <canvas
              ref={canvasRef}
              className="gesture-canvas"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onPointerLeave={(e) => {
                if (isDrawing) handlePointerUp(e);
              }}
            />

            <RecognitionBadge
              key={recognitionKey}
              gesture={currentGesture}
              animation={currentAnimation}
              confidence={lastRecognitionConfidence}
            />

            {showHint && (
              <div className={`canvas-hint ${hintFade ? 'fade' : ''}`}>
                {isTrainingMode
                  ? '绘制手势 · 点击上方保存按钮存储模板'
                  : '在画布上绘制圆形、三角形、S形或Z形手势'}
              </div>
            )}
          </div>

          <CanvasLegend />
        </div>

        {isTrainingMode && (
          <TrainingPanel
            currentPathPoints={currentPathPoints}
            onSaveTemplate={handleSaveTemplate}
          />
        )}
      </div>

      <SettingsDrawer />
    </div>
  );
};

const CanvasLegend: React.FC = () => {
  const items = [
    { shape: '◯', label: '圆形', color: '#FF6B6B', effect: '涡旋' },
    { shape: '△', label: '三角形', color: '#00FFAA', effect: '脉冲' },
    { shape: 'S', label: 'S形', color: '#4ECDC4', effect: '波浪' },
    { shape: 'Z', label: 'Z形', color: '#FFE66D', effect: '闪烁' },
  ];
  return (
    <div
      style={{
        display: 'flex',
        gap: 16,
        flexWrap: 'wrap',
        justifyContent: 'center',
        opacity: 0.85,
      }}
    >
      {items.map((it) => (
        <div
          key={it.label}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 999,
            fontSize: 12,
          }}
        >
          <span
            style={{
              color: it.color,
              fontWeight: 800,
              fontSize: 14,
              width: 16,
              textAlign: 'center',
            }}
          >
            {it.shape}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.7)' }}>{it.label}</span>
          <span style={{ color: 'rgba(255,255,255,0.35)' }}>→</span>
          <span style={{ color: it.color, fontWeight: 600 }}>{it.effect}</span>
        </div>
      ))}
    </div>
  );
};

export default App;
