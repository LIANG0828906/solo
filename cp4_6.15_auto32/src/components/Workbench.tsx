import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Module, Connection, Port, SIGNAL_COLORS, ModuleType, MODULE_CONFIGS, generateId } from '../types/ModuleTypes';
import { canConnect } from '../utils/portValidator';
import ModuleCard, { MODULE_WIDTH, PORT_RADIUS } from './ModuleCard';

const HEADER_HEIGHT = 34;
const PORTS_TOP_OFFSET = 50;
const PORT_ROW_HEIGHT = 24;

interface WorkbenchProps {
  modules: Module[];
  connections: Connection[];
  onMoveModule: (id: string, x: number, y: number) => void;
  onRemoveModule: (id: string) => void;
  onAddConnection: (fromPortId: string, toPortId: string) => boolean;
  onRemoveConnection: (id: string) => void;
  onParamChange: (moduleId: string, key: string, value: number | string) => void;
  onTriggerEnvelope: (moduleId: string) => void;
  onReleaseEnvelope: (moduleId: string) => void;
  onInitAudio: () => void;
}

interface DragState {
  type: 'connecting';
  fromPort: Port;
  mouseX: number;
  mouseY: number;
  hoveredPort: Port | null;
}

function getPortPosition(module: Module, port: Port): { x: number; y: number } {
  const sameDirectionPorts = module.ports.filter(p => p.direction === port.direction);
  const index = sameDirectionPorts.indexOf(port);

  const x = port.direction === 'input'
    ? module.x + PORT_RADIUS
    : module.x + MODULE_WIDTH - PORT_RADIUS;

  const y = module.y + PORTS_TOP_OFFSET + index * PORT_ROW_HEIGHT;

  return { x, y };
}

function bezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = Math.abs(x2 - x1);
  const offset = Math.max(50, dx * 0.4);
  return `M ${x1} ${y1} C ${x1 + offset} ${y1}, ${x2 - offset} ${y2}, ${x2} ${y2}`;
}

export default function Workbench({
  modules,
  connections,
  onMoveModule,
  onRemoveModule,
  onAddConnection,
  onRemoveConnection,
  onParamChange,
  onTriggerEnvelope,
  onReleaseEnvelope,
  onInitAudio,
}: WorkbenchProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [invalidFlash, setInvalidFlash] = useState(false);

  const getContainerOffset = useCallback(() => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return { x: rect.left, y: rect.top };
  }, []);

  const handlePortMouseDown = useCallback((port: Port, e: React.MouseEvent) => {
    onInitAudio();
    if (port.direction === 'output') {
      const offset = getContainerOffset();
      setDragState({
        type: 'connecting',
        fromPort: port,
        mouseX: e.clientX - offset.x,
        mouseY: e.clientY - offset.y,
        hoveredPort: null,
      });
    }
  }, [getContainerOffset, onInitAudio]);

  const handlePortMouseUp = useCallback((port: Port, e: React.MouseEvent) => {
    if (!dragState || dragState.type !== 'connecting') return;
    if (port.direction === 'input') {
      const validation = canConnect(dragState.fromPort, port);
      if (validation.valid) {
        const success = onAddConnection(dragState.fromPort.id, port.id);
        if (!success) {
          setInvalidFlash(true);
          setTimeout(() => setInvalidFlash(false), 400);
        }
      } else {
        setInvalidFlash(true);
        setTimeout(() => setInvalidFlash(false), 400);
      }
    }
    setDragState(null);
  }, [dragState, onAddConnection]);

  useEffect(() => {
    if (!dragState || dragState.type !== 'connecting') return;

    const handleMouseMove = (e: MouseEvent) => {
      const offset = getContainerOffset();
      const mouseX = e.clientX - offset.x;
      const mouseY = e.clientY - offset.y;

      let hoveredPort: Port | null = null;
      for (const mod of modules) {
        for (const port of mod.ports) {
          if (port.direction === 'input' && port.moduleId !== dragState.fromPort.moduleId) {
            const pos = getPortPosition(mod, port);
            const dist = Math.sqrt((mouseX - pos.x) ** 2 + (mouseY - pos.y) ** 2);
            if (dist < 20) {
              hoveredPort = port;
              break;
            }
          }
        }
        if (hoveredPort) break;
      }

      setDragState(prev => prev ? { ...prev, mouseX, mouseY, hoveredPort } : null);
    };

    const handleMouseUp = () => {
      if (dragState.hoveredPort) {
        const validation = canConnect(dragState.fromPort, dragState.hoveredPort);
        if (!validation.valid) {
          setInvalidFlash(true);
          setTimeout(() => setInvalidFlash(false), 400);
        }
      }
      setDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, modules, getContainerOffset]);

  const renderConnection = (conn: Connection) => {
    const fromModule = modules.find(m => m.ports.some(p => p.id === conn.fromPortId));
    const toModule = modules.find(m => m.ports.some(p => p.id === conn.toPortId));
    if (!fromModule || !toModule) return null;

    const fromPort = fromModule.ports.find(p => p.id === conn.fromPortId)!;
    const toPort = toModule.ports.find(p => p.id === conn.toPortId)!;

    const from = getPortPosition(fromModule, fromPort);
    const to = getPortPosition(toModule, toPort);

    const path = bezierPath(from.x, from.y, to.x, to.y);
    const color = SIGNAL_COLORS[fromPort.signalType];

    return (
      <g key={conn.id}>
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          opacity={0.3}
        />
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeDasharray="8 4"
          className="connection-pulse"
        />
        <circle
          cx={from.x}
          cy={from.y}
          r={4}
          fill={color}
          opacity={0.8}
        />
        <circle
          cx={to.x}
          cy={to.y}
          r={4}
          fill={color}
          opacity={0.8}
        />
        <path
          d={path}
          fill="none"
          stroke="transparent"
          strokeWidth={12}
          style={{ cursor: 'pointer' }}
          onClick={() => onRemoveConnection(conn.id)}
        >
          <title>点击删除连接</title>
        </path>
      </g>
    );
  };

  const renderTempConnection = () => {
    if (!dragState || dragState.type !== 'connecting') return null;

    const fromModule = modules.find(m => m.ports.some(p => p.id === dragState.fromPort.id));
    if (!fromModule) return null;

    const from = getPortPosition(fromModule, dragState.fromPort);
    const to = { x: dragState.mouseX, y: dragState.mouseY };

    let color = SIGNAL_COLORS[dragState.fromPort.signalType];
    let isValid = true;

    if (dragState.hoveredPort) {
      const validation = canConnect(dragState.fromPort, dragState.hoveredPort);
      if (!validation.valid) {
        color = '#e94560';
        isValid = false;
      }
    }

    const path = bezierPath(from.x, from.y, to.x, to.y);

    return (
      <g className={isValid ? '' : 'connection-invalid'}>
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeDasharray="6 4"
          opacity={0.8}
        />
        <circle
          cx={from.x}
          cy={from.y}
          r={5}
          fill={color}
          opacity={0.9}
        />
      </g>
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-hidden"
      style={{ background: '#1a1a2e', cursor: dragState ? 'crosshair' : 'default' }}
      onMouseDown={() => onInitAudio()}
    >
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 1 }}
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {connections.map(renderConnection)}
        {renderTempConnection()}
      </svg>

      <div className="absolute inset-0" style={{ zIndex: 2 }}>
        {modules.map(mod => (
          <ModuleCard
            key={mod.id}
            module={mod}
            onMove={onMoveModule}
            onParamChange={onParamChange}
            onPortMouseDown={handlePortMouseDown}
            onPortMouseUp={handlePortMouseUp}
            onRemove={onRemoveModule}
            onTriggerEnvelope={onTriggerEnvelope}
            onReleaseEnvelope={onReleaseEnvelope}
          />
        ))}
      </div>

      {invalidFlash && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(233,69,96,0.15) 0%, transparent 70%)',
            zIndex: 100,
            animation: 'flashFade 0.4s ease-out forwards',
          }}
        />
      )}

      {modules.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 0 }}>
          <div className="text-center opacity-20">
            <div className="text-6xl mb-4">∿</div>
            <div className="text-sm" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              从左侧面板添加模块开始创作
            </div>
          </div>
        </div>
      )}

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          zIndex: 0,
        }}
      />
    </div>
  );
}
