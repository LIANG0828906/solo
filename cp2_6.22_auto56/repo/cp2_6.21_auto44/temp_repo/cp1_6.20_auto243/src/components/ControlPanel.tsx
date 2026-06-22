import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { CityData, WindParams, WindPreset } from '../types';
import { CITIES } from '../utils/cityData';
import styles from '../styles/controlPanel.module.css';

interface ControlPanelProps {
  city: CityData;
  wind: WindParams;
  particleCount: number;
  presets: WindPreset[];
  onCityChange: (id: string) => void;
  onWindChange: (wind: WindParams) => void;
  onParticleCountChange: (n: number) => void;
  onSavePreset: (name: string) => void;
  onLoadPreset: (preset: WindPreset) => void;
  onDeletePreset: (id: string) => void;
  onResetCamera: () => void;
}

function WindIcon(): JSX.Element {
  return (
    <svg
      className={styles.titleIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
    </svg>
  );
}

function ControlPanel({
  city,
  wind,
  particleCount,
  presets,
  onCityChange,
  onWindChange,
  onParticleCountChange,
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
  onResetCamera,
}: ControlPanelProps): JSX.Element {
  const [presetName, setPresetName] = useState('');
  const knobRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  const updateWind = useCallback(
    (patch: Partial<WindParams>): void => {
      onWindChange({ ...wind, ...patch });
    },
    [wind, onWindChange]
  );

  const handleKnobInteraction = useCallback(
    (clientX: number, clientY: number): void => {
      if (!knobRef.current) return;
      const rect = knobRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      let angle = Math.atan2(dx, -dy) * (180 / Math.PI);
      if (angle < 0) angle += 360;
      angle = Math.round(angle) % 360;
      updateWind({ direction: angle });
    },
    [updateWind]
  );

  useEffect((): (() => void) => {
    const handleMove = (e: MouseEvent): void => {
      if (!draggingRef.current) return;
      handleKnobInteraction(e.clientX, e.clientY);
    };
    const handleUp = (): void => {
      draggingRef.current = false;
      document.body.style.cursor = '';
    };
    const handleTouchMove = (e: TouchEvent): void => {
      if (!draggingRef.current || e.touches.length === 0) return;
      const t = e.touches[0];
      handleKnobInteraction(t.clientX, t.clientY);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleUp);
    return (): void => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [handleKnobInteraction]);

  const directionLabel = useMemo((): string => {
    const dirs = [
      '北 N',
      '东北 NE',
      '东 E',
      '东南 SE',
      '南 S',
      '西南 SW',
      '西 W',
      '西北 NW',
    ];
    const idx = Math.round(wind.direction / 45) % 8;
    return dirs[idx];
  }, [wind.direction]);

  const handleSave = useCallback((): void => {
    const name = presetName.trim() || `预设 ${presets.length + 1}`;
    onSavePreset(name);
    setPresetName('');
  }, [presetName, presets.length, onSavePreset]);

  const handleCardClick = useCallback(
    (e: React.MouseEvent, preset: WindPreset): void => {
      if ((e.target as HTMLElement).closest('[data-delete]')) return;
      onLoadPreset(preset);
    },
    [onLoadPreset]
  );

  return (
    <>
      <button
        className={`${styles.btn} ${styles.btnSecondary} ${styles.resetBtn}`}
        onClick={onResetCamera}
        type="button"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
        重置视角
      </button>

      <aside className={styles.panel}>
        <h2 className={styles.title}>
          <WindIcon />
          风场控制面板
        </h2>

        <section className={styles.section}>
          <div className={styles.sectionTitle}>城市选择</div>
          <select
            className={styles.citySelector}
            value={city.id}
            onChange={(e): void => onCityChange(e.target.value)}
          >
            {CITIES.map((c): JSX.Element => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionTitle}>风力参数</div>

          <div className={styles.fieldRow}>
            <div className={styles.fieldLabel}>
              <span>风速</span>
              <span className={styles.fieldValue}>
                {wind.speed.toFixed(1)} m/s
              </span>
            </div>
            <input
              type="range"
              className={styles.slider}
              min={0}
              max={20}
              step={0.1}
              value={wind.speed}
              onChange={(e): void =>
                updateWind({ speed: parseFloat(e.target.value) })
              }
            />
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.fieldLabel}>
              <span>
                风向 <span style={{ opacity: 0.6 }}>({directionLabel})</span>
              </span>
              <span className={styles.fieldValue}>
                {Math.round(wind.direction)}°
              </span>
            </div>
            <div className={styles.knobRow}>
              <div
                ref={knobRef}
                className={styles.knobWrap}
                onMouseDown={(e): void => {
                  draggingRef.current = true;
                  document.body.style.cursor = 'grabbing';
                  handleKnobInteraction(e.clientX, e.clientY);
                }}
                onTouchStart={(e): void => {
                  if (e.touches.length === 0) return;
                  draggingRef.current = true;
                  const t = e.touches[0];
                  handleKnobInteraction(t.clientX, t.clientY);
                }}
              >
                <div className={styles.knobRing} />
                <div
                  className={styles.knobInner}
                  style={{ transform: `rotate(${wind.direction}deg)` }}
                >
                  <div
                    className={styles.knobPointer}
                    style={{ transform: `rotate(${-wind.direction}deg)` }}
                  />
                  <div
                    style={{ transform: `rotate(${-wind.direction}deg)` }}
                  >
                    <div className={styles.knobValue}>
                      {Math.round(wind.direction)}
                    </div>
                    <div className={styles.knobUnit}>DEGREE</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.fieldLabel}>
              <span>湍流强度</span>
              <span className={styles.fieldValue}>
                {wind.turbulence.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              className={`${styles.slider} ${styles.sliderNeutral}`}
              min={0}
              max={1}
              step={0.01}
              value={wind.turbulence}
              onChange={(e): void =>
                updateWind({ turbulence: parseFloat(e.target.value) })
              }
            />
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.fieldLabel}>
              <span>粒子数量</span>
              <span className={styles.fieldValue}>{particleCount}</span>
            </div>
            <input
              type="range"
              className={`${styles.slider} ${styles.sliderNeutral}`}
              min={200}
              max={1000}
              step={100}
              value={particleCount}
              onChange={(e): void =>
                onParticleCountChange(parseInt(e.target.value, 10))
              }
            />
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionTitle}>风场预设</div>
          <div className={styles.saveRow} style={{ marginBottom: 14 }}>
            <input
              type="text"
              className={styles.nameInput}
              placeholder="输入预设名称..."
              value={presetName}
              onChange={(e): void => setPresetName(e.target.value)}
              onKeyDown={(e): void => {
                if (e.key === 'Enter') handleSave();
              }}
            />
            <button
              className={styles.btn}
              type="button"
              onClick={handleSave}
              style={{ width: 'auto', padding: '10px 14px', flexShrink: 0 }}
            >
              保存
            </button>
          </div>
          {presets.length === 0 ? (
            <div className={styles.emptyHint}>
              暂无保存的预设。
              <br />
              调整参数后点击上方按钮即可保存。
            </div>
          ) : (
            <div className={styles.presetList}>
              {presets.map((p): JSX.Element => (
                <div
                  key={p.id}
                  className={styles.presetCard}
                  onClick={(e): void => handleCardClick(e, p)}
                >
                  <div className={styles.presetName}>{p.name}</div>
                  <div className={styles.presetMeta}>
                    <span className={styles.chip}>
                      {p.wind.speed.toFixed(1)} m/s
                    </span>
                    <span className={`${styles.chip} ${styles.chipDir}`}>
                      {Math.round(p.wind.direction)}°
                    </span>
                    <span className={`${styles.chip} ${styles.chipTurb}`}>
                      湍流 {p.wind.turbulence.toFixed(2)}
                    </span>
                    <span className={styles.chip}>{p.particleCount} 粒子</span>
                  </div>
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    data-delete
                    onClick={(e): void => {
                      e.stopPropagation();
                      onDeletePreset(p.id);
                    }}
                    title="删除预设"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </aside>
    </>
  );
}

export default ControlPanel;
