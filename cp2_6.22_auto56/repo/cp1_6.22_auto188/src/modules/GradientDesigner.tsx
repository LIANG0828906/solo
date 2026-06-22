import { useState, useRef, useCallback, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import type { ColorStop, GradientConfig, GradientType, RadialShape, GradientPreset } from './ColorEngine';
import { generateCSSGradient, DEFAULT_PRESETS } from './ColorEngine';

interface GradientDesignerProps {
  config: GradientConfig;
  onChange: (config: GradientConfig) => void;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

const BAR_WIDTH = 600;
const BAR_HEIGHT = 40;

export default function GradientDesigner({ config, onChange }: GradientDesignerProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [activeStopId, setActiveStopId] = useState<string | null>(null);
  const animationRef = useRef<number | null>(null);
  const pendingPosition = useRef<{ id: string; position: number } | null>(null);

  const gradientStyle = { backgroundImage: generateCSSGradient(config) };

  const flushPendingUpdate = useCallback(() => {
    if (pendingPosition.current) {
      const { id, position } = pendingPosition.current;
      onChange({
        ...config,
        stops: config.stops.map((s) =>
          s.id === id ? { ...s, position: Math.max(0, Math.min(100, position)) } : s
        ),
      });
      pendingPosition.current = null;
    }
    animationRef.current = null;
  }, [config, onChange]);

  const scheduleUpdate = useCallback(
    (id: string, position: number) => {
      pendingPosition.current = { id, position };
      if (!animationRef.current) {
        animationRef.current = requestAnimationFrame(flushPendingUpdate);
      }
    },
    [flushPendingUpdate]
  );

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingId) return;
    const rect = barRef.current!.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const position = Math.max(0, Math.min(100, ratio * 100));
    const newStop: ColorStop = {
      id: generateId(),
      color: '#ffffff',
      position: Math.round(position * 10) / 10,
    };
    onChange({
      ...config,
      stops: [...config.stops, newStop].sort((a, b) => a.position - b.position),
    });
    setActiveStopId(newStop.id);
  };

  const handleStopMouseDown = (e: React.MouseEvent, stopId: string) => {
    e.stopPropagation();
    setDraggingId(stopId);
    setActiveStopId(stopId);
  };

  useEffect(() => {
    if (!draggingId) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = barRef.current?.getBoundingClientRect();
      if (!rect) return;
      const ratio = (e.clientX - rect.left) / rect.width;
      const position = Math.max(0, Math.min(100, ratio * 100));
      scheduleUpdate(draggingId, Math.round(position * 10) / 10);
    };

    const handleMouseUp = () => {
      setDraggingId(null);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        flushPendingUpdate();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingId, scheduleUpdate, flushPendingUpdate]);

  const handleStopColorChange = (stopId: string, color: string) => {
    onChange({
      ...config,
      stops: config.stops.map((s) => (s.id === stopId ? { ...s, color } : s)),
    });
  };

  const handleDeleteStop = (stopId: string) => {
    if (config.stops.length <= 2) return;
    onChange({
      ...config,
      stops: config.stops.filter((s) => s.id !== stopId),
    });
    if (activeStopId === stopId) setActiveStopId(null);
  };

  const handleTypeChange = (type: GradientType) => {
    onChange({ ...config, type });
  };

  const handleAngleChange = (angle: number) => {
    onChange({ ...config, angle });
  };

  const handleRadialShapeChange = (shape: RadialShape) => {
    onChange({ ...config, radialShape: shape });
  };

  const handleCenterChange = (axis: 'centerX' | 'centerY', value: number) => {
    onChange({ ...config, [axis]: value });
  };

  const handlePresetClick = (preset: GradientPreset) => {
    onChange({
      ...preset.config,
      stops: preset.config.stops.map((s) => ({ ...s, id: generateId() })),
    });
  };

  const types: { value: GradientType; label: string }[] = [
    { value: 'linear', label: '线性' },
    { value: 'radial', label: '径向' },
    { value: 'conic', label: '锥形' },
  ];

  const activeStop = config.stops.find((s) => s.id === activeStopId);

  return (
    <div className="w-full flex flex-col gap-5">
      <div>
        <h2 className="text-sm font-semibold text-slate-200 mb-2">渐变预设</h2>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_PRESETS.map((preset) => (
            <button
              key={preset.name}
              title={preset.name}
              onClick={() => handlePresetClick(preset)}
              className="w-10 h-10 rounded-lg border-2 border-transparent hover:border-white/40 hover:scale-105"
              style={{ backgroundImage: generateCSSGradient(preset.config) }}
            />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-200 mb-2">渐变类型</h2>
        <div className="flex gap-1 bg-app-bg rounded-lg p-1">
          {types.map((t) => (
            <button
              key={t.value}
              onClick={() => handleTypeChange(t.value)}
              className={`flex-1 h-10 rounded-md text-sm font-medium relative ${
                config.type === t.value
                  ? 'text-white bg-white/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
              {config.type === t.value && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-indigo-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {(config.type === 'linear' || config.type === 'conic') && (
        <div>
          <h2 className="text-sm font-semibold text-slate-200 mb-2">
            {config.type === 'linear' ? '渐变角度' : '起始角度'}: {config.angle}°
          </h2>
          <input
            type="range"
            min={0}
            max={360}
            step={1}
            value={config.angle}
            onChange={(e) => handleAngleChange(Number(e.target.value))}
            className="w-full"
          />
        </div>
      )}

      {config.type === 'radial' && (
        <div className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-200 mb-2">形状</h2>
            <div className="flex gap-1 bg-app-bg rounded-lg p-1">
              {(['circle', 'ellipse'] as RadialShape[]).map((s) => (
                <button
                  key={s}
                  onClick={() => handleRadialShapeChange(s)}
                  className={`flex-1 h-10 rounded-md text-sm font-medium relative ${
                    config.radialShape === s
                      ? 'text-white bg-white/10'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s === 'circle' ? '圆形' : '椭圆形'}
                  {config.radialShape === s && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-indigo-500 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-200 mb-2">中心 X: {config.centerX}%</h2>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={config.centerX ?? 50}
                onChange={(e) => handleCenterChange('centerX', Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-200 mb-2">中心 Y: {config.centerY}%</h2>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={config.centerY ?? 50}
                onChange={(e) => handleCenterChange('centerY', Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-slate-200 mb-2">色带（点击添加色标）</h2>
        <div className="relative" style={{ width: '100%', maxWidth: BAR_WIDTH }}>
          <div
            ref={barRef}
            onClick={handleBarClick}
            className="relative cursor-pointer rounded-lg overflow-hidden border border-white/10"
            style={{ width: '100%', height: BAR_HEIGHT, ...gradientStyle }}
          >
            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(0,0,0,0.08)_0,rgba(0,0,0,0.08)_4px,transparent_4px,transparent_8px)]" />
          </div>

          {config.stops.map((stop) => {
            const isActive = activeStopId === stop.id;
            return (
              <div
                key={stop.id}
                className="absolute -translate-x-1/2"
                style={{ left: `${stop.position}%`, top: 0 }}
              >
                <div className="text-[10px] text-slate-300 text-center mb-1 font-mono">
                  {stop.position.toFixed(1)}%
                </div>
                <div
                  onMouseDown={(e) => handleStopMouseDown(e, stop.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveStopId(isActive ? null : stop.id);
                  }}
                  className={`w-4 h-4 rounded-full cursor-grab active:cursor-grabbing border-2 ${
                    isActive ? 'border-white scale-125' : 'border-white/70'
                  } shadow-lg`}
                  style={{ backgroundColor: stop.color }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {activeStop && (
        <div className="bg-app-bg rounded-lg p-3 flex items-center gap-3">
          <input
            type="color"
            value={activeStop.color}
            onChange={(e) => handleStopColorChange(activeStop.id, e.target.value)}
            className="w-10 h-10 rounded-lg cursor-pointer"
          />
          <input
            type="text"
            value={activeStop.color}
            onChange={(e) => handleStopColorChange(activeStop.id, e.target.value)}
            className="flex-1 bg-panel-bg border border-white/10 rounded-md px-3 py-2 text-sm font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
            maxLength={7}
          />
          <button
            onClick={() => handleDeleteStop(activeStop.id)}
            disabled={config.stops.length <= 2}
            className="p-2 rounded-md hover:bg-red-500/20 text-slate-400 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed"
            title={config.stops.length <= 2 ? '至少保留2个色标' : '删除色标'}
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}

      <div className="text-xs text-slate-500">
        当前色标数量: {config.stops.length} / 建议2-8个
      </div>
    </div>
  );
}
