import { useEffect, useRef, useState, useCallback } from 'react';
import { HexColorPicker } from 'react-colorful';
import { X, Move, Maximize2, RotateCw, Palette, Zap } from 'lucide-react';
import { useStore } from '@/store/slice';
import { getPresetById, NEON_COLORS } from '@/utils/presets';
import { clamp } from '@/utils/geometry';
import type { CanvasElement } from '@/types';

interface Props {
  closeable?: boolean;
}

function debounce<T extends (...args: any[]) => void>(fn: T, wait: number) {
  let t: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

export default function PropertyPanel({ closeable = false }: Props) {
  const elements = useStore((s) => s.elements);
  const selectedIds = useStore((s) => s.selectedIds);
  const updateElement = useStore((s) => s.updateElement);
  const clearSelection = useStore((s) => s.clearSelection);
  const applyGlitchShake = useStore((s) => s.applyGlitchShake);

  const selectedElement =
    selectedIds.length === 1
      ? elements.find((e) => e.id === selectedIds[0])
      : undefined;

  const [showColorPicker, setShowColorPicker] = useState(false);
  const knobRef = useRef<SVGGElement>(null);
  const knobDragging = useRef<{ startAngle: number; startRotation: number } | null>(
    null
  );

  const pushHistoryDebounced = useRef(
    debounce((id: string) => {
      const state = useStore.getState();
      if (state) state._pushHistory();
    }, 320)
  );

  const updateAndDebounce = useCallback(
    (id: string, patch: Partial<CanvasElement>, pushDebounceKey: string) => {
      updateElement(id, patch, false);
      pushHistoryDebounced.current(id);
      void pushDebounceKey;
    },
    [updateElement]
  );

  // 旋钮手势
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!knobDragging.current || !selectedElement) return;
      const knob = knobRef.current;
      if (!knob) return;
      const svg = knob.ownerSVGElement;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      if (angle < 0) angle += 360;
      const delta = angle - knobDragging.current.startAngle;
      let newRot = knobDragging.current.startRotation + delta;
      while (newRot < 0) newRot += 360;
      newRot = newRot % 360;
      updateElement(selectedElement.id, { rotation: newRot }, false);
    };
    const onUp = () => {
      if (knobDragging.current) {
        knobDragging.current = null;
        useStore.getState()._pushHistory();
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [selectedElement, updateElement]);

  if (!selectedElement) return null;
  const preset = getPresetById(selectedElement.presetId);

  const handleKnobDown = (e: React.PointerEvent) => {
    if (!selectedElement) return;
    const svg = (e.currentTarget as SVGElement).ownerSVGElement;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (angle < 0) angle += 360;
    knobDragging.current = {
      startAngle: angle,
      startRotation: selectedElement.rotation,
    };
  };

  const sizePercent = clamp(
    Math.round(((selectedElement.width + selectedElement.height) / 2 / 400) * 100),
    10,
    300
  );

  return (
    <div
      className="glass-panel"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      <div
        style={{
          padding: '14px 16px 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.16em',
            color: 'var(--neon-magenta)',
          }}
        >
          PROPERTIES
        </div>
        {closeable && (
          <button
            className="btn-neon"
            style={{ padding: '4px 6px', minWidth: 28 }}
            onClick={clearSelection}
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        <div
          style={{
            padding: '10px 12px',
            borderRadius: 8,
            background: 'rgba(255,45,149,0.06)',
            border: '1px solid rgba(255,45,149,0.2)',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '0.04em',
            }}
          >
            {preset?.name ?? selectedElement.name}
          </div>
          <div
            style={{
              fontSize: 10,
              color: 'var(--text-muted)',
              marginTop: 2,
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            ID: {selectedElement.id.slice(0, 8)}
          </div>
        </div>

        <div>
          <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Move size={12} />
            位置
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                X
              </label>
              <input
                type="number"
                className="input-field"
                value={Math.round(selectedElement.x)}
                onChange={(e) =>
                  updateAndDebounce(
                    selectedElement.id,
                    { x: Number(e.target.value) },
                    'x'
                  )
                }
                onBlur={() => useStore.getState()._pushHistory()}
              />
            </div>
            <div>
              <label style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                Y
              </label>
              <input
                type="number"
                className="input-field"
                value={Math.round(selectedElement.y)}
                onChange={(e) =>
                  updateAndDebounce(
                    selectedElement.id,
                    { y: Number(e.target.value) },
                    'y'
                  )
                }
                onBlur={() => useStore.getState()._pushHistory()}
              />
            </div>
          </div>
        </div>

        <div>
          <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Maximize2 size={12} />
            大小 ({sizePercent}%)
          </div>
          <input
            type="range"
            className="slider-track"
            min={10}
            max={300}
            value={sizePercent}
            onChange={(e) => {
              const pct = Number(e.target.value) / 100;
              const presetRef = getPresetById(selectedElement.presetId);
              const baseW = presetRef?.defaultWidth ?? 160;
              const baseH = presetRef?.defaultHeight ?? 160;
              const newW = Math.max(10, Math.round(baseW * pct));
              const newH = Math.max(10, Math.round(baseH * pct));
              updateAndDebounce(
                selectedElement.id,
                { width: newW, height: newH },
                'size'
              );
            }}
            onMouseUp={() => useStore.getState()._pushHistory()}
            onTouchEnd={() => useStore.getState()._pushHistory()}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 6,
              fontSize: 10,
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <span>W: {selectedElement.width}px</span>
            <span>H: {selectedElement.height}px</span>
          </div>
        </div>

        <div>
          <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RotateCw size={12} />
            旋转
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              className="knob-container"
              style={{ width: 72, height: 72, margin: 0 }}
            >
              <svg
                viewBox="0 0 80 80"
                width="72"
                height="72"
                style={{ overflow: 'visible' }}
              >
                <defs>
                  <linearGradient id="kbg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="rgba(255,45,149,0.3)" />
                    <stop offset="100%" stopColor="rgba(0,240,255,0.3)" />
                  </linearGradient>
                </defs>
                <circle
                  cx="40"
                  cy="40"
                  r="35"
                  fill="rgba(0,0,0,0.5)"
                  stroke="url(#kbg)"
                  strokeWidth="2"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="28"
                  fill="rgba(255,255,255,0.04)"
                  stroke="rgba(0,240,255,0.25)"
                  strokeWidth="1"
                />
                <g
                  ref={knobRef}
                  style={{ cursor: 'grab' }}
                  onPointerDown={handleKnobDown}
                  transform={`rotate(${selectedElement.rotation} 40 40)`}
                >
                  <line
                    x1="40"
                    y1="40"
                    x2="40"
                    y2="14"
                    stroke="url(#kbg)"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <circle cx="40" cy="40" r="7" fill="var(--neon-cyan)" />
                </g>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <input
                type="number"
                className="input-field"
                min={0}
                max={360}
                value={Math.round(selectedElement.rotation)}
                onChange={(e) =>
                  updateElement(
                    selectedElement.id,
                    { rotation: clamp(Number(e.target.value), 0, 360) },
                    false
                  )
                }
                onBlur={() => useStore.getState()._pushHistory()}
              />
              <div
                style={{
                  marginTop: 8,
                  display: 'flex',
                  gap: 4,
                  flexWrap: 'wrap',
                }}
              >
                {[0, 45, 90, 135, 180, 270].map((d) => (
                  <button
                    key={d}
                    className="btn-neon"
                    style={{ padding: '3px 7px', fontSize: 10 }}
                    onClick={() => {
                      updateElement(selectedElement.id, { rotation: d }, true);
                    }}
                  >
                    {d}°
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Palette size={12} />
            颜色
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            {NEON_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  updateElement(selectedElement.id, { color: c }, true);
                  applyGlitchShake(selectedElement.id);
                }}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: c,
                  border:
                    selectedElement.color.toLowerCase() === c.toLowerCase()
                      ? '2px solid #fff'
                      : '2px solid rgba(255,255,255,0.15)',
                  cursor: 'pointer',
                  boxShadow:
                    selectedElement.color.toLowerCase() === c.toLowerCase()
                      ? `0 0 12px ${c}, inset 0 0 6px rgba(255,255,255,0.3)`
                      : `0 0 6px ${c}55`,
                  transition: 'transform 0.15s ease',
                  transform:
                    selectedElement.color.toLowerCase() === c.toLowerCase()
                      ? 'scale(1.1)'
                      : 'scale(1)',
                }}
                title={c}
              />
            ))}
            <button
              onClick={() => setShowColorPicker((v) => !v)}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: `conic-gradient(from 0deg, #ff2d95, #c77dff, #00f0ff, #39ff14, #ffb347, #ff2d95)`,
                border: '2px solid rgba(255,255,255,0.2)',
                cursor: 'pointer',
              }}
              title="自定义颜色"
            />
          </div>
          {showColorPicker && (
            <div
              style={{
                padding: 10,
                borderRadius: 10,
                background: 'rgba(10,10,20,0.9)',
                border: '1px solid rgba(0,240,255,0.3)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
              }}
            >
              <HexColorPicker
                color={selectedElement.color}
                onChange={(color) =>
                  updateAndDebounce(
                    selectedElement.id,
                    { color },
                    'color'
                  )
                }
                style={{ width: '100%' }}
              />
              <input
                type="text"
                className="input-field"
                style={{ marginTop: 8 }}
                value={selectedElement.color}
                onChange={(e) =>
                  updateElement(
                    selectedElement.id,
                    { color: e.target.value },
                    false
                  )
                }
                onBlur={() => useStore.getState()._pushHistory()}
              />
            </div>
          )}
        </div>

        <div>
          <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Zap size={12} />
            S型故障特效 ({selectedElement.glitchIntensity}%)
          </div>
          <input
            type="range"
            className="slider-track"
            min={0}
            max={100}
            value={selectedElement.glitchIntensity}
            onChange={(e) => {
              const v = Number(e.target.value);
              updateElement(selectedElement.id, { glitchIntensity: v }, false);
            }}
            onMouseUp={() => {
              useStore.getState()._pushHistory();
              if (selectedElement.glitchIntensity > 0) {
                applyGlitchShake(selectedElement.id);
              }
            }}
            onTouchEnd={() => {
              useStore.getState()._pushHistory();
              if (selectedElement.glitchIntensity > 0) {
                applyGlitchShake(selectedElement.id);
              }
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: 'var(--text-muted)' }}>
            <span>OFF</span>
            <span style={{ color: 'var(--neon-magenta)' }}>MAX</span>
          </div>
          <div
            style={{
              marginTop: 10,
              padding: 8,
              borderRadius: 6,
              background: 'rgba(255,45,149,0.05)',
              border: '1px dashed rgba(255,45,149,0.2)',
              fontSize: 10,
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            ⚡ RGB色彩分离 + 位移抖动
          </div>
        </div>
      </div>
    </div>
  );
}
