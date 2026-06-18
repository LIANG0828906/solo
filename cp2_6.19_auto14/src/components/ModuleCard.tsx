import React, { useCallback, useMemo } from 'react'
import { ModuleType, SynthModule, useModuleStore, MODULE_LABELS, MODULE_ICONS } from '@/store/moduleStore'

const MODULE_TYPES: ModuleType[] = ['oscillator', 'filter', 'envelope', 'delay']

const PARAM_CONFIGS: Record<ModuleType, { key: string; label: string; min: number; max: number; step: number }[]> = {
  oscillator: [
    { key: 'frequency', label: '频率', min: 20, max: 2000, step: 1 },
    { key: 'detune', label: '微调', min: -100, max: 100, step: 1 },
    { key: 'type', label: '波形', min: 0, max: 3, step: 1 },
  ],
  filter: [
    { key: 'frequency', label: '截止', min: 20, max: 5000, step: 1 },
    { key: 'Q', label: 'Q值', min: 0.1, max: 20, step: 0.1 },
    { key: 'gain', label: '增益', min: -20, max: 20, step: 0.1 },
  ],
  envelope: [
    { key: 'attack', label: '起音', min: 0.001, max: 1, step: 0.001 },
    { key: 'decay', label: '衰减', min: 0.001, max: 1, step: 0.001 },
    { key: 'sustain', label: '持续', min: 0, max: 1, step: 0.01 },
    { key: 'release', label: '释放', min: 0.001, max: 3, step: 0.001 },
  ],
  delay: [
    { key: 'delayTime', label: '时延', min: 0.01, max: 1.5, step: 0.01 },
    { key: 'feedback', label: '反馈', min: 0, max: 0.9, step: 0.01 },
    { key: 'mix', label: '混合', min: 0, max: 1, step: 0.01 },
  ],
}

const OSC_TYPE_LABELS = ['正弦', '方波', '锯齿', '三角']

export const CARD_WIDTH = 176
export const CARD_HEIGHT = 212

interface ModuleCardLibraryProps {
  onDragStart: (type: ModuleType, e: React.DragEvent) => void
}

export const ModuleLibrary: React.FC<ModuleCardLibraryProps> = ({ onDragStart }) => {
  return (
    <div className="flex flex-col gap-3 p-3">
      <h3 className="font-mono text-xs uppercase tracking-widest text-synth-primary/70 mb-1 pl-1">
        模块库
      </h3>
      {MODULE_TYPES.map((type) => (
        <div
          key={type}
          draggable
          onDragStart={(e) => onDragStart(type, e)}
          className="group relative flex items-center gap-3 rounded-lg border border-synth-primary/30 bg-synth-surface/80 px-4 py-3 cursor-grab active:cursor-grabbing transition-all duration-200 hover:border-synth-primary hover:shadow-glow-purple hover:bg-synth-surface"
        >
          <span className="text-xl text-synth-primary group-hover:text-synth-highlight transition-colors">
            {MODULE_ICONS[type]}
          </span>
          <span className="font-display text-sm font-medium text-slate-200 group-hover:text-white">
            {MODULE_LABELS[type]}
          </span>
          <div
            className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{
              boxShadow: '0 0 20px rgba(124, 58, 237, 0.15), inset 0 0 20px rgba(124, 58, 237, 0.05)',
            }}
          />
        </div>
      ))}
      <div className="mt-2 px-3 py-2 rounded bg-synth-bg/60 border border-synth-border/40">
        <div className="font-mono text-[10px] text-slate-500 leading-relaxed">
          提示：拖拽卡片到面板
          <br />
          拖拽右侧端口→左侧端口连线
        </div>
      </div>
    </div>
  )
}

interface ModuleCardPanelProps {
  module: SynthModule
  onPortMouseDown: (moduleId: string, direction: 'input' | 'output', portIndex: number, e: React.MouseEvent) => void
  onModuleDragStart: (moduleId: string, e: React.MouseEvent) => void
  onModuleDrag: (moduleId: string, e: React.MouseEvent) => void
  onModuleDragEnd: (moduleId: string) => void
}

export const ModuleCardPanel: React.FC<ModuleCardPanelProps> = ({
  module,
  onPortMouseDown,
  onModuleDragStart,
  onModuleDragEnd,
}) => {
  const updateParam = useModuleStore((s) => s.updateParam)
  const removeModule = useModuleStore((s) => s.removeModule)
  const clearSpringIn = useModuleStore((s) => s.clearSpringIn)
  const hoverTarget = useModuleStore((s) => s.wiring.hoverTargetPort)
  const wiringActive = useModuleStore((s) => s.wiring.active)

  const handleParamChange = useCallback(
    (key: string, value: number) => {
      updateParam(module.id, key, value)
    },
    [module.id, updateParam]
  )

  const onAnimationEnd = useCallback(() => {
    clearSpringIn(module.id)
  }, [module.id, clearSpringIn])

  const left = module.gridX
  const top = module.gridY

  const paramConfigs = PARAM_CONFIGS[module.type]

  const inputPortHovered = (index: number) =>
    wiringActive &&
    hoverTarget?.moduleId === module.id &&
    hoverTarget.direction === 'input' &&
    hoverTarget.portIndex === index

  const outputPortHovered = (index: number) =>
    wiringActive &&
    hoverTarget?.moduleId === module.id &&
    hoverTarget.direction === 'output' &&
    hoverTarget.portIndex === index

  const activationStyle = module.activated
    ? {
        border: '2px solid #ff6b6b',
        boxShadow:
          '0 0 16px rgba(255,107,107,0.6), 0 0 32px rgba(254,202,87,0.25), inset 0 0 12px rgba(255,107,107,0.1)',
        animation: 'warm-breathe 2s ease-in-out infinite',
      }
    : {
        border: '1.5px solid rgba(124, 58, 237, 0.4)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4), 0 0 10px rgba(124, 58, 237, 0.12)',
      }

  const paramSliderStyle = useMemo(() => `
    .p-slider::-webkit-slider-thumb {
      appearance: none;
      width: 14px; height: 14px;
      border-radius: 50%;
      background: #7c3aed;
      cursor: pointer;
      box-shadow: 0 0 8px rgba(124,58,237,0.6);
    }
    .p-slider::-moz-range-thumb {
      width: 14px; height: 14px;
      border-radius: 50%;
      background: #7c3aed;
      border: none;
      cursor: pointer;
    }
  `, [])

  return (
    <div
      className={`absolute select-none ${module.springIn ? 'module-spring-in' : ''}`}
      style={{
        left,
        top,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 10,
        background: 'rgba(22, 22, 40, 0.95)',
        ...activationStyle,
      }}
      onAnimationEnd={onAnimationEnd}
    >
      <style>{paramSliderStyle}</style>

      <div
        className="flex items-center justify-between px-3 py-2 cursor-grab active:cursor-grabbing border-b border-synth-border/50 rounded-t-[9px]"
        style={{ background: 'rgba(124,58,237,0.06)' }}
        onMouseDown={(e) => onModuleDragStart(module.id, e)}
        onMouseUp={() => onModuleDragEnd(module.id)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm text-synth-primary shrink-0">{MODULE_ICONS[module.type]}</span>
          <span className="font-display text-xs font-semibold text-slate-200 truncate">
            {MODULE_LABELS[module.type]}
          </span>
        </div>
        <button
          className="text-slate-500 hover:text-red-400 transition-colors text-sm leading-none shrink-0 ml-1"
          onClick={(e) => {
            e.stopPropagation()
            removeModule(module.id)
          }}
        >
          ✕
        </button>
      </div>

      <div className="px-3 py-2 flex-1 overflow-y-auto space-y-1.5" style={{ maxHeight: CARD_HEIGHT - 48 }}>
        {paramConfigs.map((cfg) => (
          <div key={cfg.key} className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-slate-400 w-10 shrink-0">
              {cfg.label}
            </span>
            <input
              type="range"
              min={cfg.min}
              max={cfg.max}
              step={cfg.step}
              value={module.params[cfg.key]}
              onChange={(e) => handleParamChange(cfg.key, parseFloat(e.target.value))}
              className="p-slider flex-1 h-1 appearance-none bg-synth-border rounded-full cursor-pointer"
            />
            <span className="font-mono text-[10px] text-synth-highlight w-8 text-right shrink-0">
              {module.type === 'oscillator' && cfg.key === 'type'
                ? OSC_TYPE_LABELS[Math.floor(module.params[cfg.key])]
                : cfg.step < 1
                ? module.params[cfg.key].toFixed(cfg.step < 0.01 ? 2 : 1)
                : Math.round(module.params[cfg.key]).toString()}
            </span>
          </div>
        ))}
      </div>

      {/* Input Ports */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col gap-3 -translate-x-1/2" style={{ zIndex: 20 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={`in-${i}`}
            className="port-dot input relative"
            data-module-id={module.id}
            data-port-direction="input"
            data-port-index={i}
            onMouseDown={(e) => {
              e.stopPropagation()
              onPortMouseDown(module.id, 'input', i, e)
            }}
            style={inputPortHovered(i)
              ? {
                  background: '#22d3ee',
                  transform: 'scale(1.8)',
                  boxShadow: '0 0 16px #22d3ee, 0 0 28px rgba(34,211,238,0.6)',
                }
              : undefined}
          />
        ))}
      </div>

      {/* Output Ports */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-3 translate-x-1/2" style={{ zIndex: 20 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={`out-${i}`}
            className="port-dot output relative"
            data-module-id={module.id}
            data-port-direction="output"
            data-port-index={i}
            onMouseDown={(e) => {
              e.stopPropagation()
              onPortMouseDown(module.id, 'output', i, e)
            }}
            style={outputPortHovered(i)
              ? {
                  background: '#7c3aed',
                  transform: 'scale(1.8)',
                  boxShadow: '0 0 16px #7c3aed, 0 0 28px rgba(124,58,237,0.6)',
                }
              : undefined}
          />
        ))}
      </div>
    </div>
  )
}
