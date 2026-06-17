import React, { useState, useCallback, useRef } from 'react';
import { useStore, SIMULATION_DEVICES, Breakpoint, ResponsiveConfig, COMPONENT_COLORS } from '../store';
import { useBreakpoints, useComponentResponsive } from '../modules/responsiveStrategy';

const RippleButton: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
  bg: string;
  hoverBg: string;
  style?: React.CSSProperties;
}> = ({ children, onClick, bg, hoverBg, style }) => {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) {
      const id = Date.now();
      setRipples(prev => [...prev, { x: e.clientX - rect.left, y: e.clientY - rect.top, id }]);
      setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 400);
    }
    onClick();
  };

  return (
    <button
      ref={btnRef}
      onClick={handleClick}
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: bg,
        border: 'none',
        color: '#fff',
        padding: '8px 18px',
        borderRadius: 8,
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 600,
        transition: 'background 0.2s, transform 0.1s',
        ...style,
      }}
      onMouseEnter={e => (e.currentTarget.style.background = hoverBg)}
      onMouseLeave={e => (e.currentTarget.style.background = bg)}
      onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
      onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
    >
      {ripples.map(r => (
        <span
          key={r.id}
          style={{
            position: 'absolute',
            left: r.x,
            top: r.y,
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.3)',
            transform: 'scale(0)',
            animation: 'ripple 0.4s ease-out',
            pointerEvents: 'none',
          }}
        />
      ))}
      {children}
    </button>
  );
};

const BreakpointSelector: React.FC = () => {
  const { breakpoints, sortedBreakpoints, activeBreakpoint, setActiveBreakpoint } = useBreakpoints();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {sortedBreakpoints.map(bp => (
        <button
          key={bp.id}
          onClick={() => setActiveBreakpoint(bp.id)}
          style={{
            background: activeBreakpoint === bp.id ? '#2196F3' : '#3A3A50',
            border: `1px solid ${activeBreakpoint === bp.id ? '#2196F3' : '#4A4A5E'}`,
            color: '#E0E0E0',
            padding: '4px 10px',
            borderRadius: 6,
            fontSize: 11,
            cursor: 'pointer',
            transition: 'background 0.2s, border-color 0.2s',
            whiteSpace: 'nowrap',
          }}
        >
          {bp.name}
        </button>
      ))}
    </div>
  );
};

const SimulationControls: React.FC = () => {
  const simulationMode = useStore(s => s.simulationMode);
  const setSimulationMode = useStore(s => s.setSimulationMode);
  const [showDevices, setShowDevices] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <RippleButton
        onClick={() => {
          if (simulationMode) {
            setSimulationMode(false);
          } else {
            setShowDevices(!showDevices);
          }
        }}
        bg={simulationMode ? '#F44336' : '#4CAF50'}
        hoverBg={simulationMode ? '#D32F2F' : '#388E3C'}
      >
        {simulationMode ? '✕ Exit Sim' : '▶ Simulate'}
      </RippleButton>
      {showDevices && !simulationMode && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: 4,
          background: '#2A2A3E',
          border: '1px solid #4A4A5E',
          borderRadius: 8,
          padding: 6,
          zIndex: 10002,
          minWidth: 180,
        }}>
          {SIMULATION_DEVICES.map(device => (
            <button
              key={device.name}
              onClick={() => {
                setSimulationMode(true, device);
                setShowDevices(false);
              }}
              style={{
                display: 'block',
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: '#E0E0E0',
                padding: '8px 10px',
                borderRadius: 4,
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: 12,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#3A3A50')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {device.name} ({device.width}×{device.height})
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const SelectedComponentEditor: React.FC = () => {
  const selectedComponentId = useStore(s => s.selectedComponentId);
  const components = useStore(s => s.components);
  const updateComponent = useStore(s => s.updateComponent);
  const activeBreakpoint = useStore(s => s.activeBreakpoint);
  const updateResponsiveConfig = useStore(s => s.updateResponsiveConfig);
  const bringToFront = useStore(s => s.bringToFront);
  const sendToBack = useStore(s => s.sendToBack);

  if (!selectedComponentId) return null;

  const component = components.find(c => c.id === selectedComponentId);
  if (!component) return null;

  const rConfig = component.responsiveConfig[activeBreakpoint] || { width: component.width, widthUnit: 'px' as const, visible: true };

  return (
    <div style={{
      background: '#2A2A3E',
      border: '1px solid #4A4A5E',
      borderRadius: 8,
      padding: 10,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      minWidth: 200,
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#A0A0B0', textTransform: 'uppercase' }}>
        Edit: {component.label}
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <label style={{ fontSize: 11, color: '#A0A0B0', width: 40 }}>Width</label>
        <input
          type="number"
          value={rConfig.width}
          onChange={e => updateResponsiveConfig(component.id, activeBreakpoint, { width: parseInt(e.target.value) || 0 })}
          style={{
            flex: 1,
            background: '#3A3A50',
            border: '1px solid #4A4A5E',
            borderRadius: 4,
            padding: '4px 6px',
            fontSize: 12,
            color: '#E0E0E0',
            outline: 'none',
            width: 60,
          }}
          onFocus={e => (e.currentTarget.style.borderColor = '#64B5F6')}
          onBlur={e => (e.currentTarget.style.borderColor = '#4A4A5E')}
        />
        <select
          value={rConfig.widthUnit}
          onChange={e => updateResponsiveConfig(component.id, activeBreakpoint, { widthUnit: e.target.value as 'px' | '%' })}
          style={{
            background: '#3A3A50',
            border: '1px solid #4A4A5E',
            borderRadius: 4,
            padding: '4px 6px',
            fontSize: 12,
            color: '#E0E0E0',
            outline: 'none',
          }}
        >
          <option value="px">px</option>
          <option value="%">%</option>
        </select>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <label style={{ fontSize: 11, color: '#A0A0B0', width: 40 }}>Height</label>
        <input
          type="number"
          value={component.height}
          onChange={e => updateComponent(component.id, { height: parseInt(e.target.value) || 0 })}
          style={{
            flex: 1,
            background: '#3A3A50',
            border: '1px solid #4A4A5E',
            borderRadius: 4,
            padding: '4px 6px',
            fontSize: 12,
            color: '#E0E0E0',
            outline: 'none',
            width: 60,
          }}
          onFocus={e => (e.currentTarget.style.borderColor = '#64B5F6')}
          onBlur={e => (e.currentTarget.style.borderColor = '#4A4A5E')}
        />
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={rConfig.visible}
          onChange={e => updateResponsiveConfig(component.id, activeBreakpoint, { visible: e.target.checked })}
        />
        Visible
      </label>
      <div style={{ display: 'flex', gap: 4 }}>
        <button
          onClick={() => bringToFront(component.id)}
          style={{
            flex: 1, background: '#3A3A50', border: '1px solid #4A4A5E', borderRadius: 4,
            padding: '4px', color: '#E0E0E0', fontSize: 10, cursor: 'pointer',
          }}
        >
          ↑ Front
        </button>
        <button
          onClick={() => sendToBack(component.id)}
          style={{
            flex: 1, background: '#3A3A50', border: '1px solid #4A4A5E', borderRadius: 4,
            padding: '4px', color: '#E0E0E0', fontSize: 10, cursor: 'pointer',
          }}
        >
          ↓ Back
        </button>
      </div>
    </div>
  );
};

export const ExportBar: React.FC = () => {
  const exportToHTML = useStore(s => s.exportToHTML);
  const simulationMode = useStore(s => s.simulationMode);

  const handleExport = useCallback(() => {
    const html = exportToHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'page.html';
    a.click();
    URL.revokeObjectURL(url);
  }, [exportToHTML]);

  return (
    <div style={{
      position: 'absolute',
      top: 12,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      zIndex: 100,
    }}>
      <BreakpointSelector />
      <RippleButton onClick={handleExport} bg="#2196F3" hoverBg="#1976D2">
        ↓ Export HTML
      </RippleButton>
      <SimulationControls />
      <SelectedComponentEditor />
    </div>
  );
};
