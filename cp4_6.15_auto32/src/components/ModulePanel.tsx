import React from 'react';
import { ModuleType, MODULE_CONFIGS } from '../types/ModuleTypes';

interface ModulePanelProps {
  onAddModule: (type: ModuleType) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const MODULE_ICONS: Record<ModuleType, string> = {
  oscillator: '∿',
  filter: '∭',
  envelope: '⌇',
  lfo: '⟳',
  reverb: '⊇',
  output: '◉',
};

const PANEL_MODULES: ModuleType[] = ['oscillator', 'filter', 'envelope', 'lfo', 'reverb', 'output'];

export default function ModulePanel({ onAddModule, isOpen, onToggle }: ModulePanelProps) {
  return (
    <>
      {!isOpen && (
        <button
          className="fixed top-3 left-3 z-50 md:hidden w-10 h-10 rounded-lg flex items-center justify-center text-white/70"
          style={{ background: 'rgba(22,33,62,0.95)', border: '1px solid rgba(255,255,255,0.1)' }}
          onClick={onToggle}
        >
          ☰
        </button>
      )}

      <div
        className="fixed md:relative z-40 h-full transition-transform duration-300 ease-out"
        style={{
          width: 250,
          background: '#16213e',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        <div className="md:hidden absolute top-3 right-3">
          <button
            className="text-white/40 hover:text-white/70 text-lg"
            onClick={onToggle}
          >
            ✕
          </button>
        </div>

        <div className="p-4">
          <h2
            className="text-sm font-bold tracking-wider mb-4"
            style={{ color: '#e94560', fontFamily: '"JetBrains Mono", monospace' }}
          >
            模块面板
          </h2>

          <div className="space-y-3">
            {PANEL_MODULES.map(type => {
              const config = MODULE_CONFIGS[type];
              return (
                <button
                  key={type}
                  className="w-full text-left rounded-lg p-3 transition-all duration-200 group"
                  style={{
                    background: 'linear-gradient(135deg, #1a1a2e, #0f3460)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.04)',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px #4488ff';
                    (e.currentTarget as HTMLElement).style.borderColor = '#4488ff';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.04)';
                  }}
                  onClick={() => onAddModule(type)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl" style={{ color: '#e94560' }}>
                      {MODULE_ICONS[type]}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white/90">{config.name}</div>
                      <div className="text-[10px] text-white/40">{config.description}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[10px] text-white/30 leading-relaxed">
              点击模块添加到工作区，拖拽端口连线建立信号路由
            </p>
            <div className="mt-3 space-y-1">
              <div className="flex items-center gap-2 text-[10px]">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#00e5ff' }} />
                <span className="text-white/40">音频信号</span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#ffd600' }} />
                <span className="text-white/40">控制信号</span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#ff6d00' }} />
                <span className="text-white/40">触发信号</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
}
