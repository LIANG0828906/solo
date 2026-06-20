import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { ColorHex, darkenColor } from '../utils/cryptoEngine';
import './Palette.css';

interface SwatchProps {
  color: ColorHex;
  selected: boolean;
  onClick: () => void;
  disabled: boolean;
}

const Swatch = memo(function Swatch({ color, selected, onClick, disabled }: SwatchProps) {
  const [scale, setScale] = useState(1);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const stateRef = useRef<'idle' | 'running'>('idle');

  const trigger = useCallback(() => {
    if (disabled) return;
    onClick();
    if (stateRef.current === 'running') return;
    stateRef.current = 'running';
    startRef.current = performance.now();
    const tick = () => {
      const t = (performance.now() - startRef.current) / 100;
      if (t <= 0) {
        setScale(1);
      } else if (t < 0.5) {
        const k = t / 0.5;
        setScale(1 - 0.05 * k);
      } else if (t < 1) {
        const k = (t - 0.5) / 0.5;
        setScale(0.95 + 0.15 * k);
      } else if (t < 1.6) {
        const k = (t - 1) / 0.6;
        setScale(1.1 - 0.1 * k);
      } else {
        setScale(1);
        stateRef.current = 'idle';
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [onClick, disabled]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const displayColor = selected ? darkenColor(color, 0.1) : color;

  return (
    <button
      type="button"
      className={`palette-swatch ${selected ? 'palette-swatch--selected' : ''}`}
      style={{
        backgroundColor: displayColor,
        transform: `scale(${scale})`,
      }}
      onClick={trigger}
      disabled={disabled}
      aria-label={`颜色 ${color}`}
    />
  );
});

function PaletteImpl() {
  const colorPool = useGameStore((s) => s.colorPool);
  const selectedSequence = useGameStore((s) => s.selectedSequence);
  const selectColor = useGameStore((s) => s.selectColor);
  const status = useGameStore((s) => s.status);
  const verifyState = useGameStore((s) => s.verifyState);

  const disabled = status !== 'playing' || verifyState !== 'idle' || selectedSequence.length >= 5;

  return (
    <div className="palette-card">
      <div className="palette-title">颜色选择</div>
      <div className="palette-grid">
        {colorPool.map((c) => (
          <Swatch
            key={c}
            color={c}
            selected={selectedSequence.includes(c)}
            onClick={() => selectColor(c)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}

export const Palette = memo(PaletteImpl);
