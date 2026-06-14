import React, { useCallback, useRef } from 'react';
import { Module, Port, PortSignalType, SIGNAL_COLORS } from '../types/ModuleTypes';

interface ModuleCardProps {
  module: Module;
  onMove: (id: string, x: number, y: number) => void;
  onParamChange: (moduleId: string, key: string, value: number | string) => void;
  onPortMouseDown: (port: Port, e: React.MouseEvent) => void;
  onPortMouseUp: (port: Port, e: React.MouseEvent) => void;
  onRemove: (id: string) => void;
  onTriggerEnvelope?: (moduleId: string) => void;
  onReleaseEnvelope?: (moduleId: string) => void;
}

const MODULE_WIDTH = 200;
const PORT_RADIUS = 7;

export { MODULE_WIDTH, PORT_RADIUS };

export default function ModuleCard({
  module,
  onMove,
  onParamChange,
  onPortMouseDown,
  onPortMouseUp,
  onRemove,
  onTriggerEnvelope,
  onReleaseEnvelope,
}: ModuleCardProps) {
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('.port-dot')) return;
      if ((e.target as HTMLElement).closest('.param-control')) return;
      e.preventDefault();
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: module.x,
        origY: module.y,
      };

      const handleMouseMove = (ev: MouseEvent) => {
        if (!dragRef.current) return;
        const dx = ev.clientX - dragRef.current.startX;
        const dy = ev.clientY - dragRef.current.startY;
        onMove(module.id, dragRef.current.origX + dx, dragRef.current.origY + dy);
      };

      const handleMouseUp = () => {
        dragRef.current = null;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [module.id, module.x, module.y, onMove]
  );

  const renderPorts = (direction: 'input' | 'output') => {
    const ports = module.ports.filter(p => p.direction === direction);
    return ports.map(port => (
      <div
        key={port.id}
        className="flex items-center gap-1 my-1"
        style={{ justifyContent: direction === 'input' ? 'flex-start' : 'flex-end' }}
      >
        {direction === 'input' && (
          <span className="text-[10px] opacity-70 select-none">{port.name}</span>
        )}
        <div
          className="port-dot relative cursor-crosshair"
          onMouseDown={e => {
            e.stopPropagation();
            onPortMouseDown(port, e);
          }}
          onMouseUp={e => {
            e.stopPropagation();
            onPortMouseUp(port, e);
          }}
          style={{ width: PORT_RADIUS * 2, height: PORT_RADIUS * 2, flexShrink: 0 }}
        >
          <div
            className="absolute inset-0 rounded-full"
            style={{
              backgroundColor: SIGNAL_COLORS[port.signalType],
              boxShadow: `0 0 6px ${SIGNAL_COLORS[port.signalType]}, 0 0 12px ${SIGNAL_COLORS[port.signalType]}44`,
              animation: 'portBreathe 2s ease-in-out infinite',
            }}
          />
        </div>
        {direction === 'output' && (
          <span className="text-[10px] opacity-70 select-none">{port.name}</span>
        )}
      </div>
    ));
  };

  const renderParamControls = () => {
    switch (module.type) {
      case 'oscillator':
        return (
          <div className="param-control space-y-2 mt-2">
            <div>
              <label className="text-[10px] opacity-60 block mb-0.5">波形</label>
              <select
                className="w-full bg-[#0a0a1a] text-[#00e5ff] text-xs rounded px-1 py-0.5 border border-[#1a1a3e]"
                value={module.params.waveform as string}
                onChange={e => onParamChange(module.id, 'waveform', e.target.value)}
              >
                <option value="sine">正弦波</option>
                <option value="sawtooth">锯齿波</option>
                <option value="square">方波</option>
                <option value="triangle">三角波</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] opacity-60 block mb-0.5">频率: {module.params.frequency}Hz</label>
              <input
                type="range"
                min="20"
                max="8000"
                step="1"
                value={module.params.frequency as number}
                onChange={e => onParamChange(module.id, 'frequency', Number(e.target.value))}
                className="w-full accent-[#00e5ff] h-1"
              />
            </div>
            <div>
              <label className="text-[10px] opacity-60 block mb-0.5">微调: {module.params.detune}ct</label>
              <input
                type="range"
                min="-100"
                max="100"
                step="1"
                value={module.params.detune as number}
                onChange={e => onParamChange(module.id, 'detune', Number(e.target.value))}
                className="w-full accent-[#00e5ff] h-1"
              />
            </div>
          </div>
        );
      case 'filter':
        return (
          <div className="param-control space-y-2 mt-2">
            <div>
              <label className="text-[10px] opacity-60 block mb-0.5">类型</label>
              <select
                className="w-full bg-[#0a0a1a] text-[#00e5ff] text-xs rounded px-1 py-0.5 border border-[#1a1a3e]"
                value={module.params.filterType as string}
                onChange={e => onParamChange(module.id, 'filterType', e.target.value)}
              >
                <option value="lowpass">低通</option>
                <option value="highpass">高通</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] opacity-60 block mb-0.5">截止频率: {module.params.frequency}Hz</label>
              <input
                type="range"
                min="20"
                max="20000"
                step="1"
                value={module.params.frequency as number}
                onChange={e => onParamChange(module.id, 'frequency', Number(e.target.value))}
                className="w-full accent-[#ffd600] h-1"
              />
            </div>
            <div>
              <label className="text-[10px] opacity-60 block mb-0.5">Q值: {module.params.Q}</label>
              <input
                type="range"
                min="0.1"
                max="20"
                step="0.1"
                value={module.params.Q as number}
                onChange={e => onParamChange(module.id, 'Q', Number(e.target.value))}
                className="w-full accent-[#ffd600] h-1"
              />
            </div>
          </div>
        );
      case 'envelope':
        return (
          <div className="param-control space-y-2 mt-2">
            <div>
              <label className="text-[10px] opacity-60 block mb-0.5">Attack: {(module.params.attack as number).toFixed(2)}s</label>
              <input
                type="range"
                min="0.001"
                max="2"
                step="0.001"
                value={module.params.attack as number}
                onChange={e => onParamChange(module.id, 'attack', Number(e.target.value))}
                className="w-full accent-[#ff6d00] h-1"
              />
            </div>
            <div>
              <label className="text-[10px] opacity-60 block mb-0.5">Decay: {(module.params.decay as number).toFixed(2)}s</label>
              <input
                type="range"
                min="0.001"
                max="2"
                step="0.001"
                value={module.params.decay as number}
                onChange={e => onParamChange(module.id, 'decay', Number(e.target.value))}
                className="w-full accent-[#ff6d00] h-1"
              />
            </div>
            <div>
              <label className="text-[10px] opacity-60 block mb-0.5">Sustain: {(module.params.sustain as number).toFixed(2)}</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={module.params.sustain as number}
                onChange={e => onParamChange(module.id, 'sustain', Number(e.target.value))}
                className="w-full accent-[#ff6d00] h-1"
              />
            </div>
            <div>
              <label className="text-[10px] opacity-60 block mb-0.5">Release: {(module.params.release as number).toFixed(2)}s</label>
              <input
                type="range"
                min="0.001"
                max="5"
                step="0.001"
                value={module.params.release as number}
                onChange={e => onParamChange(module.id, 'release', Number(e.target.value))}
                className="w-full accent-[#ff6d00] h-1"
              />
            </div>
            <button
              className="w-full text-xs py-1 rounded bg-[#ff6d00]/20 text-[#ff6d00] border border-[#ff6d00]/40 hover:bg-[#ff6d00]/30 transition-colors"
              onMouseDown={() => onTriggerEnvelope?.(module.id)}
              onMouseUp={() => onReleaseEnvelope?.(module.id)}
              onMouseLeave={() => onReleaseEnvelope?.(module.id)}
            >
              触发
            </button>
          </div>
        );
      case 'lfo':
        return (
          <div className="param-control space-y-2 mt-2">
            <div>
              <label className="text-[10px] opacity-60 block mb-0.5">波形</label>
              <select
                className="w-full bg-[#0a0a1a] text-[#ffd600] text-xs rounded px-1 py-0.5 border border-[#1a1a3e]"
                value={module.params.waveform as string}
                onChange={e => onParamChange(module.id, 'waveform', e.target.value)}
              >
                <option value="sine">正弦波</option>
                <option value="sawtooth">锯齿波</option>
                <option value="square">方波</option>
                <option value="triangle">三角波</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] opacity-60 block mb-0.5">频率: {module.params.frequency}Hz</label>
              <input
                type="range"
                min="0.1"
                max="50"
                step="0.1"
                value={module.params.frequency as number}
                onChange={e => onParamChange(module.id, 'frequency', Number(e.target.value))}
                className="w-full accent-[#ffd600] h-1"
              />
            </div>
            <div>
              <label className="text-[10px] opacity-60 block mb-0.5">深度: {module.params.depth}</label>
              <input
                type="range"
                min="0"
                max="1000"
                step="1"
                value={module.params.depth as number}
                onChange={e => onParamChange(module.id, 'depth', Number(e.target.value))}
                className="w-full accent-[#ffd600] h-1"
              />
            </div>
          </div>
        );
      case 'reverb':
        return (
          <div className="param-control space-y-2 mt-2">
            <div>
              <label className="text-[10px] opacity-60 block mb-0.5">衰减: {(module.params.decay as number).toFixed(1)}s</label>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={module.params.decay as number}
                onChange={e => onParamChange(module.id, 'decay', Number(e.target.value))}
                className="w-full accent-[#00e5ff] h-1"
              />
            </div>
            <div>
              <label className="text-[10px] opacity-60 block mb-0.5">湿信号: {(module.params.wet as number).toFixed(2)}</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={module.params.wet as number}
                onChange={e => onParamChange(module.id, 'wet', Number(e.target.value))}
                className="w-full accent-[#00e5ff] h-1"
              />
            </div>
          </div>
        );
      case 'output':
        return (
          <div className="param-control space-y-2 mt-2">
            <div>
              <label className="text-[10px] opacity-60 block mb-0.5">音量: {(module.params.volume as number).toFixed(2)}</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={module.params.volume as number}
                onChange={e => onParamChange(module.id, 'volume', Number(e.target.value))}
                className="w-full accent-[#e94560] h-1"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const typeLabel: Record<string, string> = {
    oscillator: '振荡器',
    filter: '滤波器',
    envelope: 'ADSR',
    lfo: 'LFO',
    reverb: '混响',
    output: '主输出',
  };

  const typeIcon: Record<string, string> = {
    oscillator: '∿',
    filter: '∭',
    envelope: '⌇',
    lfo: '⟳',
    reverb: '⊇',
    output: '◉',
  };

  return (
    <div
      className="absolute select-none"
      style={{
        left: module.x,
        top: module.y,
        width: MODULE_WIDTH,
        transition: dragRef.current ? 'none' : 'left 0ms, top 0ms',
        animation: 'moduleSlideIn 0.3s ease-out',
      }}
      onMouseDown={handleMouseDown}
    >
      <div
        className="rounded-lg overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0f3460, #16213e)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 1px rgba(233,69,96,0.3)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center justify-between px-2 py-1.5 cursor-grab active:cursor-grabbing" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="flex items-center gap-1.5">
            <span className="text-lg" style={{ color: '#e94560' }}>{typeIcon[module.type]}</span>
            <span className="text-xs font-bold text-white/90">{typeLabel[module.type]}</span>
          </div>
          <button
            className="text-white/30 hover:text-[#e94560] text-sm transition-colors leading-none"
            onClick={e => { e.stopPropagation(); onRemove(module.id); }}
          >
            ✕
          </button>
        </div>

        <div className="px-2 pt-1">
          <div className="flex justify-between">
            <div className="flex flex-col">{renderPorts('input')}</div>
            <div className="flex flex-col items-end">{renderPorts('output')}</div>
          </div>
        </div>

        <div className="px-2 pb-2">
          {renderParamControls()}
        </div>
      </div>
    </div>
  );
}
