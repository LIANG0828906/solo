import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { RotateCcw, Settings, Gauge } from 'lucide-react';
import { useLabStore } from './store';
import {
  REAGENT_LIST,
  parseEquationTokens,
  rgbaToString,
  type RGBA,
} from './types';

interface Bubble {
  x: number;
  y: number;
  r: number;
  vy: number;
  life: number;
  color: string;
}

interface Precipitate {
  x: number;
  y: number;
  vy: number;
  r: number;
  settled: boolean;
  color: string;
}

export default function Lab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const bubblesRef = useRef<Bubble[]>([]);
  const precipitatesRef = useRef<Precipitate[]>([]);
  const lastFrameRef = useRef<number>(0);
  const [typedIndex, setTypedIndex] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const {
    beakerColor,
    currentReaction,
    temperature,
    isHeating,
    equationDisplay,
    phenomena,
    addReagentToBeaker,
    clearBeaker,
    endDrag,
    drag,
    floatingToasts,
    equationTypingSpeed,
    setEquationTypingSpeed,
    pushFloatingToast,
  } = useLabStore();

  const tokens = useMemo(() => parseEquationTokens(equationDisplay), [equationDisplay]);

  useEffect(() => {
    setTypedIndex(0);
  }, [equationDisplay]);

  useEffect(() => {
    if (!equationDisplay || typedIndex >= tokens.length) return;
    const t = setTimeout(() => setTypedIndex((i) => Math.min(i + 1, tokens.length)), equationTypingSpeed);
    return () => clearTimeout(t);
  }, [typedIndex, equationDisplay, tokens.length, equationTypingSpeed]);

  const displayColorRef = useRef<RGBA>(beakerColor);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const CW = canvas.width;
    const CH = canvas.height;
    const beakerX = CW / 2;
    const beakerY = CH / 2 + 20;
    const beakerW = 220;
    const beakerH = 260;
    const liquidY = beakerY + beakerH * 0.15;
    const liquidBaseY = beakerY + beakerH * 0.9;

    const draw = (ts: number) => {
      const delta = ts - lastFrameRef.current;
      lastFrameRef.current = ts;
      if (delta > 0 && delta < 200) {
        const target = beakerColor;
        const dc = displayColorRef.current;
        const lerpRate = 0.08;
        dc.r = dc.r + (target.r - dc.r) * lerpRate;
        dc.g = dc.g + (target.g - dc.g) * lerpRate;
        dc.b = dc.b + (target.b - dc.b) * lerpRate;
        dc.a = dc.a + (target.a - dc.a) * lerpRate;
      }

      const hasBubbling = phenomena.some((p) => p.type === 'bubbling');
      const hasPrecipitate = phenomena.some((p) => p.type === 'precipitate');
      if (hasBubbling && Math.random() < 0.35) {
        bubblesRef.current.push({
          x: beakerX - beakerW * 0.35 + Math.random() * beakerW * 0.7,
          y: liquidBaseY - 4,
          r: 2 + Math.random() * 5,
          vy: 0.4 + Math.random() * 1.2,
          life: 1,
          color: 'rgba(255,255,255,0.8)',
        });
      }
      bubblesRef.current = bubblesRef.current
        .map((b) => ({ ...b, y: b.y - b.vy, life: b.life - 0.015 }))
        .filter((b) => b.life > 0 && b.y > liquidY);

      if (hasPrecipitate) {
        while (precipitatesRef.current.length < 60 && Math.random() < 0.15) {
          precipitatesRef.current.push({
            x: beakerX - beakerW * 0.35 + Math.random() * beakerW * 0.7,
            y: liquidY + 4,
            vy: 0.5 + Math.random() * 1.2,
            r: 1.5 + Math.random() * 2.5,
            settled: false,
            color: rgbaToString(displayColorRef.current),
          });
        }
        precipitatesRef.current = precipitatesRef.current.map((p) => {
          if (p.settled) return p;
          const ny = p.y + p.vy;
          if (ny >= liquidBaseY - 4) {
            return { ...p, y: liquidBaseY - 4 - Math.random() * 8, settled: true };
          }
          return { ...p, y: ny };
        });
      } else {
        precipitatesRef.current = [];
      }

      ctx.clearRect(0, 0, CW, CH);

      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      ctx.beginPath();
      ctx.ellipse(beakerX, beakerY + beakerH / 2 + 48, beakerW * 0.55, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      const c = displayColorRef.current;
      const liquidH = liquidBaseY - liquidY;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(beakerX - beakerW * 0.48 + 10, liquidY);
      ctx.lineTo(beakerX + beakerW * 0.48 - 10, liquidY);
      ctx.lineTo(beakerX + beakerW * 0.45, liquidBaseY);
      ctx.lineTo(beakerX - beakerW * 0.45, liquidBaseY);
      ctx.closePath();
      ctx.clip();
      ctx.fillStyle = `rgba(${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)},${c.a})`;
      ctx.fillRect(0, liquidY, CW, liquidH + 10);
      ctx.restore();

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      precipitatesRef.current.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });
      ctx.restore();

      ctx.save();
      bubblesRef.current.forEach((b) => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.globalAlpha = Math.min(0.85, b.life + 0.2);
        ctx.fill();
      });
      ctx.restore();

      ctx.lineWidth = 3;
      ctx.strokeStyle = '#1b2b4c';
      ctx.beginPath();
      ctx.moveTo(beakerX - beakerW / 2, beakerY);
      ctx.lineTo(beakerX - beakerW * 0.48, beakerY + beakerH);
      ctx.quadraticCurveTo(beakerX, beakerY + beakerH + 16, beakerX + beakerW * 0.48, beakerY + beakerH);
      ctx.lineTo(beakerX + beakerW / 2, beakerY);
      ctx.stroke();

      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(27,43,76,0.35)';
      for (let i = 0; i < 4; i++) {
        const yy = beakerY + 40 + i * 50;
        ctx.beginPath();
        ctx.moveTo(beakerX - beakerW * 0.42, yy);
        ctx.lineTo(beakerX - beakerW * 0.5, yy);
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [beakerColor, phenomena]);

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!drag.isDragging || !drag.reagentId) {
        endDrag();
        return;
      }
      const canvas = canvasRef.current;
      if (!canvas) {
        endDrag();
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const inX = e.clientX >= rect.left && e.clientX <= rect.right;
      const inY = e.clientY >= rect.top && e.clientY <= rect.bottom;
      if (inX && inY) {
        addReagentToBeaker(drag.reagentId, 20);
        const reagent = REAGENT_LIST.find((r) => r.id === drag.reagentId);
        pushFloatingToast(`+20mL ${reagent?.name ?? ''}`, e.clientX, e.clientY);
      }
      endDrag();
    },
    [drag.isDragging, drag.reagentId, addReagentToBeaker, endDrag, pushFloatingToast]
  );

  const tempBarHeight = Math.min(180, ((temperature - 20) / 80) * 180);

  const visibleTokens = tokens.slice(0, typedIndex);
  const typingDone = typedIndex >= tokens.length;

  return (
    <div
      ref={wrapperRef}
      onMouseUp={handleMouseUp}
      style={{
        background: '#e8eef5',
        borderRadius: 8,
        padding: 20,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: 460,
          marginBottom: 12,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1e2a38' }}>
          实验台
        </h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setShowSettings((s) => !s)}
            title="设置"
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: 'none',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              transition: 'all 0.2s',
              color: '#3a6ea5',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)';
            }}
          >
            <Settings size={18} />
          </button>
          <button
            onClick={clearBeaker}
            title="清空烧杯"
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: 'none',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              transition: 'all 0.2s',
              color: '#e74c3c',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)';
            }}
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </div>

      {showSettings && (
        <div
          style={{
            width: '100%',
            maxWidth: 460,
            background: '#fff',
            borderRadius: 8,
            padding: 14,
            marginBottom: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            animation: 'cardFadeIn 0.25s ease-out',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Gauge size={16} color="#3a6ea5" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>
              方程式打印速度
            </span>
            <span style={{ fontSize: 12, color: '#888', marginLeft: 'auto' }}>
              {equationTypingSpeed <= 30
                ? '快速'
                : equationTypingSpeed <= 80
                ? '正常'
                : equationTypingSpeed <= 140
                ? '慢速'
                : '极慢'}
            </span>
          </div>
          <input
            type="range"
            min={10}
            max={200}
            step={5}
            value={equationTypingSpeed}
            onChange={(e) => setEquationTypingSpeed(Number(e.target.value))}
            style={{
              width: '100%',
              accentColor: '#3a6ea5',
            }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 11,
              color: '#aaa',
              marginTop: 4,
            }}
          >
            <span>快</span>
            <span>慢</span>
          </div>
        </div>
      )}

      <div style={{ position: 'relative' }}>
        <canvas
          id="lab-canvas"
          ref={canvasRef}
          width={400}
          height={420}
          style={{
            display: 'block',
            borderRadius: 8,
            background: 'linear-gradient(180deg, #f5f9fd 0%, #e0ebf6 100%)',
            boxShadow: 'inset 0 0 40px rgba(58,110,165,0.08)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: -36,
            top: 110,
            bottom: 30,
            width: 30,
            display: 'flex',
            flexDirection: 'column-reverse',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: '#666',
              fontWeight: 600,
            }}
          >
            {Math.round(temperature)}°C
          </div>
          <div
            style={{
              flex: 1,
              width: 20,
              borderRadius: 10,
              background: 'rgba(255,255,255,0.8)',
              border: '2px solid #1b2b4c',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              className={isHeating ? 'temp-bar-heating' : ''}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: `${(tempBarHeight / 180) * 100}%`,
                background: isHeating
                  ? 'linear-gradient(0deg, #e74c3c 0%, #ff6b6b 100%)'
                  : 'linear-gradient(0deg, #3498db 0%, #5dade2 100%)',
                borderRadius: 6,
                transition: 'height 0.5s ease-out, background 0.3s',
              }}
            />
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          width: '100%',
          maxWidth: 460,
          minHeight: 56,
          background: '#fff',
          borderRadius: 8,
          padding: '12px 16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {equationDisplay ? (
          <div
            style={{
              fontFamily: 'Consolas, monospace',
              fontSize: 17,
              fontWeight: 600,
              letterSpacing: 0.5,
              lineHeight: 1.6,
            }}
          >
            {visibleTokens.map((tok, i) => (
              <span
                key={i}
                style={{
                  color: tok.color ?? '#1e2a38',
                  display: 'inline',
                }}
              >
                {tok.text}
              </span>
            ))}
            {!typingDone && <span className="equation-cursor" />}
          </div>
        ) : (
          <span style={{ color: '#aaa', fontSize: 14, fontStyle: 'italic' }}>
            从左侧拖拽试剂到烧杯中开始实验...
          </span>
        )}
      </div>

      {phenomena.length > 0 && (
        <div
          style={{
            marginTop: 10,
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            maxWidth: 460,
            justifyContent: 'center',
          }}
        >
          {phenomena.map((p, i) => {
            const label =
              p.type === 'color_change'
                ? '🌈 颜色变化'
                : p.type === 'bubbling'
                ? '💨 产生气体'
                : p.type === 'precipitate'
                ? '🌊 生成沉淀'
                : '🔥 放热反应';
            return (
              <span
                key={i}
                style={{
                  padding: '4px 12px',
                  borderRadius: 14,
                  background: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#3a6ea5',
                  border: '1px solid rgba(58,110,165,0.2)',
                  animation: 'cardFadeIn 0.4s ease-out',
                }}
              >
                {label}
              </span>
            );
          })}
        </div>
      )}

      {floatingToasts.map((t) => (
        <div
          key={t.id}
          className="floating-toast"
          style={{
            position: 'fixed',
            left: t.x,
            top: t.y - 20,
            transform: 'translateX(-50%)',
            padding: '6px 14px',
            borderRadius: 16,
            background: 'rgba(27,43,76,0.92)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
            whiteSpace: 'nowrap',
            zIndex: 9999,
          }}
        >
          {t.text}
        </div>
      ))}

      {currentReaction && (
        <div
          style={{
            marginTop: 12,
            fontSize: 12,
            color: '#666',
            textAlign: 'center',
          }}
        >
          {currentReaction.phenomena.map((p) => p.description).join('，')}
        </div>
      )}
    </div>
  );
}
