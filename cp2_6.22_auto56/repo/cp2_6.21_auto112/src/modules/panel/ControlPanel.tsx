import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChromePicker, type ColorResult } from '@hello-pangea/color-picker';
import {
  ColumnConfig,
  FONT_OPTIONS,
  getBaseColumnValue,
  getDiffPercent,
  useControls,
} from './useControls';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  baseValue: number | null;
  onChange: (value: number) => void;
  formatValue?: (v: number) => string;
}

const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min,
  max,
  step,
  unit,
  baseValue,
  onChange,
  formatValue,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<number | null>(null);

  const percent = ((value - min) / (max - min)) * 100;
  const diff = baseValue !== null ? getDiffPercent(value, baseValue) : null;
  const displayValue = formatValue ? formatValue(value) : value.toString();

  const handleMove = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      let newValue = min + ratio * (max - min);
      newValue = Math.round(newValue / step) * step;
      newValue = Math.max(min, Math.min(max, newValue));
      onChange(Number(newValue.toFixed(4)));
      setTooltipPos(ratio * 100);
    },
    [min, max, step, onChange]
  );

  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    handleMove(e.clientX);
  };

  useEffect(() => {
    if (!dragging) return;

    const onMove = (e: MouseEvent) => handleMove(e.clientX);
    const onUp = () => {
      setDragging(false);
      setTooltipPos(null);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, handleMove]);

  const onTouchStart = (e: React.TouchEvent) => {
    setDragging(true);
    handleMove(e.touches[0].clientX);
  };

  useEffect(() => {
    if (!dragging) return;

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) handleMove(e.touches[0].clientX);
    };
    const onTouchEnd = () => {
      setDragging(false);
      setTooltipPos(null);
    };

    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [dragging, handleMove]);

  const diffClass = diff
    ? diff.startsWith('+')
      ? 'slider-diff positive'
      : diff.startsWith('-')
      ? 'slider-diff negative'
      : 'slider-diff'
    : '';

  const thumbPos = tooltipPos !== null ? tooltipPos : percent;

  return (
    <div className="slider-group">
      <div className="slider-header">
        <span className="slider-label">{label}</span>
        <div className="slider-value-wrap">
          <span className="slider-value">
            {displayValue}
            {unit}
          </span>
          {diff && <span className={diffClass}>{diff}</span>}
        </div>
      </div>
      <div
        ref={trackRef}
        className={`slider-track ${dragging ? 'active' : ''}`}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        <div className="slider-fill" style={{ width: `${percent}%` }} />
        <div className="slider-thumb" style={{ left: `${thumbPos}%` }}>
          <div className="slider-tooltip">
            {displayValue}
            {unit}
          </div>
        </div>
      </div>
    </div>
  );
};

const ColorPicker: React.FC<{
  value: string;
  onChange: (hex: string) => void;
}> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const handleOpen = () => {
    if (wrapRef.current) {
      const rect = wrapRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 8, left: rect.left });
    }
    setOpen(true);
  };

  return (
    <div ref={wrapRef} className="color-picker-wrap">
      <div
        className="color-preview"
        style={{ background: value }}
        onClick={handleOpen}
      />
      <span className="color-hex">{value}</span>
      {open && (
        <>
          <div className="popover-overlay" onClick={() => setOpen(false)} />
          <div
            className="color-popover"
            style={{ top: pos?.top, left: pos?.left }}
          >
            <ChromePicker
              color={value}
              onChange={(c: ColorResult) => onChange(c.hex)}
              disableAlpha
            />
          </div>
        </>
      )}
    </div>
  );
};

export const ControlPanel: React.FC = () => {
  const {
    text,
    columns,
    selectedColumn,
    lockedColumn,
    setText,
    setSelectedColumn,
    setLockedColumn,
    setControl,
  } = useControls();

  const config: ColumnConfig = columns[selectedColumn];
  const baseNum = (key: 'fontSize' | 'lineHeight' | 'letterSpacing') => {
    const v = getBaseColumnValue(columns, lockedColumn, key);
    return typeof v === 'number' ? v : null;
  };

  const isLocked = lockedColumn === selectedColumn;

  return (
    <aside className="control-panel">
      <div className="panel-card">
        <div className="panel-card-title">文本内容</div>
        <textarea
          className="text-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="输入要对比的文本..."
          spellCheck={false}
        />
      </div>

      <div className="panel-card">
        <div className="panel-card-title">当前栏</div>
        <div className="column-tabs">
          {([0, 1, 2] as const).map((i) => (
            <button
              key={i}
              className={`column-tab ${selectedColumn === i ? 'active' : ''} ${
                lockedColumn === i ? 'locked' : ''
              }`}
              onClick={() => setSelectedColumn(i)}
            >
              栏 {i + 1}
              {lockedColumn === i ? ' 🔒' : ''}
            </button>
          ))}
        </div>

        <div className="slider-group">
          <div className="slider-header">
            <span className="slider-label">字体</span>
          </div>
          <select
            className="select-input"
            value={config.fontFamily}
            onChange={(e) =>
              setControl(selectedColumn, 'fontFamily', e.target.value)
            }
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <Slider
          label="字号"
          value={config.fontSize}
          min={12}
          max={72}
          step={1}
          unit="px"
          baseValue={baseNum('fontSize')}
          onChange={(v) => setControl(selectedColumn, 'fontSize', v)}
          formatValue={(v) => v.toFixed(0)}
        />

        <Slider
          label="行高"
          value={config.lineHeight}
          min={1.0}
          max={2.0}
          step={0.05}
          unit=""
          baseValue={baseNum('lineHeight')}
          onChange={(v) => setControl(selectedColumn, 'lineHeight', v)}
          formatValue={(v) => v.toFixed(2)}
        />

        <Slider
          label="字间距"
          value={config.letterSpacing}
          min={-0.1}
          max={0.3}
          step={0.01}
          unit="em"
          baseValue={baseNum('letterSpacing')}
          onChange={(v) => setControl(selectedColumn, 'letterSpacing', v)}
          formatValue={(v) => v.toFixed(2)}
        />
      </div>

      <div className="panel-card">
        <div className="panel-card-title">文字颜色</div>
        <ColorPicker
          value={config.color}
          onChange={(hex) => setControl(selectedColumn, 'color', hex)}
        />

        <div className="lock-btn-wrap">
          {isLocked ? (
            <button
              className="btn btn-danger"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setLockedColumn(null)}
            >
              🔓 取消基准锁定
            </button>
          ) : (
            <button
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setLockedColumn(selectedColumn)}
            >
              🔒 将此栏锁定为基准
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default ControlPanel;
