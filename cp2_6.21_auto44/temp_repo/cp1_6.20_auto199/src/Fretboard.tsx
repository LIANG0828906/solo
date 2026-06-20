import React, { useRef, useEffect, useCallback } from 'react';
import { InstrumentData, ChordData } from './data';

interface FretboardProps {
  instrument: InstrumentData;
  chord: ChordData | null;
  practiceMode: boolean;
  clickedPositions: Set<string>;
  onPositionClick: (stringIdx: number, fret: number) => void;
}

const PADDING_X = 36;
const PADDING_TOP = 60;
const PADDING_BOTTOM = 24;
const STRING_SPACING = 44;
const FRET_SPACING = 72;
const NUT_HEIGHT = 6;
const DOT_RADIUS = 16;
const OPEN_RADIUS = 10;

export default function Fretboard({
  instrument,
  chord,
  practiceMode,
  clickedPositions,
  onPositionClick,
}: FretboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const chordRef = useRef<ChordData | null>(chord);
  const instrumentRef = useRef<InstrumentData>(instrument);

  chordRef.current = chord;
  instrumentRef.current = instrument;

  const getCanvasWidth = useCallback(
    (inst: InstrumentData) => PADDING_X * 2 + STRING_SPACING * (inst.stringCount - 1),
    []
  );

  const getCanvasHeight = useCallback(
    (inst: InstrumentData) => PADDING_TOP + FRET_SPACING * inst.fretCount + PADDING_BOTTOM,
    []
  );

  const getStringX = useCallback(
    (stringIdx: number) => PADDING_X + STRING_SPACING * stringIdx,
    []
  );

  const getFretY = useCallback(
    (fretIdx: number) => PADDING_TOP + FRET_SPACING * fretIdx,
    []
  );

  const getFretCenterY = useCallback(
    (fretIdx: number) => PADDING_TOP + FRET_SPACING * (fretIdx - 0.5),
    []
  );

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = (timestamp - startTimeRef.current) / 1000;

      const inst = instrumentRef.current;
      const ch = chordRef.current;
      const dpr = window.devicePixelRatio || 1;

      const width = getCanvasWidth(inst);
      const height = getCanvasHeight(inst);

      ctx.clearRect(0, 0, width * dpr, height * dpr);
      ctx.save();
      ctx.scale(dpr, dpr);

      ctx.fillStyle = '#16162a';
      ctx.fillRect(0, 0, width, height);

      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#1e1e2e');
      gradient.addColorStop(1, '#16162a');
      ctx.fillStyle = gradient;
      ctx.fillRect(PADDING_X - 8, PADDING_TOP - 4, STRING_SPACING * (inst.stringCount - 1) + 16, FRET_SPACING * inst.fretCount + 8);

      ctx.fillStyle = '#f5deb3';
      ctx.fillRect(PADDING_X - 8, PADDING_TOP - NUT_HEIGHT / 2, STRING_SPACING * (inst.stringCount - 1) + 16, NUT_HEIGHT);

      ctx.strokeStyle = 'rgba(180, 180, 190, 0.15)';
      ctx.lineWidth = 1;
      for (let f = 1; f <= inst.fretCount; f++) {
        const y = getFretY(f);
        ctx.beginPath();
        ctx.moveTo(PADDING_X - 8, y);
        ctx.lineTo(PADDING_X + STRING_SPACING * (inst.stringCount - 1) + 8, y);
        ctx.stroke();
      }

      for (let s = 0; s < inst.stringCount; s++) {
        const x = getStringX(s);
        ctx.strokeStyle = s < inst.stringCount / 2 ? 'rgba(192, 192, 192, 0.7)' : 'rgba(210, 210, 210, 0.5)';
        ctx.lineWidth = inst.stringCount === 6 ? (2.5 - s * 0.3) : (1.5 - s * 0.2);
        ctx.lineWidth = Math.max(0.5, ctx.lineWidth);
        ctx.beginPath();
        ctx.moveTo(x, PADDING_TOP);
        ctx.lineTo(x, PADDING_TOP + FRET_SPACING * inst.fretCount);
        ctx.stroke();
      }

      if (ch) {
        for (const openStr of ch.openStrings) {
          if (openStr < inst.stringCount) {
            const x = getStringX(openStr);
            const y = PADDING_TOP - NUT_HEIGHT / 2 - 16;
            ctx.strokeStyle = '#6c63ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, OPEN_RADIUS, 0, Math.PI * 2);
            ctx.stroke();
          }
        }

        for (const mutedStr of ch.mutedStrings) {
          if (mutedStr < inst.stringCount) {
            const x = getStringX(mutedStr);
            const y = PADDING_TOP - NUT_HEIGHT / 2 - 16;
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2.5;
            const size = 7;
            ctx.beginPath();
            ctx.moveTo(x - size, y - size);
            ctx.lineTo(x + size, y + size);
            ctx.moveTo(x + size, y - size);
            ctx.lineTo(x - size, y + size);
            ctx.stroke();
          }
        }

        const pulsePhase = Math.sin((elapsed * 2 * Math.PI) / 1.5);
        const pulseScale = 1 + pulsePhase * 0.12;
        const pulseAlpha = 0.85 + pulsePhase * 0.15;

        for (const pos of ch.positions) {
          if (pos.string >= inst.stringCount) continue;
          const x = getStringX(pos.string);
          const y = getFretCenterY(pos.fret);
          const r = DOT_RADIUS * pulseScale;

          const isClicked = clickedPositions.has(`${pos.string}-${pos.fret}`);
          const baseColor = isClicked ? '#4ade80' : '#6c63ff';

          ctx.save();
          ctx.shadowColor = baseColor;
          ctx.shadowBlur = 12 + pulsePhase * 6;

          ctx.globalAlpha = pulseAlpha;
          ctx.fillStyle = baseColor;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${Math.round(r * 1.1)}px "Outfit", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(pos.finger), x, y + 1);
        }
      } else {
        for (let s = 0; s < inst.stringCount; s++) {
          const x = getStringX(s);
          const y = PADDING_TOP - NUT_HEIGHT / 2 - 16;
          ctx.strokeStyle = 'rgba(108, 99, 255, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(x, y, OPEN_RADIUS, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      if (practiceMode && ch) {
        for (let f = 1; f <= inst.fretCount; f++) {
          for (let s = 0; s < inst.stringCount; s++) {
            const key = `${s}-${f}`;
            if (clickedPositions.has(key)) {
              const x = getStringX(s);
              const y = getFretCenterY(f);
              ctx.fillStyle = 'rgba(74, 222, 128, 0.3)';
              ctx.beginPath();
              ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '11px "Source Sans 3", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      for (let f = 1; f <= inst.fretCount; f++) {
        const x = PADDING_X - 20;
        const y = getFretCenterY(f);
        ctx.fillText(String(f), x, y - 5);
      }

      ctx.restore();

      animRef.current = requestAnimationFrame((t) => draw(ctx, t));
    },
    [clickedPositions, getCanvasWidth, getCanvasHeight, getStringX, getFretY, getFretCenterY, practiceMode]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const width = getCanvasWidth(instrument);
    const height = getCanvasHeight(instrument);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    startTimeRef.current = 0;
    animRef.current = requestAnimationFrame((t) => draw(ctx, t));

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [instrument, draw, getCanvasWidth, getCanvasHeight]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!practiceMode || !chord) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / (rect.width * (window.devicePixelRatio || 1));
      const scaleY = canvas.height / (rect.height * (window.devicePixelRatio || 1));
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      for (let f = 1; f <= instrument.fretCount; f++) {
        for (let s = 0; s < instrument.stringCount; s++) {
          const sx = getStringX(s);
          const sy = getFretCenterY(f);
          const dist = Math.sqrt((x - sx) ** 2 + (y - sy) ** 2);
          if (dist < DOT_RADIUS * 1.5) {
            onPositionClick(s, f);
            return;
          }
        }
      }
    },
    [practiceMode, chord, instrument, getStringX, getFretCenterY, onPositionClick]
  );

  const width = getCanvasWidth(instrument);
  const height = getCanvasHeight(instrument);

  return (
    <div className="fretboard-container">
      <canvas
        ref={canvasRef}
        style={{ width, height }}
        onClick={handleClick}
        className={practiceMode ? 'practice-cursor' : ''}
      />
      {practiceMode && chord && (
        <div className="practice-hint">
          点击指板上正确的按弦位置
        </div>
      )}
    </div>
  );
}
