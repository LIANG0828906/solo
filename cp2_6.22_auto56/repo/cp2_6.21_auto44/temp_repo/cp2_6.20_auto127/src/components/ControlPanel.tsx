import { useState } from 'react';
import { useSceneStore } from '../store/sceneStore';
import type { GeometryType } from '../types';

const BoxIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
    <line x1="12" y1="22.08" x2="12" y2="12"></line>
  </svg>
);

const SphereIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <ellipse cx="12" cy="12" rx="10" ry="4"></ellipse>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
  </svg>
);

const CylinderIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
  </svg>
);

const TorusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="12" rx="10" ry="4"></ellipse>
    <ellipse cx="12" cy="12" rx="5" ry="1.5"></ellipse>
  </svg>
);

const ConeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 22h20L12 2z"></path>
    <ellipse cx="12" cy="22" rx="10" ry="2"></ellipse>
  </svg>
);

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

function Slider({ label, value, min, max, step, onChange }: SliderProps) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>{label}</span>
        <span style={{ fontSize: '12px', color: '#ffffff', fontWeight: 500 }}>
          {typeof value === 'number' ? value.toFixed(step < 1 ? 2 : 0) : value}
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
          height: '4px',
          borderRadius: '2px',
          appearance: 'none',
          background: 'rgba(255,255,255,0.1)',
          outline: 'none',
          cursor: 'pointer',
          WebkitAppearance: 'none'
        }}
      />
    </div>
  );
}

interface Vec3SlidersProps {
  title: string;
  values: { x: number; y: number; z: number };
  min: number;
  max: number;
  step: number;
  onChange: (axis: 'x' | 'y' | 'z', value: number) => void;
}

function Vec3Sliders({ title, values, min, max, step, onChange }: Vec3SlidersProps) {
  const [collapsed, setCollapsed] = useState(title !== '位置');

  return (
    <div style={{ marginBottom: '8px' }}>
      <div
        onClick={() => setCollapsed(!collapsed)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 0',
          cursor: 'pointer',
          borderBottom: collapsed ? 'none' : '1px solid rgba(255,255,255,0.08)',
          marginBottom: collapsed ? '0' : '10px'
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{title}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{
            transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            color: 'rgba(255,255,255,0.5)'
          }}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
      {!collapsed && (
        <>
          <Slider label="X" value={values.x} min={min} max={max} step={step} onChange={(v) => onChange('x', v)} />
          <Slider label="Y" value={values.y} min={min} max={max} step={step} onChange={(v) => onChange('y', v)} />
          <Slider label="Z" value={values.z} min={min} max={max} step={step} onChange={(v) => onChange('z', v)} />
        </>
      )}
    </div>
  );
}

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '40px',
            height: '30px',
            border: 'none',
            borderRadius: '6px',
            background: 'transparent',
            cursor: 'pointer',
            padding: '0'
          }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            padding: '6px 10px',
            borderRadius: '6px',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.04)',
            color: '#ffffff',
            fontSize: '12px',
            fontFamily: 'monospace',
            outline: 'none'
          }}
        />
      </div>
    </div>
  );
}

const GeometryButton = ({
  type,
  className,
  icon,
  label
}: {
  type: GeometryType;
  className: string;
  icon: React.ReactNode;
  label: string;
}) => {
  const { addGeometry } = useSceneStore();
  return (
    <button className={`geo-btn ${className}`} onClick={() => addGeometry(type)}>
      {icon}
      <span>{label}</span>
    </button>
  );
};

function SelectedControls() {
  const { selectedId, geometries, updateGeometry, removeGeometry } = useSceneStore();
  const selected = geometries.find((g) => g.id === selectedId);

  if (!selected) return null;

  return (
    <div style={{ paddingTop: '4px 0' }}>
      <Vec3Sliders
        title="位置"
        values={selected.position}
        min={-10}
        max={10}
        step={0.1}
        onChange={(axis, value) =>
          updateGeometry(selectedId, { position: { ...selected.position, [axis]: value } })
        }
      />
      <Vec3Sliders
        title="旋转"
        values={selected.rotation}
        min={0}
        max={360}
        step={1}
        onChange={(axis, value) =>
          updateGeometry(selectedId, { rotation: { ...selected.rotation, [axis]: value } })
        }
      />
      <Vec3Sliders
        title="缩放"
        values={selected.scale}
        min={0.1}
        max={5}
        step={0.1}
        onChange={(axis, value) =>
          updateGeometry(selectedId, { scale: { ...selected.scale, [axis]: value } })
        }
      />

      <div style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '10px' }}>
          材质
        </div>
        <ColorPicker
          label="颜色"
          value={selected.material.color}
          onChange={(v) => updateGeometry(selectedId, { material: { ...selected.material, color: v } })}
        />
        <Slider
          label="粗糙度"
          value={selected.material.roughness}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => updateGeometry(selectedId, { material: { ...selected.material, roughness: v } })}
        />
        <Slider
          label="金属度"
          value={selected.material.metalness}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => updateGeometry(selectedId, { material: { ...selected.material, metalness: v } })}
        />
      </div>

      <button
        onClick={() => removeGeometry(selectedId)}
        style={{
          width: '100%',
          marginTop: '12px',
          padding: '10px',
          borderRadius: '8px',
          border: '1px solid rgba(255,107,107,0.3)',
          background: 'rgba(255,107,107,0.1)',
          color: '#ff6b6b',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 500,
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLButtonElement).style.background = 'rgba(255,107,107,0.2)';
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLButtonElement).style.background = 'rgba(255,107,107,0.1)';
        }}
      >
        删除物体
      </button>
    </div>
  );
}

function LightingControls() {
  const { lighting, setLighting } = useSceneStore();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div>
      <div
        onClick={() => setCollapsed(!collapsed)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 0',
          cursor: 'pointer',
          borderBottom: collapsed ? 'none' : '1px solid rgba(255,255,255,0.08)',
          marginBottom: collapsed ? '0' : '10px'
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>灯光</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{
            transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            color: 'rgba(255,255,255,0.5)'
          }}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
      {!collapsed && (
        <>
          <Slider
          label="环境光强度"
          value={lighting.ambientIntensity}
          min={0.1}
          max={1}
          step={0.05}
          onChange={(v) => setLighting({ ambientIntensity: v })}
        />
          <Slider
          label="点光源强度"
          value={lighting.pointLightIntensity}
          min={0}
          max={2}
          step={0.1}
          onChange={(v) => setLighting({ pointLightIntensity: v })}
        />
          <Vec3Sliders
            title="点光源位置"
            values={lighting.pointLightPosition}
            min={-10}
            max={10}
            step={0.5}
            onChange={(axis, value) =>
              setLighting({ pointLightPosition: { ...lighting.pointLightPosition, [axis]: value } })
            }
          />
        </>
      )}
    </div>
  );
}

function ControlPanel() {
  const { selectedId, transformMode, setTransformMode, geometries } = useSceneStore();

  const modeLabels: Record<string, string> = {
    translate: '移动模式 (G/W)',
    rotate: '旋转模式 (R)',
    scale: '缩放模式 (S)'
  };

  return (
    <div className="control-panel glass-panel leva-container" style={{ overflowY: 'auto' }}>
      <div className="panel-section">
        <div className="panel-title">添加几何体</div>
        <div className="geometry-buttons">
          <GeometryButton type="box" className="geo-btn-box" icon={<BoxIcon />} label="立方体" />
          <GeometryButton type="sphere" className="geo-btn-sphere" icon={<SphereIcon />} label="球体" />
          <GeometryButton type="cylinder" className="geo-btn-cylinder" icon={<CylinderIcon />} label="圆柱体" />
          <GeometryButton type="torus" className="geo-btn-torus" icon={<TorusIcon />} label="圆环" />
          <GeometryButton type="cone" className="geo-btn-cone" icon={<ConeIcon />} label="圆锥" />
        </div>
      </div>

      {selectedId && (
        <div className="panel-section" style={{ paddingBottom: '8px' }}>
          <div className="transform-hint">
            <div className="transform-hint-text">
              当前：<strong>{modeLabels[transformMode]}</strong>
            </div>
            <div className="transform-hint-text" style={{ marginTop: '6px', fontSize: '11px' }}>
              快捷键: <span className="transform-hint-key">G</span>/<span className="transform-hint-key">W</span> 移动
              <span className="transform-hint-key">R</span> 旋转
              <span className="transform-hint-key">S</span> 缩放
              <span className="transform-hint-key">Delete</span> 删除
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
            {(['translate', 'rotate', 'scale'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setTransformMode(mode)}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: transformMode === mode ? '1px solid #5f27cd' : '1px solid rgba(255,255,255,0.1)',
                  background: transformMode === mode ? 'rgba(95,39,205,0.3)' : 'rgba(255,255,255,0.04)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '12px',
                  transition: 'all 0.2s ease'
                }}
              >
                {mode === 'translate' ? '移动' : mode === 'rotate' ? '旋转' : '缩放'}
              </button>
            ))}
          </div>
          <SelectedControls />
        </div>
      )}

      {!selectedId && (
        <div className="panel-section">
          <div className="no-selection">
            点击场景中的物体选中它<br />
            或从上方添加新的几何体
          </div>
        </div>
      )}

      <div className="panel-section">
        <LightingControls />
      </div>

      <div className="panel-section" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="panel-title">场景信息</div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
          物体数量: <strong style={{ color: '#ffffff' }}>{geometries.length}</strong>
        </div>
      </div>
    </div>
  );
}

export default ControlPanel;
