import { useRef, useEffect, useState, useCallback } from 'react';
import { useWaveformStore } from '../store';
import { generateWaveforms, GenerateResult } from '../utils/waveformEngine';
import {
  ChannelKey,
  CHANNEL_COLORS,
  CursorState,
  WavePoint,
} from '../types';

type CursorHit = null | keyof CursorState;

function voltageToY(v: number, h: number, padTop: number, padBot: number): number {
  const graphH = h - padTop - padBot;
  return padTop + graphH * (0.5 - v / 2);
}

function yToVoltage(y: number, h: number, padTop: number, padBot: number): number {
  const graphH = h - padTop - padBot;
  const t = (y - padTop) / graphH;
  return (0.5 - t) * 2;
}

function timeToX(t: number, totalTime: number, w: number, padL: number, padR: number): number {
  const graphW = w - padL - padR;
  return padL + (t / totalTime) * graphW;
}

function xToTime(x: number, totalTime: number, w: number, padL: number, padR: number): number {
  const graphW = w - padL - padR;
  return ((x - padL) / graphW) * totalTime;
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  padL: number,
  padR: number,
  padT: number,
  padB: number,
) {
  const gW = w - padL - padR;
  const gH = h - padT - padB;

  for (let x = 0; x <= gW; x += 10) {
    const px = padL + x;
    const isMajor = x % 50 === 0;
    ctx.beginPath();
    ctx.strokeStyle = isMajor ? 'rgba(42,42,58,0.5)' : 'rgba(42,42,58,0.3)';
    ctx.lineWidth = isMajor ? 1 : 0.5;
    ctx.moveTo(px, padT);
    ctx.lineTo(px, padT + gH);
    ctx.stroke();
  }

  for (let y = 0; y <= gH; y += 10) {
    const py = padT + y;
    const isMajor = y % 50 === 0;
    ctx.beginPath();
    ctx.strokeStyle = isMajor ? 'rgba(42,42,58,0.5)' : 'rgba(42,42,58,0.3)';
    ctx.lineWidth = isMajor ? 1 : 0.5;
    ctx.moveTo(padL, py);
    ctx.lineTo(padL + gW, py);
    ctx.stroke();
  }

  const y0 = padT + gH / 2;
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(79,195,247,0.25)';
  ctx.lineWidth = 1.5;
  ctx.moveTo(padL, y0);
  ctx.lineTo(padL + gW, y0);
  ctx.stroke();

  const x0 = padL;
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(79,195,247,0.25)';
  ctx.lineWidth = 1.5;
  ctx.moveTo(x0, padT);
  ctx.lineTo(x0, padT + gH);
  ctx.stroke();
}

function drawWave(
  ctx: CanvasRenderingContext2D,
  pts: WavePoint[],
  totalTime: number,
  w: number,
  h: number,
  padL: number,
  padR: number,
  padT: number,
  padB: number,
  color: string,
  lw: number,
  alpha = 1,
) {
  if (pts.length < 2) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const x = timeToX(p.time, totalTime, w, padL, padR);
    const y = voltageToY(p.voltage, h, padT, padB);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawAxisLabels(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  padL: number,
  padR: number,
  padT: number,
  padB: number,
  totalTime: number,
  timeBase: number,
) {
  ctx.fillStyle = '#8B94A7';
  ctx.font = "10px 'JetBrains Mono', 'Courier New', monospace";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  const gW = w - padL - padR;
  for (let i = 0; i <= 10; i++) {
    const t = (totalTime * i) / 10;
    const x = padL + (gW * i) / 10;
    const label = t >= 0.001
      ? `${(t * 1000).toFixed(2)}ms`
      : `${(t * 1000000).toFixed(0)}µs`;
    ctx.fillText(label, x, padT + h - padT - padB + 6);
  }

  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  const gH = h - padT - padB;
  const volts = [1, 0.5, 0, -0.5, -1];
  for (const v of volts) {
    const y = voltageToY(v, h, padT, padB);
    ctx.fillStyle = v === 0 ? '#4FC3F7' : '#8B94A7';
    ctx.fillText(`${v.toFixed(1)}V`, padL - 6, y);
  }

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#4FC3F7';
  ctx.fillText(`${timeBase.toFixed(1)} ms/div`, padL + 6, padT + 6);
}

function drawCursor(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  padL: number,
  padR: number,
  padT: number,
  padB: number,
  cursors: CursorState,
  totalTime: number,
  activeCursor: CursorHit,
) {
  const labels: Record<keyof CursorState, string> = {
    h1: 'H1',
    h2: 'H2',
    v1: 'V1',
    v2: 'V2',
  };
  const colorFor = (k: keyof CursorState) =>
    activeCursor === k ? '#FFB74D' : '#FF6B6B';

  const hCursors: Array<'h1' | 'h2'> = ['h1', 'h2'];
  for (const k of hCursors) {
    const y = voltageToY(cursors[k], h, padT, padB);
    ctx.save();
    ctx.strokeStyle = colorFor(k);
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(w - padR, y);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = colorFor(k);
    ctx.fillRect(padL - 30, y - 8, 28, 16);
    ctx.fillStyle = '#fff';
    ctx.font = "bold 10px 'JetBrains Mono', monospace";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labels[k], padL - 16, y);

    ctx.fillStyle = '#0D1117';
    ctx.fillRect(w - padR + 2, y - 8, 52, 16);
    ctx.strokeStyle = colorFor(k);
    ctx.strokeRect(w - padR + 2, y - 8, 52, 16);
    ctx.fillStyle = colorFor(k);
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.fillText(`${cursors[k].toFixed(3)}V`, w - padR + 28, y);
    ctx.restore();
  }

  const vCursors: Array<'v1' | 'v2'> = ['v1', 'v2'];
  for (const k of vCursors) {
    const x = timeToX(cursors[k], totalTime, w, padL, padR);
    ctx.save();
    ctx.strokeStyle = colorFor(k);
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(x, padT);
    ctx.lineTo(x, h - padB);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = colorFor(k);
    ctx.fillRect(x - 14, padT - 18, 28, 16);
    ctx.fillStyle = '#fff';
    ctx.font = "bold 10px 'JetBrains Mono', monospace";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labels[k], x, padT - 10);

    ctx.fillStyle = '#0D1117';
    ctx.fillRect(x - 28, h - padB + 2, 56, 16);
    ctx.strokeStyle = colorFor(k);
    ctx.strokeRect(x - 28, h - padB + 2, 56, 16);
    ctx.fillStyle = colorFor(k);
    ctx.font = "10px 'JetBrains Mono', monospace";
    const t = cursors[k] * 1000;
    ctx.fillText(
      `${t >= 1 ? t.toFixed(2) + 'ms' : (t * 1000).toFixed(0) + 'µs'}`,
      x,
      h - padB + 10,
    );
    ctx.restore();
  }
}

function drawCrosshair(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  padL: number,
  padR: number,
  padT: number,
  padB: number,
) {
  if (x < padL || x > w - padR || y < padT || y > h - padB) return;
  ctx.save();
  ctx.strokeStyle = 'rgba(79,195,247,0.5)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(x, padT);
  ctx.lineTo(x, h - padB);
  ctx.moveTo(padL, y);
  ctx.lineTo(w - padR, y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawTriggerLine(
  ctx: CanvasRenderingContext2D,
  level: number,
  source: ChannelKey,
  w: number,
  h: number,
  padL: number,
  padR: number,
  padT: number,
  padB: number,
) {
  const y = voltageToY(level, h, padT, padB);
  const color = CHANNEL_COLORS[source];
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 6]);
  ctx.beginPath();
  ctx.moveTo(w - padR - 2, y);
  ctx.lineTo(w - padR - 20, y);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.moveTo(w - padR - 20, y - 5);
  ctx.lineTo(w - padR - 14, y);
  ctx.lineTo(w - padR - 20, y + 5);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

const PAD_L = 56;
const PAD_R = 72;
const PAD_T = 28;
const PAD_B = 36;

export function WaveformCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number>(0);
  const lastResultRef = useRef<GenerateResult | null>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null);
  const [draggingCursor, setDraggingCursor] = useState<CursorHit>(null);

  const state = useWaveformStore();
  const showIndividual = state.showIndividualWaves;
  const showCursors = state.showCursors;
  const setCursor = state.setCursor;
  const setSampleRate = state.setSampleRate;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateSize = () => {
      const r = el.getBoundingClientRect();
      setSize({ w: Math.max(400, Math.floor(r.width)), h: Math.max(300, Math.floor(r.height)) });
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    window.addEventListener('resize', updateSize);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!canvasRef.current || !showCursors) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = size.w / rect.width;
      const scaleY = size.h / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      const totalTime = lastResultRef.current?.windowDuration || 0.05;
      const curs = state.cursors;
      const h1y = voltageToY(curs.h1, size.h, PAD_T, PAD_B);
      const h2y = voltageToY(curs.h2, size.h, PAD_T, PAD_B);
      const v1x = timeToX(curs.v1, totalTime, size.w, PAD_L, PAD_R);
      const v2x = timeToX(curs.v2, totalTime, size.w, PAD_L, PAD_R);

      const d = 8;
      let hit: CursorHit = null;
      if (Math.abs(y - h1y) < d) hit = 'h1';
      else if (Math.abs(y - h2y) < d) hit = 'h2';
      else if (Math.abs(x - v1x) < d) hit = 'v1';
      else if (Math.abs(x - v2x) < d) hit = 'v2';

      if (hit) {
        setDraggingCursor(hit);
        e.preventDefault();
      }
    },
    [showCursors, size.w, size.h, state.cursors],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = size.w / rect.width;
      const scaleY = size.h / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      setMouse({ x, y });

      if (draggingCursor && lastResultRef.current) {
        const totalTime = lastResultRef.current.windowDuration;
        if (draggingCursor === 'h1' || draggingCursor === 'h2') {
          const v = yToVoltage(y, size.h, PAD_T, PAD_B);
          setCursor(draggingCursor, Math.max(-1, Math.min(1, v)));
        } else {
          const t = xToTime(x, totalTime, size.w, PAD_L, PAD_R);
          setCursor(draggingCursor, Math.max(0, Math.min(totalTime, t)));
        }
      }
    },
    [draggingCursor, setCursor, size.w, size.h],
  );

  const handleMouseUp = useCallback(() => {
    setDraggingCursor(null);
  }, []);

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseUp]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size.w * dpr;
    canvas.height = size.h * dpr;
    canvas.style.width = `${size.w}px`;
    canvas.style.height = `${size.h}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const render = () => {
      const chs = { ch1: state.ch1, ch2: state.ch2, ch3: state.ch3, ch4: state.ch4 };
      const result = generateWaveforms(chs, state.timeBase, state.masterMix);
      lastResultRef.current = result;
      if (state.sampleRate !== result.sampleCount) {
        setSampleRate(result.sampleCount);
      }
      const totalTime = result.windowDuration;

      ctx.fillStyle = '#0D1117';
      ctx.fillRect(0, 0, size.w, size.h);

      drawGrid(ctx, size.w, size.h, PAD_L, PAD_R, PAD_T, PAD_B);
      drawAxisLabels(ctx, size.w, size.h, PAD_L, PAD_R, PAD_T, PAD_B, totalTime, state.timeBase);
      drawTriggerLine(
        ctx,
        state.triggerLevel,
        state.triggerSource,
        size.w,
        size.h,
        PAD_L,
        PAD_R,
        PAD_T,
        PAD_B,
      );

      if (showIndividual) {
        const entries: [ChannelKey, WavePoint[]][] = [
          ['ch1', result.channels.ch1],
          ['ch2', result.channels.ch2],
          ['ch3', result.channels.ch3],
          ['ch4', result.channels.ch4],
        ];
        for (const [k, arr] of entries) {
          const params = state[k];
          if (!params.enabled) continue;
          drawWave(
            ctx,
            arr,
            totalTime,
            size.w,
            size.h,
            PAD_L,
            PAD_R,
            PAD_T,
            PAD_B,
            CHANNEL_COLORS[k],
            1,
            0.55,
          );
        }
      }

      drawWave(
        ctx,
        result.combined,
        totalTime,
        size.w,
        size.h,
        PAD_L,
        PAD_R,
        PAD_T,
        PAD_B,
        '#FFFFFF',
        2,
        1,
      );

      if (showCursors) {
        drawCursor(
          ctx,
          size.w,
          size.h,
          PAD_L,
          PAD_R,
          PAD_T,
          PAD_B,
          state.cursors,
          totalTime,
          draggingCursor,
        );
      }

      if (mouse) {
        drawCrosshair(ctx, mouse.x, mouse.y, size.w, size.h, PAD_L, PAD_R, PAD_T, PAD_B);
      }

      frameRef.current = requestAnimationFrame(render);
    };

    frameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.w, size.h, showIndividual, showCursors, draggingCursor, mouse]);

  const hoverInfo = (() => {
    if (!mouse || !lastResultRef.current) return null;
    const totalTime = lastResultRef.current.windowDuration;
    if (
      mouse.x < PAD_L ||
      mouse.x > size.w - PAD_R ||
      mouse.y < PAD_T ||
      mouse.y > size.h - PAD_B
    )
      return null;
    const t = xToTime(mouse.x, totalTime, size.w, PAD_L, PAD_R);
    const v = yToVoltage(mouse.y, size.h, PAD_T, PAD_B);
    const tLabel = t >= 0.001 ? `${(t * 1000).toFixed(3)} ms` : `${(t * 1000000).toFixed(1)} µs`;
    return { t: tLabel, v: v.toFixed(4) };
  })();

  const cursorDelta = (() => {
    if (!showCursors) return null;
    const dV = Math.abs(state.cursors.h1 - state.cursors.h2);
    const dT = Math.abs(state.cursors.v1 - state.cursors.v2);
    const freq = dT > 0 ? 1 / dT : 0;
    return {
      dV: dV.toFixed(4),
      dT: dT >= 0.001 ? `${(dT * 1000).toFixed(3)} ms` : `${(dT * 1000000).toFixed(1)} µs`,
      freq: freq >= 1000 ? `${(freq / 1000).toFixed(2)} kHz` : `${freq.toFixed(1)} Hz`,
    };
  })();

  return (
    <div
      ref={containerRef}
      id="canvasWrapper"
      style={{
        flex: 1,
        position: 'relative',
        width: '100%',
        height: '100%',
        background: '#0D1117',
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid #2A2A3A',
        minWidth: 0,
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setMouse(null)}
        style={{
          display: 'block',
          cursor: showCursors ? (draggingCursor ? 'grabbing' : 'crosshair') : 'crosshair',
        }}
      />

      {hoverInfo && (
        <div
          style={{
            position: 'absolute',
            left: PAD_L + 10,
            bottom: PAD_B + 10,
            background: 'rgba(13,17,23,0.85)',
            border: '1px solid rgba(79,195,247,0.4)',
            borderRadius: 6,
            padding: '6px 10px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: '#4FC3F7',
            pointerEvents: 'none',
            backdropFilter: 'blur(4px)',
          }}
        >
          <span style={{ color: '#8B94A7' }}>t:</span> {hoverInfo.t}
          <span style={{ margin: '0 8px', color: '#3A3A4A' }}>|</span>
          <span style={{ color: '#8B94A7' }}>V:</span>{' '}
          <span style={{ color: '#fff' }}>{hoverInfo.v}V</span>
        </div>
      )}

      {cursorDelta && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            background: 'rgba(20,20,30,0.9)',
            border: '1px solid rgba(255,107,107,0.3)',
            borderRadius: 8,
            padding: '8px 12px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            pointerEvents: 'none',
            backdropFilter: 'blur(4px)',
            minWidth: 150,
          }}
        >
          <div
            style={{
              color: '#FFB74D',
              fontWeight: 700,
              marginBottom: 6,
              fontSize: 10,
              letterSpacing: 0.5,
            }}
          >
            ▼ MEASUREMENT
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ color: '#8B94A7' }}>ΔV</span>
            <span style={{ color: '#FF6B6B' }}>{cursorDelta.dV} V</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ color: '#8B94A7' }}>Δt</span>
            <span style={{ color: '#4FC3F7' }}>{cursorDelta.dT}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#8B94A7' }}>1/Δt</span>
            <span style={{ color: '#81C784' }}>{cursorDelta.freq}</span>
          </div>
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          display: 'flex',
          gap: 6,
          pointerEvents: 'none',
        }}
      >
        {(['ch1', 'ch2', 'ch3', 'ch4'] as ChannelKey[]).map((k) => {
          const p = state[k];
          return (
            p.enabled && (
              <div
                key={k}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 8px',
                  background: `${CHANNEL_COLORS[k]}15`,
                  border: `1px solid ${CHANNEL_COLORS[k]}55`,
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 600,
                  color: CHANNEL_COLORS[k],
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                <div
                  style={{
                    width: 3,
                    height: 10,
                    background: CHANNEL_COLORS[k],
                    borderRadius: 2,
                  }}
                />
                {k.toUpperCase()}
              </div>
            )
          );
        })}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 4,
            fontSize: 10,
            fontWeight: 600,
            color: '#fff',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <div
            style={{
              width: 3,
              height: 10,
              background: '#fff',
              borderRadius: 2,
            }}
          />
          OUT
        </div>
      </div>
    </div>
  );
}
