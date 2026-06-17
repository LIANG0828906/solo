import { useRef, useEffect, useCallback, useState } from "react";
import { getRuneById } from "./RuneData";
import { matchStroke, getAverageScore } from "./CanvasEngine";
import { EffectsModule } from "./EffectsModule";
import { useAppStore } from "./store";
import {
  RuneSelectPanel,
  HistoryPanel,
  ActionButtons,
  MobileDrawer,
} from "./UIComponents";

const TRAIL_LENGTH = 30;
const STROKE_WIDTH = 8;
const STROKE_COLOR = "#FFD700";

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const effectsRef = useRef(new EffectsModule());
  const animFrameRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const trailBufferRef = useRef<{ x: number; y: number; alpha: number }[]>([]);

  const selectedRuneId = useAppStore((s) => s.selectedRuneId);
  const currentStrokes = useAppStore((s) => s.currentStrokes);
  const currentStroke = useAppStore((s) => s.currentStroke);
  const matchResults = useAppStore((s) => s.matchResults);
  const isActivated = useAppStore((s) => s.isActivated);
  const showHint = useAppStore((s) => s.showHint);
  const isDrawing = useAppStore((s) => s.isDrawing);
  const activationAnimation = useAppStore((s) => s.activationAnimation);
  const lastStrokeScore = useAppStore((s) => s.lastStrokeScore);

  const startStroke = useAppStore((s) => s.startStroke);
  const addPoint = useAppStore((s) => s.addPoint);
  const endStroke = useAppStore((s) => s.endStroke);
  const activate = useAppStore((s) => s.activate);
  const failActivation = useAppStore((s) => s.failActivation);
  const addHistory = useAppStore((s) => s.addHistory);
  const setActivationAnimation = useAppStore((s) => s.setActivationAnimation);

  const [mobileTopOpen, setMobileTopOpen] = useState(false);
  const [mobileBottomOpen, setMobileBottomOpen] = useState(false);

  const getCanvasCoords = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    []
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!selectedRuneId || isActivated) return;
      const { x, y } = getCanvasCoords(e);
      startStroke({ x, y, timestamp: Date.now() });
    },
    [selectedRuneId, isActivated, startStroke, getCanvasCoords]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;
      const { x, y } = getCanvasCoords(e);
      addPoint({ x, y, timestamp: Date.now() });
    },
    [isDrawing, addPoint, getCanvasCoords]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !selectedRuneId) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rune = getRuneById(selectedRuneId);
    if (!rune) return;

    const strokeIndex = currentStrokes.length;
    if (strokeIndex >= rune.strokes.length) return;

    const score = matchStroke(
      currentStroke,
      rune.strokes[strokeIndex].keyPoints,
      canvas.width,
      canvas.height
    );

    const result = { strokeIndex, score: Math.round(score * 100) };
    endStroke(result);

    if (strokeIndex + 1 >= rune.strokes.length) {
      const allResults = [...matchResults, result];
      const avgScore = getAverageScore(allResults);
      const success = avgScore > 80;

      if (success) {
        activate();
        effectsRef.current.triggerActivation();
      } else {
        failActivation();
      }

      addHistory({
        id: Date.now().toString(),
        runeName: rune.name,
        date: new Date().toLocaleDateString("zh-CN"),
        success,
        matchScore: avgScore,
      });
    }
  }, [
    isDrawing,
    selectedRuneId,
    currentStroke,
    currentStrokes.length,
    matchResults,
    canvasRef,
    endStroke,
    activate,
    failActivation,
    addHistory,
  ]);

  const renderCanvas = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ctx.clearRect(0, 0, width, height);

      ctx.fillStyle = "#2C2C2C";
      ctx.fillRect(0, 0, width, height);

      if (showHint && selectedRuneId) {
        const rune = getRuneById(selectedRuneId);
        if (rune) {
          ctx.save();
          ctx.strokeStyle = "rgba(255, 99, 71, 0.3)";
          ctx.setLineDash([8, 6]);
          ctx.lineWidth = 2;

          for (const stroke of rune.strokes) {
            if (stroke.keyPoints.length < 2) continue;
            ctx.beginPath();
            ctx.moveTo(
              stroke.keyPoints[0].x * width,
              stroke.keyPoints[0].y * height
            );
            for (let i = 1; i < stroke.keyPoints.length; i++) {
              ctx.lineTo(
                stroke.keyPoints[i].x * width,
                stroke.keyPoints[i].y * height
              );
            }
            ctx.stroke();
          }

          ctx.setLineDash([]);
          ctx.restore();
        }
      }

      for (const stroke of currentStrokes) {
        if (stroke.length < 2) continue;
        ctx.save();
        ctx.strokeStyle = STROKE_COLOR;
        ctx.lineWidth = STROKE_WIDTH;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.globalAlpha = 0.8;
        ctx.shadowColor = STROKE_COLOR;
        ctx.shadowBlur = 4;

        ctx.beginPath();
        ctx.moveTo(stroke[0].x, stroke[0].y);
        for (let i = 1; i < stroke.length; i++) {
          ctx.lineTo(stroke[i].x, stroke[i].y);
        }
        ctx.stroke();
        ctx.restore();
      }

      if (currentStroke.length > 0) {
        trailBufferRef.current = [];
        const start = Math.max(0, currentStroke.length - TRAIL_LENGTH);
        for (let i = start; i < currentStroke.length; i++) {
          const alpha = ((i - start) / TRAIL_LENGTH) * 0.9 + 0.1;
          trailBufferRef.current.push({
            x: currentStroke[i].x,
            y: currentStroke[i].y,
            alpha,
          });
        }

        if (trailBufferRef.current.length >= 2) {
          ctx.save();
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.lineWidth = STROKE_WIDTH;
          ctx.shadowColor = STROKE_COLOR;
          ctx.shadowBlur = 8;

          for (let i = 1; i < trailBufferRef.current.length; i++) {
            const prev = trailBufferRef.current[i - 1];
            const curr = trailBufferRef.current[i];
            ctx.globalAlpha = curr.alpha;
            ctx.strokeStyle = STROKE_COLOR;
            ctx.beginPath();
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(curr.x, curr.y);
            ctx.stroke();
          }

          ctx.restore();
        }
      }

      if (lastStrokeScore !== null) {
        const t = lastStrokeScore / 100;
        const r = Math.round(255 * (1 - t) + 0 * t);
        const g = Math.round(69 * (1 - t) + 255 * t);
        const b = Math.round(0 * (1 - t) + 0 * t);

        ctx.save();
        ctx.font = "16px 'Ma Shan Zheng', serif";
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.textAlign = "left";
        ctx.fillText(`${lastStrokeScore}%`, 16, height - 16);
        ctx.restore();
      }

      if (activationAnimation) {
        ctx.save();
        ctx.font = "36px 'Ma Shan Zheng', serif";
        ctx.fillStyle = "#FFD700";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = 20;
        ctx.fillText("符箓激活！", width / 2, height / 2);
        ctx.restore();
      }

      effectsRef.current.render();
    },
    [
      selectedRuneId,
      showHint,
      currentStrokes,
      currentStroke,
      lastStrokeScore,
      activationAnimation,
    ]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(dpr, dpr);
      effectsRef.current.bind(ctx, canvas.width, canvas.height);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const loop = (time: number) => {
      const dt = lastFrameTimeRef.current
        ? (time - lastFrameTimeRef.current) / 1000
        : 0.016;
      lastFrameTimeRef.current = time;

      effectsRef.current.update(dt);

      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      renderCanvas(ctx, canvas.width / dpr, canvas.height / dpr);

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [renderCanvas]);

  useEffect(() => {
    if (activationAnimation) {
      const timer = setTimeout(() => setActivationAnimation(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [activationAnimation, setActivationAnimation]);

  const selectedRune = selectedRuneId ? getRuneById(selectedRuneId) : null;
  const strokeProgress =
    selectedRune && matchResults.length > 0
      ? `${matchResults.length}/${selectedRune.strokeCount}`
      : "0/0";

  return (
    <div className="app-container">
      <div className="mobile-top-drawer">
        <MobileDrawer
          type="top"
          isOpen={mobileTopOpen}
          onToggle={() => setMobileTopOpen(!mobileTopOpen)}
        >
          <RuneSelectPanel />
        </MobileDrawer>
      </div>

      <aside className="sidebar left-sidebar">
        <HistoryPanel />
      </aside>

      <main className="canvas-area">
        <div className="canvas-wrapper">
          <canvas
            ref={canvasRef}
            className="rune-canvas"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>
        <div className="canvas-footer">
          <div className="stroke-progress">
            {selectedRune ? `笔画: ${strokeProgress}` : "请选择符箓"}
          </div>
          <ActionButtons />
        </div>
      </main>

      <aside className="sidebar right-sidebar">
        <RuneSelectPanel />
      </aside>

      <div className="mobile-bottom-drawer">
        <MobileDrawer
          type="bottom"
          isOpen={mobileBottomOpen}
          onToggle={() => setMobileBottomOpen(!mobileBottomOpen)}
        >
          <HistoryPanel />
        </MobileDrawer>
      </div>
    </div>
  );
}
