import { useState } from 'react';
import { useBuildingStore } from '../store/buildingStore';

const groupDivider = {
  height: '1px',
  background: '#4A5568',
  margin: '16px 0',
  border: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '13px',
  color: '#E2E8F0',
  marginBottom: '8px',
  fontWeight: 500,
};

const valueBadge: React.CSSProperties = {
  background: '#2D3748',
  color: '#63B3ED',
  padding: '2px 8px',
  borderRadius: '6px',
  fontSize: '12px',
  fontFamily: 'monospace',
  fontWeight: 600,
};

const sliderContainer: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '24px',
  display: 'flex',
  alignItems: 'center',
  marginBottom: '16px',
};

function StyledSlider(props: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const { value, min, max, step = 1, onChange } = props;
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div style={sliderContainer}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: '6px',
          borderRadius: '3px',
          background: '#2D3748',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          width: `${pct}%`,
          height: '6px',
          borderRadius: '3px',
          background: dragging ? '#90CDF4' : '#63B3ED',
          transition: 'background 0.15s',
          pointerEvents: 'none',
        }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onMouseDown={() => setDragging(true)}
        onMouseUp={() => setDragging(false)}
        onMouseLeave={() => setDragging(false)}
        onTouchStart={() => setDragging(true)}
        onTouchEnd={() => setDragging(false)}
        style={{
          position: 'absolute',
          width: '100%',
          height: '24px',
          opacity: 0,
          cursor: 'pointer',
          zIndex: 2,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: `calc(${pct}% - 10px)`,
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: dragging ? '#90CDF4' : '#63B3ED',
          boxShadow: `0 2px 8px ${dragging ? 'rgba(144,205,244,0.5)' : 'rgba(99,179,237,0.3)'}`,
          transition: 'all 0.15s',
          pointerEvents: 'none',
          transform: dragging ? 'scale(1.15)' : 'scale(1)',
        }}
      />
    </div>
  );
}

function ToggleButton({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  const [pressed, setPressed] = useState(false);
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
      <span style={{ fontSize: '13px', color: '#E2E8F0', fontWeight: 500 }}>{label}</span>
      <button
        onClick={() => onChange(!checked)}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
        style={{
          width: '48px',
          height: '26px',
          borderRadius: '13px',
          border: 'none',
          cursor: 'pointer',
          background: checked ? '#63B3ED' : '#4A5568',
          position: 'relative',
          transition: 'background 0.2s',
          transform: pressed ? 'scale(0.95)' : 'scale(1)',
          transitionTimingFunction: 'ease-out',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '3px',
            left: checked ? '25px' : '3px',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            transition: 'left 0.2s ease-out',
          }}
        />
      </button>
    </div>
  );
}

export default function ShadowControls() {
  const {
    buildings,
    selectedBuildingId,
    sunAltitude,
    sunAzimuth,
    shadowEnabled,
    renderInfo,
    selectBuilding,
    updateBuildingHeight,
    updateBuildingPosition,
    setSunAltitude,
    setSunAzimuth,
    toggleShadow,
  } = useBuildingStore();

  const [panelOpen, setPanelOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);

  if (typeof window !== 'undefined') {
    window.addEventListener(
      'resize',
      () => {
        setIsMobile(window.innerWidth < 1024);
      },
      { passive: true }
    );
  }

  const selected = buildings.find((b) => b.id === selectedBuildingId) || null;
  const selectedIdx = selected ? buildings.findIndex((b) => b.id === selectedBuildingId) + 1 : 0;

  const panelStyle: React.CSSProperties = isMobile
    ? {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        background: 'rgba(26,32,44,0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px 16px 0 0',
        padding: panelOpen ? '20px' : '12px 20px',
        borderTop: '1px solid #4A5568',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.4)',
        zIndex: 100,
        transition: 'all 0.3s ease-out',
        maxHeight: panelOpen ? '70vh' : '56px',
        overflow: 'auto',
      }
    : {
        width: '320px',
        background: 'rgba(26,32,44,0.9)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '20px',
        border: '1px solid #2D3748',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        overflowY: 'auto' as const,
        maxHeight: '100vh',
      };

  return (
    <div style={panelStyle}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: isMobile && !panelOpen ? 0 : '16px',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#E2E8F0',
              margin: 0,
              letterSpacing: '0.5px',
            }}
          >
            光影城迹
          </h2>
          <p style={{ fontSize: '11px', color: '#A0AEC0', margin: '2px 0 0 0' }}>3D建筑日照可视化系统</p>
        </div>
        {isMobile ? (
          <button
            onClick={() => setPanelOpen(!panelOpen)}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#2D3748',
              border: 'none',
              cursor: 'pointer',
              color: '#63B3ED',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: panelOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease-out',
            }}
          >
            ▲
          </button>
        ) : (
          <div
            style={{
              display: 'flex',
              gap: '8px',
              fontSize: '11px',
              color: '#A0AEC0',
              fontFamily: 'monospace',
            }}
          >
            <span>FPS {renderInfo.fps}</span>
          </div>
        )}
      </div>

      {(!isMobile || panelOpen) && (
        <>
          {isMobile && (
            <div style={{ fontSize: '11px', color: '#A0AEC0', fontFamily: 'monospace', marginBottom: '16px' }}>
              FPS: {renderInfo.fps} | Frame: {renderInfo.frame}
            </div>
          )}

          <div style={{ marginBottom: '8px' }}>
            <div style={labelStyle}>
              <span>🏢 选择建筑</span>
              <span style={valueBadge}>{selected ? `#${selectedIdx}` : '无'}</span>
            </div>
            <select
              value={selectedBuildingId || ''}
              onChange={(e) => selectBuilding(e.target.value || null)}
              style={{
                width: '100%',
                height: '38px',
                borderRadius: '8px',
                background: '#2D3748',
                color: '#E2E8F0',
                border: '1px solid #4A5568',
                padding: '0 12px',
                fontSize: '13px',
                cursor: 'pointer',
                outline: 'none',
                marginBottom: '12px',
              }}
            >
              <option value="">-- 未选中 --</option>
              {buildings.map((b, i) => (
                <option key={b.id} value={b.id}>
                  建筑 #{i + 1} (H: {b.height.toFixed(0)}m)
                </option>
              ))}
            </select>
          </div>

          <div style={labelStyle}>
            <span>📐 建筑高度</span>
            <span style={valueBadge}>{selected ? selected.height.toFixed(0) : 0}m</span>
          </div>
          <StyledSlider
            value={selected?.height || 50}
            min={10}
            max={100}
            onChange={(v) => selected && updateBuildingHeight(selected.id, v)}
          />

          <div style={labelStyle}>
            <span>↔️ 位置 X</span>
            <span style={valueBadge}>{selected ? selected.x.toFixed(1) : 0}m</span>
          </div>
          <StyledSlider
            value={selected?.x || 0}
            min={-200}
            max={200}
            step={0.5}
            onChange={(v) => selected && updateBuildingPosition(selected.id, v, selected.z)}
          />

          <div style={labelStyle}>
            <span>↕️ 位置 Z</span>
            <span style={valueBadge}>{selected ? selected.z.toFixed(1) : 0}m</span>
          </div>
          <StyledSlider
            value={selected?.z || 0}
            min={-200}
            max={200}
            step={0.5}
            onChange={(v) => selected && updateBuildingPosition(selected.id, selected.x, v)}
          />

          <hr style={groupDivider} />

          <div style={{ fontSize: '14px', fontWeight: 600, color: '#63B3ED', marginBottom: '14px' }}>
            ☀️ 光照参数
          </div>

          <div style={labelStyle}>
            <span>太阳高度角</span>
            <span style={valueBadge}>{sunAltitude}°</span>
          </div>
          <StyledSlider value={sunAltitude} min={15} max={75} onChange={setSunAltitude} />

          <div style={labelStyle}>
            <span>太阳方位角</span>
            <span style={valueBadge}>{sunAzimuth}°</span>
          </div>
          <StyledSlider value={sunAzimuth} min={0} max={360} onChange={setSunAzimuth} />

          <hr style={groupDivider} />

          <div style={{ fontSize: '14px', fontWeight: 600, color: '#63B3ED', marginBottom: '14px' }}>
            👁️ 显示选项
          </div>

          <ToggleButton checked={shadowEnabled} onChange={toggleShadow} label="启用实时阴影" />

          <div
            style={{
              marginTop: '20px',
              padding: '12px',
              background: 'rgba(45,55,72,0.5)',
              borderRadius: '8px',
              fontSize: '11px',
              color: '#A0AEC0',
              lineHeight: '1.6',
            }}
          >
            💡 <strong style={{ color: '#E2E8F0' }}>操作提示：</strong>
            <br />
            · 左键拖拽：旋转视角
            <br />
            · 滚轮：缩放场景
            <br />
            · 右键拖拽：平移视图
            <br />
            · 点击建筑：选中编辑
          </div>
        </>
      )}
    </div>
  );
}
