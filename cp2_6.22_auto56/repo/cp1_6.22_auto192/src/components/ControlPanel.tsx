import { useState } from 'react';
import type {
  SceneLight,
  LightType,
  EnvConfig,
  SpotLight,
  PointLight,
  DirectionalLight,
  HdrPreset,
  Vec3,
} from '../modules/SceneController';

interface ControlPanelProps {
  lights: SceneLight[];
  env: EnvConfig;
  onAddLight: (type: LightType) => void;
  onUpdateLight: (id: string, patch: Partial<SceneLight>) => void;
  onRemoveLight: (id: string) => void;
  onUpdateEnv: (patch: Partial<EnvConfig>) => void;
  onCapture: () => void;
  onClose?: () => void;
}

const HDR_OPTIONS: { value: HdrPreset; label: string }[] = [
  { value: 'studio', label: '工作室 Studio' },
  { value: 'sunset', label: '日落 Sunset' },
  { value: 'forest', label: '森林 Forest' },
  { value: 'night', label: '夜景 Night' },
];

const LIGHT_TYPE_LABELS: Record<LightType, string> = {
  spot: '聚光灯',
  point: '点光源',
  directional: '平行光',
};

function LightTypeIcon({ type }: { type: LightType }) {
  if (type === 'spot') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
        <path d="M12 2L4 20h16L12 2z" />
      </svg>
    );
  }
  if (type === 'point') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="#374151">
        <circle cx="12" cy="12" r="6" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5">
      <line x1="4" y1="20" x2="20" y2="4" />
    </svg>
  );
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  unit?: string;
}

function Slider({ label, value, min, max, step, onChange, unit = '' }: SliderProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#374151' }}>
        <span>{label}</span>
        <span style={{ fontWeight: 600, color: '#6366F1' }}>
          {typeof value === 'number' ? value.toFixed(step < 1 ? 2 : 0) : value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{
          width: '100%',
          height: 6,
          WebkitAppearance: 'none',
          appearance: 'none',
          background: '#D1D5DB',
          borderRadius: 3,
          outline: 'none',
          cursor: 'pointer',
        }}
      />
    </div>
  );
}

interface Vec3InputProps {
  label: string;
  value: Vec3;
  min: number;
  max: number;
  step: number;
  onChange: (v: Vec3) => void;
}

function Vec3Input({ label, value, min, max, step, onChange }: Vec3InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 12, color: '#374151' }}>{label}</div>
      <div style={{ display: 'flex', gap: 6 }}>
        {(['x', 'y', 'z'] as const).map((axis) => (
          <div key={axis} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 10, color: '#6B7280', textTransform: 'uppercase' }}>{axis}</span>
            <input
              type="number"
              min={min}
              max={max}
              step={step}
              value={value[axis]}
              onChange={(e) =>
                onChange({ ...value, [axis]: parseFloat(e.target.value) || 0 })
              }
              style={{
                padding: '4px 6px',
                fontSize: 12,
                border: '1px solid #D1D5DB',
                borderRadius: 4,
                background: '#fff',
                color: '#111827',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

interface ColorPickerProps {
  value: string;
  onChange: (v: string) => void;
}

function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 12, color: '#374151', flex: 1 }}>颜色</span>
      <div style={{ position: 'relative' }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: value,
            border: '2px solid #E5E7EB',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        />
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 28,
            height: 28,
            opacity: 0,
            cursor: 'pointer',
          }}
        />
      </div>
      <span style={{ fontSize: 11, color: '#6B7280', fontFamily: 'monospace' }}>{value}</span>
    </div>
  );
}

interface LightCardProps {
  light: SceneLight;
  onUpdate: (patch: Partial<SceneLight>) => void;
  onRemove: () => void;
}

function LightCard({ light, onUpdate, onRemove }: LightCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {showConfirm && (
        <div
          onClick={() => setShowConfirm(false)}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              padding: 16,
              borderRadius: 8,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 13, color: '#374151', marginBottom: 12 }}>确定删除该光源？</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  padding: '6px 14px',
                  background: '#E5E7EB',
                  color: '#374151',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                取消
              </button>
              <button
                onClick={onRemove}
                style={{
                  padding: '6px 14px',
                  background: '#EF4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <LightTypeIcon type={light.type} />
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: 4,
            background: light.color,
            border: '1px solid #E5E7EB',
          }}
        />
        <span
          style={{
            fontFamily: '"Microsoft YaHei", "微软雅黑", sans-serif',
            fontSize: 14,
            fontWeight: 700,
            color: '#374151',
            flex: 1,
          }}
        >
          {LIGHT_TYPE_LABELS[light.type]}
        </span>
        <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>
          {light.intensity.toFixed(1)}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowConfirm(true);
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#B91C1C')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#EF4444')}
          style={{
            width: 24,
            height: 24,
            borderRadius: 4,
            background: '#EF4444',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 700,
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ×
        </button>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#6B7280"
          strokeWidth="2"
          style={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.2s',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      {expanded && (
        <div
          style={{
            padding: '4px 12px 14px',
            borderTop: '1px solid #F3F4F6',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <ColorPicker value={light.color} onChange={(v) => onUpdate({ color: v })} />
          <Slider
            label="强度"
            value={light.intensity}
            min={0}
            max={5}
            step={0.1}
            onChange={(v) => onUpdate({ intensity: v })}
          />
          <Vec3Input
            label="位置"
            value={light.position}
            min={-5}
            max={5}
            step={0.1}
            onChange={(v) => onUpdate({ position: v })}
          />
          {light.type === 'spot' && (
            <>
              <Vec3Input
                label="目标点"
                value={(light as SpotLight).target}
                min={-5}
                max={5}
                step={0.1}
                onChange={(v) => onUpdate({ target: v } as Partial<SceneLight>)}
              />
              <Slider
                label="锥角"
                value={(light as SpotLight).angle}
                min={10}
                max={90}
                step={1}
                unit="°"
                onChange={(v) => onUpdate({ angle: v } as Partial<SceneLight>)}
              />
            </>
          )}
          {light.type === 'point' && (
            <Slider
              label="衰减距离"
              value={(light as PointLight).distance}
              min={1}
              max={20}
              step={0.5}
              onChange={(v) => onUpdate({ distance: v } as Partial<SceneLight>)}
            />
          )}
          {light.type === 'directional' && (
            <Vec3Input
              label="方向"
              value={(light as DirectionalLight).direction}
              min={-1}
              max={1}
              step={0.1}
              onChange={(v) => onUpdate({ direction: v } as Partial<SceneLight>)}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function ControlPanel({
  lights,
  env,
  onAddLight,
  onUpdateLight,
  onRemoveLight,
  onUpdateEnv,
  onCapture,
  onClose,
}: ControlPanelProps) {
  const [showAddDropdown, setShowAddDropdown] = useState(false);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#F9FAFB',
        borderLeft: '1px solid #E5E7EB',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"Microsoft YaHei", "微软雅黑", sans-serif',
      }}
    >
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 700,
            color: '#111827',
          }}
        >
          灯光控制面板
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 20,
              color: '#6B7280',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            ×
          </button>
        )}
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowAddDropdown(!showAddDropdown)}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: '#6366F1',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
            添加光源
          </button>
          {showAddDropdown && (
            <>
              <div
                onClick={() => setShowAddDropdown(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 5 }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  right: 0,
                  background: '#fff',
                  borderRadius: 8,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  overflow: 'hidden',
                  zIndex: 10,
                }}
              >
                {(['spot', 'point', 'directional'] as LightType[]).map((type) => (
                  <div
                    key={type}
                    onClick={() => {
                      onAddLight(type);
                      setShowAddDropdown(false);
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F3F4F6')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                    style={{
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                  >
                    <LightTypeIcon type={type} />
                    <span style={{ fontSize: 13, color: '#374151' }}>
                      {LIGHT_TYPE_LABELS[type]}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {lights.length === 0 && (
            <div
              style={{
                padding: 20,
                textAlign: 'center',
                color: '#9CA3AF',
                fontSize: 13,
                border: '1px dashed #D1D5DB',
                borderRadius: 8,
              }}
            >
              暂无光源，点击上方按钮添加
            </div>
          )}
          {lights.map((light) => (
            <LightCard
              key={light.id}
              light={light}
              onUpdate={(patch) => onUpdateLight(light.id, patch)}
              onRemove={() => onRemoveLight(light.id)}
            />
          ))}
        </div>

        <div
          style={{
            background: '#fff',
            borderRadius: 8,
            padding: 14,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#374151',
              marginBottom: -4,
            }}
          >
            环境设置
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#374151' }}>HDR 环境贴图</span>
            <select
              value={env.hdrPreset}
              onChange={(e) => onUpdateEnv({ hdrPreset: e.target.value as HdrPreset })}
              style={{
                padding: '8px 10px',
                fontSize: 13,
                border: '1px solid #D1D5DB',
                borderRadius: 6,
                background: '#fff',
                color: '#111827',
                cursor: 'pointer',
              }}
            >
              {HDR_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <Slider
            label="环境光强度"
            value={env.ambientIntensity}
            min={0}
            max={5}
            step={0.1}
            onChange={(v) => onUpdateEnv({ ambientIntensity: v })}
          />
        </div>

        <div
          style={{
            background: '#fff',
            borderRadius: 8,
            padding: 14,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#374151',
            }}
          >
            Bloom 后处理
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => onUpdateEnv({ bloomEnabled: !env.bloomEnabled })}
              style={{
                width: 40,
                height: 22,
                borderRadius: 11,
                background: env.bloomEnabled ? '#6366F1' : '#D1D5DB',
                border: 'none',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background 0.2s',
                padding: 0,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 2,
                  left: env.bloomEnabled ? 20 : 2,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  transition: 'left 0.2s',
                }}
              />
            </button>
            <span style={{ fontSize: 13, color: '#374151' }}>
              {env.bloomEnabled ? '已开启' : '已关闭'}
            </span>
          </div>
          {env.bloomEnabled && (
            <Slider
              label="泛光强度"
              value={env.bloomIntensity}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => onUpdateEnv({ bloomIntensity: v })}
            />
          )}
        </div>
      </div>

      <div style={{ padding: 16, borderTop: '1px solid #E5E7EB' }}>
        <button
          onClick={onCapture}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.95)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#6B7280';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#4B5563';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: '#4B5563',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          截图导出 (1500×1500)
        </button>
      </div>
    </div>
  );
}
