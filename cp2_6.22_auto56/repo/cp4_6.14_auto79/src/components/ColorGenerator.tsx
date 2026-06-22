import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Save, RotateCcw, Palette } from 'lucide-react';
import { useGradientStore } from '../store';
import { debounce } from '../utils/debounce';
import { generateGradientCss } from '../utils/cssGenerator';
import type { Gradient } from '../types';

export default function ColorGenerator() {
  const currentGradient = useGradientStore((s) => s.currentGradient);
  const setStartColor = useGradientStore((s) => s.setStartColor);
  const setEndColor = useGradientStore((s) => s.setEndColor);
  const setAngle = useGradientStore((s) => s.setAngle);
  const saveToPalette = useGradientStore((s) => s.saveToPalette);

  const [localStart, setLocalStart] = useState(currentGradient.startColor);
  const [localEnd, setLocalEnd] = useState(currentGradient.endColor);
  const [localAngle, setLocalAngle] = useState(currentGradient.angle);

  const angleInputRef = useRef<HTMLInputElement>(null);
  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalStart(currentGradient.startColor);
    setLocalEnd(currentGradient.endColor);
    setLocalAngle(currentGradient.angle);
  }, [currentGradient]);

  const debouncedSetStart = useMemo(
    () => debounce((c: string) => setStartColor(c), 150),
    [setStartColor]
  );
  const debouncedSetEnd = useMemo(
    () => debounce((c: string) => setEndColor(c), 150),
    [setEndColor]
  );
  const debouncedSetAngle = useMemo(
    () => debounce((a: number) => setAngle(a), 150),
    [setAngle]
  );

  const handleStartChange = useCallback(
    (c: string) => {
      setLocalStart(c);
      debouncedSetStart(c);
    },
    [debouncedSetStart]
  );

  const handleEndChange = useCallback(
    (c: string) => {
      setLocalEnd(c);
      debouncedSetEnd(c);
    },
    [debouncedSetEnd]
  );

  const handleAngleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Number(e.target.value);
      setLocalAngle(val);
      debouncedSetAngle(val);
    },
    [debouncedSetAngle]
  );

  const handleStartInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let v = e.target.value.trim();
      if (!v.startsWith('#')) v = '#' + v;
      if (/^#[0-9a-fA-F]{6}$/.test(v)) {
        handleStartChange(v);
      }
    },
    [handleStartChange]
  );

  const handleEndInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let v = e.target.value.trim();
      if (!v.startsWith('#')) v = '#' + v;
      if (/^#[0-9a-fA-F]{6}$/.test(v)) {
        handleEndChange(v);
      }
    },
    [handleEndChange]
  );

  const handleAngleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = Number(e.target.value);
      if (!Number.isNaN(v) && v >= 0 && v <= 360) {
        const intVal = Math.round(v);
        setLocalAngle(intVal);
        debouncedSetAngle(intVal);
      }
    },
    [debouncedSetAngle]
  );

  const handleReset = useCallback(() => {
    const g: Gradient = { startColor: '#6366f1', endColor: '#ec4899', angle: 135 };
    setLocalStart(g.startColor);
    setLocalEnd(g.endColor);
    setLocalAngle(g.angle);
    setStartColor(g.startColor);
    setEndColor(g.endColor);
    setAngle(g.angle);
  }, [setStartColor, setEndColor, setAngle]);

  const localGradient: Gradient = {
    startColor: localStart,
    endColor: localEnd,
    angle: localAngle
  };

  const previewBg = generateGradientCss(localGradient);

  return (
    <div style={styles.wrapper}>
      <header style={styles.header}>
        <Palette size={20} style={{ marginRight: 8, color: '#3b82f6' }} />
        <span style={styles.title}>渐变生成器</span>
      </header>

      <div style={styles.previewCard}>
        <div
          style={{
            ...styles.previewBox,
            background: previewBg,
            transition: 'background 200ms ease-out'
          }}
        />
        <div style={styles.previewLabel}>
          <code style={styles.codeLabel}>
            linear-gradient({localAngle}deg, {localStart}, {localEnd})
          </code>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionLabel}>起始色</span>
          <input
            ref={startInputRef}
            value={localStart}
            onChange={handleStartInput}
            style={styles.hexInput}
            spellCheck={false}
          />
        </div>
        <div style={styles.pickerCard}>
          <HexColorPicker
            color={localStart}
            onChange={handleStartChange}
            style={{ width: '100%', height: 180 }}
          />
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionLabel}>终止色</span>
          <input
            ref={endInputRef}
            value={localEnd}
            onChange={handleEndInput}
            style={styles.hexInput}
            spellCheck={false}
          />
        </div>
        <div style={styles.pickerCard}>
          <HexColorPicker
            color={localEnd}
            onChange={handleEndChange}
            style={{ width: '100%', height: 180 }}
          />
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionLabel}>角度</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              ref={angleInputRef}
              type="number"
              min={0}
              max={360}
              step={1}
              value={localAngle}
              onChange={handleAngleInput}
              style={styles.angleNumber}
            />
            <span style={styles.degreeSymbol}>°</span>
          </div>
        </div>
        <div style={styles.sliderRow}>
          <input
            type="range"
            min={0}
            max={360}
            step={1}
            value={localAngle}
            onChange={handleAngleChange}
            style={{ flex: 1, height: 28 }}
          />
        </div>
        <div style={styles.angleMarks}>
          {[0, 90, 180, 270, 360].map((v) => (
            <span key={v} style={styles.angleMark}>
              {v}°
            </span>
          ))}
        </div>
      </div>

      <div style={styles.buttonRow}>
        <button onClick={handleReset} style={styles.btnSecondary}>
          <RotateCcw size={16} />
          <span style={{ marginLeft: 6 }}>重置</span>
        </button>
        <button onClick={saveToPalette} style={styles.btnPrimary}>
          <Save size={16} />
          <span style={{ marginLeft: 6 }}>保存到调色板</span>
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    padding: 20,
    width: '100%',
    height: '100%',
    overflowY: 'auto'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottom: '1px solid #334155'
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    color: '#f8fafc',
