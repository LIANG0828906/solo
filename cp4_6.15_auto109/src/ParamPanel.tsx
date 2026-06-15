import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw, Download, GripVertical } from 'lucide-react';
import type { EffectParams, ScaleCurvePreset } from './types';
import { presets } from './presets';
import styles from './ParamPanel.module.css';

interface ParamPanelProps {
  params: EffectParams;
  onChange: (params: Partial<EffectParams>) => void;
  preset: string;
  onPresetChange: (preset: string) => void;
  isPlaying: boolean;
  onPlayToggle: () => void;
  onReset: () => void;
  onExport: () => void;
}

const presetOptions = Object.keys(presets);
const scaleCurveOptions: ScaleCurvePreset[] = ['linear', 'easeOut', 'sine', 'custom'];

export default function ParamPanel({
  params,
  onChange,
  preset,
  onPresetChange,
  isPlaying,
  onPlayToggle,
  onReset,
  onExport,
}: ParamPanelProps) {
  const [draggingStopId, setDraggingStopId] = useState<string | null>(null);
  const gradientBarRef = useRef<HTMLDivElement>(null);

  const handleSliderChange = (key: keyof EffectParams, value: number) => {
    onChange({ [key]: value } as Partial<EffectParams>);
  };

  const handleColorStopColorChange = useCallback(
    (id: string, color: string) => {
      const newGradient = params.colorGradient.map((stop) =>
        stop.id === id ? { ...stop, color } : stop
      );
      onChange({ colorGradient: newGradient });
    },
    [params.colorGradient, onChange]
  );

  const handleColorStopPositionChange = useCallback(
    (id: string, position: number) => {
      const newGradient = params.colorGradient.map((stop) =>
        stop.id === id ? { ...stop, position: Math.max(0, Math.min(1, position)) } : stop
      );
      onChange({ colorGradient: newGradient });
    },
    [params.colorGradient, onChange]
  );

  const handleGradientMouseDown = useCallback(
    (e: React.MouseEvent, stopId: string) => {
      e.preventDefault();
      setDraggingStopId(stopId);
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!draggingStopId || !gradientBarRef.current) return;
      const rect = gradientBarRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const position = Math.max(0, Math.min(1, x / rect.width));
      handleColorStopPositionChange(draggingStopId, Math.round(position * 100) / 100);
    },
    [draggingStopId, handleColorStopPositionChange]
  );

  const handleMouseUp = useCallback(() => {
    setDraggingStopId(null);
  }, []);

  useEffect(() => {
    if (draggingStopId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingStopId, handleMouseMove, handleMouseUp]);

  const sortedColorStops = [...params.colorGradient].sort((a, b) => a.position - b.position);

  const gradientStyle = {
    background: `linear-gradient(to right, ${sortedColorStops
      .map((stop) => `${stop.color} ${stop.position * 100}%`)
      .join(', ')})`,
  };

  const SliderControl = ({
    label,
    value,
    min,
    max,
    step = 1,
    paramKey,
    unit = '',
  }: {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    paramKey: keyof EffectParams;
    unit?: string;
  }) => (
    <div className={styles.sliderRow}>
      <div className={styles.sliderLabel}>
        <span>{label}</span>
        <span className={styles.sliderValue}>
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => handleSliderChange(paramKey, parseFloat(e.target.value))}
        className={styles.slider}
      />
    </div>
  );

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>连击特效编辑器</h1>
          <span className={styles.version}>v1.0.0</span>
        </div>
      </div>

      <div className={styles.section}>
        <label className={styles.label}>预设方案</label>
        <select
          value={preset}
          onChange={(e) => onPresetChange(e.target.value)}
          className={styles.select}
        >
          {presetOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.divider} />

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>基础设置</h2>
        <SliderControl
          label="粒子数量"
          value={params.particleCount}
          min={1}
          max={500}
          paramKey="particleCount"
        />
        <SliderControl
          label="生命周期最小值"
          value={params.lifetimeMin}
          min={0.5}
          max={5}
          step={0.1}
          paramKey="lifetimeMin"
          unit="s"
        />
        <SliderControl
          label="生命周期最大值"
          value={params.lifetimeMax}
          min={0.5}
          max={5}
          step={0.1}
          paramKey="lifetimeMax"
          unit="s"
        />
      </div>

      <div className={styles.divider} />

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>速度设置</h2>
        <SliderControl
          label="X轴速度最小值"
          value={params.velocityXMin}
          min={-300}
          max={300}
          paramKey="velocityXMin"
        />
        <SliderControl
          label="X轴速度最大值"
          value={params.velocityXMax}
          min={-300}
          max={300}
          paramKey="velocityXMax"
        />
        <SliderControl
          label="Y轴速度最小值"
          value={params.velocityYMin}
          min={-300}
          max={300}
          paramKey="velocityYMin"
        />
        <SliderControl
          label="Y轴速度最大值"
          value={params.velocityYMax}
          min={-300}
          max={300}
          paramKey="velocityYMax"
        />
      </div>

      <div className={styles.divider} />

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>发射设置</h2>
        <SliderControl
          label="发射角度起始"
          value={params.emissionAngleStart}
          min={0}
          max={360}
          paramKey="emissionAngleStart"
          unit="°"
        />
        <SliderControl
          label="发射角度结束"
          value={params.emissionAngleEnd}
          min={0}
          max={360}
          paramKey="emissionAngleEnd"
          unit="°"
        />
        <div className={styles.sliderRow}>
          <div className={styles.sliderLabel}>
            <span>原点X偏移</span>
            <span className={styles.sliderValue}>{params.originOffsetX}</span>
          </div>
          <input
            type="number"
            value={params.originOffsetX}
            onChange={(e) => handleSliderChange('originOffsetX', parseFloat(e.target.value) || 0)}
            className={styles.numberInput}
          />
        </div>
        <div className={styles.sliderRow}>
          <div className={styles.sliderLabel}>
            <span>原点Y偏移</span>
            <span className={styles.sliderValue}>{params.originOffsetY}</span>
          </div>
          <input
            type="number"
            value={params.originOffsetY}
            onChange={(e) => handleSliderChange('originOffsetY', parseFloat(e.target.value) || 0)}
            className={styles.numberInput}
          />
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>颜色设置</h2>
        <div ref={gradientBarRef} className={styles.gradientBar} style={gradientStyle}>
          {sortedColorStops.map((stop) => (
            <div
              key={stop.id}
              className={`${styles.colorStopHandle} ${draggingStopId === stop.id ? styles.dragging : ''}`}
              style={{ left: `${stop.position * 100}%` }}
              onMouseDown={(e) => handleGradientMouseDown(e, stop.id)}
            >
              <GripVertical size={12} className={styles.gripIcon} />
              <div
                className={styles.colorStopPreview}
                style={{ backgroundColor: stop.color }}
              />
            </div>
          ))}
        </div>
        <div className={styles.colorStopsList}>
          {sortedColorStops.map((stop) => (
            <div key={stop.id} className={styles.colorStopRow}>
              <input
                type="color"
                value={stop.color.startsWith('rgba') ? '#ffffff' : stop.color}
                onChange={(e) => handleColorStopColorChange(stop.id, e.target.value)}
                className={styles.colorPicker}
              />
              <input
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={stop.position}
                onChange={(e) =>
                  handleColorStopPositionChange(stop.id, parseFloat(e.target.value) || 0)
                }
                className={styles.numberInput}
              />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>形态设置</h2>
        <div className={styles.sliderRow}>
          <label className={styles.label}>缩放曲线预设</label>
          <select
            value={params.scaleCurvePreset}
            onChange={(e) =>
              onChange({ scaleCurvePreset: e.target.value as ScaleCurvePreset })
            }
            className={styles.select}
          >
            {scaleCurveOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <SliderControl
          label="旋转速度"
          value={params.rotationSpeed}
          min={-360}
          max={360}
          paramKey="rotationSpeed"
          unit="°/s"
        />
      </div>

      <div className={styles.divider} />

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>扰动设置</h2>
        <SliderControl
          label="随机偏移量"
          value={params.randomOffset}
          min={0}
          max={50}
          paramKey="randomOffset"
        />
      </div>

      <div className={styles.divider} />

      <div className={styles.buttonRow}>
        <button onClick={onPlayToggle} className={styles.playButton}>
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          <span>{isPlaying ? '暂停' : '播放'}</span>
        </button>
        <button onClick={onReset} className={styles.secondaryButton}>
          <RotateCcw size={18} />
          <span>重置</span>
        </button>
        <button onClick={onExport} className={styles.exportButton}>
          <Download size={18} />
          <span>导出</span>
        </button>
      </div>
    </div>
  );
}
