import { useEffect, useRef, useState } from 'react';
import {
  useTypographyStore,
  FontWeight,
} from '../store/typographyStore';
import {
  FONT_LIBRARY,
  CONTRAST_MODES,
  ContrastModeId,
  findFontById,
  getFontStack,
} from '../utils/fontLoader';
import styles from './ControlPanel.module.css';

interface ControlPanelProps {
  collapsed?: boolean;
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
}

function CustomSlider({ label, value, min, max, step, unit, onChange }: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const percentage = ((value - min) / (max - min)) * 100;

  const formatValue = () => {
    if (unit) return `${value}${unit}`;
    if (label === '字号') return `${value}pt`;
    if (label === '行距') return `${value.toFixed(1)}x`;
    if (label === '字距') return `${value >= 0 ? '+' : ''}${value.toFixed(2)}em`;
    return String(value);
  };

  return (
    <div className={styles.sliderItem}>
      <div className={styles.sliderHeader}>
        <span className={styles.sliderLabel}>{label}</span>
        <span className={styles.sliderValue}>{formatValue()}</span>
      </div>
      <div className={styles.sliderTrack} ref={trackRef}>
        <div
          className={styles.sliderFill}
          style={{ width: `${percentage}%` }}
        />
        <div
          className={styles.sliderThumb}
          style={{ left: `${percentage}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={styles.sliderInput}
        />
      </div>
    </div>
  );
}

interface FontSelectProps {
  label: string;
  value: string;
  onChange: (id: string) => void;
  currentWeight: FontWeight;
}

function FontSelect({ label, value, onChange, currentWeight }: FontSelectProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selectedFont = findFontById(value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const weightLabel: Record<FontWeight, string> = {
    light: '细体',
    regular: '常规',
    bold: '粗体',
  };

  const categoryLabel: Record<string, string> = {
    serif: '衬线',
    'sans-serif': '无衬线',
    handwriting: '手写',
    decorative: '装饰',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <span className={styles.sliderLabel} style={{ fontWeight: 500 }}>
        {label}
      </span>
      <div className={styles.selectWrapper} ref={wrapperRef}>
        <button
          type="button"
          className={styles.select}
          style={{
            fontFamily: selectedFont ? getFontStack(selectedFont) : 'inherit',
            textAlign: 'left',
          }}
          onClick={() => setOpen((v) => !v)}
        >
          {selectedFont ? `${selectedFont.nameCN} · ${selectedFont.name}` : '请选择字体'}
        </button>
        <svg
          className={styles.selectArrow}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ transform: open ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%)' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
        <div className={`${styles.optionsContainer} ${open ? styles.open : ''}`}>
          {FONT_LIBRARY.map((font) => {
            const weightValues: Record<FontWeight, number> = {
              light: 300,
              regular: 400,
              bold: 700,
            };
            const isSupported = font.weights.includes(
              weightValues[currentWeight] as 300 | 400 | 700
            );
            return (
              <div
                key={font.id}
                className={`${styles.option} ${value === font.id ? styles.selected : ''}`}
                style={{
                  fontFamily: getFontStack(font),
                  opacity: isSupported ? 1 : 0.4,
                }}
                onClick={() => {
                  onChange(font.id);
                  setOpen(false);
                }}
              >
                <span className={styles.optionName}>
                  {font.nameCN} · {font.name}
                </span>
                <span className={styles.optionMeta}>
                  {categoryLabel[font.category]}
                  {isSupported
                    ? ` · 支持${weightLabel[currentWeight]}`
                    : ` · 不支持${weightLabel[currentWeight]}，切换时自动适配`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ControlPanel({ collapsed = false }: ControlPanelProps) {
  const state = useTypographyStore();

  return (
    <aside className={`${styles.panel} ${collapsed ? styles.collapsed : ''}`}>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <span>📝</span>文字内容
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <input
              type="text"
              className={styles.textInput}
              placeholder="输入标题文字（最多100字符）"
              value={state.titleText}
              onChange={(e) => state.setTitleText(e.target.value)}
              maxLength={100}
            />
            <span className={styles.charCount}>
              {state.titleText.length}/100
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <input
              type="text"
              className={styles.textInput}
              placeholder="输入正文文字（最多100字符）"
              value={state.bodyText}
              onChange={(e) => state.setBodyText(e.target.value)}
              maxLength={100}
            />
            <span className={styles.charCount}>
              {state.bodyText.length}/100
            </span>
          </div>
        </div>
      </section>

      {!collapsed && <hr className={styles.divider} />}

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <span>🔤</span>字体选择
        </h3>
        <div
          style={{
            display: 'flex',
            flexDirection: collapsed ? 'row' : 'column',
            gap: '14px',
            width: '100%',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: collapsed ? 200 : 'auto' }}>
            <FontSelect
              label="标题字体"
              value={state.titleFontId}
              onChange={state.setTitleFontId}
              currentWeight={state.fontWeight}
            />
          </div>
          <div style={{ flex: 1, minWidth: collapsed ? 200 : 'auto' }}>
            <FontSelect
              label="正文字体"
              value={state.bodyFontId}
              onChange={state.setBodyFontId}
              currentWeight={state.fontWeight}
            />
          </div>
        </div>
      </section>

      {!collapsed && <hr className={styles.divider} />}

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <span>⚙️</span>排版参数
        </h3>
        <div className={styles.sliderGroup}>
          <CustomSlider
            label="字号"
            value={state.fontSize}
            min={12}
            max={72}
            step={1}
            onChange={state.setFontSize}
          />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              minWidth: collapsed ? 200 : 'auto',
            }}
          >
            <span className={styles.sliderLabel} style={{ fontWeight: 500 }}>
              字重
            </span>
            <div className={styles.segmentedControl}>
              {(['light', 'regular', 'bold'] as FontWeight[]).map((w) => (
                <button
                  key={w}
                  type="button"
                  className={`${styles.segmentedBtn} ${
                    state.fontWeight === w ? styles.active : ''
                  }`}
                  onClick={() => state.setFontWeight(w)}
                >
                  {w === 'light' ? '细体' : w === 'regular' ? '常规' : '粗体'}
                </button>
              ))}
            </div>
          </div>
          <CustomSlider
            label="行距"
            value={state.lineHeight}
            min={0.8}
            max={2.0}
            step={0.1}
            onChange={state.setLineHeight}
          />
          <CustomSlider
            label="字距"
            value={state.letterSpacing}
            min={-0.05}
            max={0.2}
            step={0.01}
            onChange={state.setLetterSpacing}
          />
        </div>
      </section>

      {!collapsed && <hr className={styles.divider} />}

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <span>🎨</span>对比度模式
        </h3>
        <div className={styles.contrastButtons}>
          {(Object.keys(CONTRAST_MODES) as ContrastModeId[]).map((mode) => (
            <button
              key={mode}
              type="button"
              className={`${styles.contrastBtn} ${
                state.contrastMode === mode ? styles.active : ''
              }`}
              onClick={() => state.setContrastMode(mode)}
              title={CONTRAST_MODES[mode].label}
            >
              {CONTRAST_MODES[mode].label.replace('对比度', '')}
            </button>
          ))}
        </div>
        <div className={styles.contrastPercentage}>
          当前对比度: {CONTRAST_MODES[state.contrastMode].percentage}%
        </div>
      </section>
    </aside>
  );
}
