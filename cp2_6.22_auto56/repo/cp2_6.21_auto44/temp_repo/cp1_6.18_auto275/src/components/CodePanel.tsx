import { forwardRef, memo, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { ColorHex } from '../utils/cryptoEngine';
import './CodePanel.css';

export interface CodePanelHandle {
  getCenter: () => { x: number; y: number } | null;
}

const SLOT_COUNT = 5;

interface SlotProps {
  color: ColorHex | null;
  verifyState: 'idle' | 'checking' | 'success' | 'fail';
  blinkPhase: number;
  shakePhase: number;
  hint: ColorHex | null;
}

const Slot = memo(function Slot({ color, verifyState, blinkPhase, shakePhase, hint }: SlotProps) {
  let bg: React.CSSProperties['background'] = '#2C2C3E';
  let opacity = 1;

  if (verifyState === 'checking') {
    opacity = 0.4 + 0.6 * Math.abs(Math.sin(blinkPhase * Math.PI * 3));
  }

  if (verifyState === 'success') {
    bg = 'linear-gradient(135deg, #00E676, #69F0AE)';
  } else if (verifyState === 'fail') {
    bg = 'linear-gradient(135deg, #FF5252, #FF8A80)';
  } else if (color !== null) {
    bg = color;
  }

  let shakeX = 0;
  if (verifyState === 'fail') {
    const t = Math.min(1, shakePhase);
    shakeX = Math.sin(t * Math.PI * 10) * 6 * Math.max(0, 1 - t * 5);
  }

  const hintStyle: React.CSSProperties | null =
    hint !== null && color === null && verifyState === 'idle'
      ? { backgroundColor: hint, opacity: 0.3 }
      : null;

  return (
    <div
      className="code-slot"
      style={{
        background: bg,
        opacity,
        transform: `translateX(${shakeX}px)`,
        ...hintStyle,
      }}
    />
  );
});

interface CodePanelProps {
  onPhaseChange: (phase: { blink: number; shake: number }) => void;
}

const CodePanelImpl = memo(
  forwardRef<CodePanelHandle, CodePanelProps>(function CodePanelImpl({ onPhaseChange }, ref) {
    const selectedSequence = useGameStore((s) => s.selectedSequence);
    const verifyState = useGameStore((s) => s.verifyState);
    const showHint = useGameStore((s) => s.showHint);

    const containerRef = useRef<HTMLDivElement>(null);
    const blinkStartRef = useRef<number | null>(null);
    const shakeStartRef = useRef<number | null>(null);
    const prevStateRef = useRef(verifyState);
    const rafRef = useRef<number | null>(null);
    const [, forceRender] = useState(0);
    const phaseRef = useRef({ blink: 1, shake: 1 });

    useImperativeHandle(
      ref,
      () => ({
        getCenter: () => {
          const el = containerRef.current;
          if (!el) return null;
          const rect = el.getBoundingClientRect();
          return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        },
      }),
      [],
    );

    useEffect(() => {
      if (prevStateRef.current !== verifyState) {
        if (verifyState === 'checking') blinkStartRef.current = performance.now();
        if (verifyState === 'fail') shakeStartRef.current = performance.now();
        prevStateRef.current = verifyState;
      }
    }, [verifyState]);

    useEffect(() => {
      const loop = () => {
        const now = performance.now();
        let needRender = false;
        if (blinkStartRef.current !== null) {
          const elapsed = (now - blinkStartRef.current) / 300;
          if (elapsed >= 1) blinkStartRef.current = null;
          phaseRef.current.blink = Math.min(1, elapsed);
          needRender = true;
        } else {
          phaseRef.current.blink = 1;
        }
        if (shakeStartRef.current !== null) {
          const elapsed = (now - shakeStartRef.current) / 200;
          if (elapsed >= 1) shakeStartRef.current = null;
          phaseRef.current.shake = Math.min(1, elapsed);
          needRender = true;
        } else {
          phaseRef.current.shake = 1;
        }
        onPhaseChange(phaseRef.current);
        if (needRender) forceRender((n) => (n + 1) & 0xffff);
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
      return () => {
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      };
    }, [onPhaseChange]);

    const blinkPhase = phaseRef.current.blink;
    const shakePhase = phaseRef.current.shake;

    const slots = Array.from({ length: SLOT_COUNT }, (_, i) => {
      const color = selectedSequence[i] ?? null;
      const hint = showHint !== null && showHint.slotIndex === i ? showHint.color : null;
      return (
        <Slot
          key={i}
          color={color}
          verifyState={verifyState}
          blinkPhase={blinkPhase}
          shakePhase={shakePhase}
          hint={hint}
        />
      );
    });

    return (
      <div className="codepanel-card">
        <div className="codepanel-title">密码序列</div>
        <div ref={containerRef} className="codepanel-slots">
          {slots}
        </div>
      </div>
    );
  }),
);

export const CodePanel = CodePanelImpl;
