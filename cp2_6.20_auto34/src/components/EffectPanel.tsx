import React from 'react';

interface EffectInfo {
  type: string;
  name: string;
  icon: string;
  description: string;
  defaultParams: Record<string, { value: number; min: number; max: number; step?: number }>;
}

const effectTypes: EffectInfo[] = [
  {
    type: 'Echo',
    name: 'Echo',
    icon: '〰️',
    description: '延迟回声效果',
    defaultParams: {
      delayTime: { value: 0.3, min: 0, max: 2, step: 0.01 },
      feedback: { value: 0.3, min: 0, max: 0.95, step: 0.01 },
      mix: { value: 0.5, min: 0, max: 1, step: 0.01 },
    },
  },
  {
    type: 'Compressor',
    name: 'Compressor',
    icon: '📊',
    description: '动态压缩器',
    defaultParams: {
      threshold: { value: -24, min: -60, max: 0, step: 1 },
      ratio: { value: 12, min: 1, max: 20, step: 0.5 },
      attack: { value: 0.003, min: 0, max: 1, step: 0.001 },
      release: { value: 0.25, min: 0, max: 1, step: 0.01 },
    },
  },
  {
    type: 'Filter',
    name: 'Filter',
    icon: '🎚️',
    description: '频率滤波器',
    defaultParams: {
      frequency: { value: 1000, min: 20, max: 20000, step: 10 },
      Q: { value: 1, min: 0.1, max: 20, step: 0.1 },
      gain: { value: 0, min: -40, max: 40, step: 1 },
    },
  },
];

interface EffectPanelProps {
  className?: string;
}

const EffectPanel: React.FC<EffectPanelProps> = ({ className = '' }) => {
  const handleDragStart = (e: React.DragEvent, effectType: string) => {
    e.dataTransfer.setData('effectType', effectType);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      className={`rounded-xl p-4 backdrop-blur-md bg-white/5 border border-white/10 shadow-xl ${className}`}
      style={{
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
      }}
    >
      <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
        <span className="text-lg">🎛️</span>
        效果器
      </h3>
      <div className="space-y-3">
        {effectTypes.map((effect) => (
          <div
            key={effect.type}
            draggable
            onDragStart={(e) => handleDragStart(e, effect.type)}
            className="group cursor-grab active:cursor-grabbing"
          >
            <div
              className="relative p-3 rounded-lg transition-all duration-200 overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.9) 100%)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, rgba(99,179,237,0.2) 0%, rgba(147,51,234,0.2) 100%)',
                    border: '1px solid rgba(99,179,237,0.3)',
                    boxShadow: '0 0 20px rgba(99,179,237,0.1)',
                  }}
                >
                  {effect.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium text-sm group-hover:text-blue-300 transition-colors">
                    {effect.name}
                  </div>
                  <div className="text-gray-400 text-xs truncate">
                    {effect.description}
                  </div>
                </div>
                <div className="text-gray-500 group-hover:text-blue-400 transition-colors text-lg">
                  ⋮⋮
                </div>
              </div>
              <div className="relative mt-2 pt-2 border-t border-white/5">
                <div className="flex flex-wrap gap-1">
                  {Object.keys(effect.defaultParams).map((param) => (
                    <span
                      key={param}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400"
                    >
                      {param}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-white/10">
        <p className="text-[11px] text-gray-500 text-center">
          拖拽效果器到音轨的效果器槽位
        </p>
      </div>
    </div>
  );
};

export default EffectPanel;
