import React, { useCallback } from 'react'
import { ModuleType, SynthModule, useModuleStore, MODULE_LABELS, MODULE_ICONS } from '@/store/moduleStore'

const MODULE_TYPES: ModuleType[] = ['oscillator', 'filter', 'envelope', 'delay']

const PARAM_CONFIGS: Record<ModuleType, { key: string; label: string; min: number; max: number; step: number }[]> = {
  oscillator: [
    { key: 'frequency', label: '频率', min: 20, max: 8000, step: 1 },
    { key: 'detune', label: '微调', min: -100, max: 100, step: 1 },
    { key: 'type', label: '波形', min: 0, max: 3, step: 1 },
  ],
  filter: [
    { key: 'frequency', label: '截止频率', min: 20, max: 20000, step: 1 },
    { key: 'Q', label: 'Q值', min: 0.1, max: 30, step: 0.1 },
    { key: 'gain', label: '增益', min: -40, max: 40, step: 0.1 },
  ],
  envelope: [
    { key: 'attack', label: '起音', min: 0.001, max: 2, step: 0.001 },
    { key: 'decay', label: '衰减', min: 0.001, max: 2, step: 0.001 },
    { key: 'sustain', label: '持续', min: 0, max: 1, step: 0.01 },
    { key: 'release', label: '释放', min: 0.001, max: 5, step: 0.001 },
  ],
  delay: [
    { key: 'delayTime', label: '延迟时间', min: 0.01, max: 2, step: 0.01 },
    { key: 'feedback', label: '反馈', min: 0, max: 0.95, step: 0.01 },
    { key: 'mix', label: '混合', min: 0, max: 1, step: 0.01 },
  ],
}

const OSC_TYPE_LABELS = ['正弦波', '方波', '锯齿波', '三角波']

interface ModuleCardLibraryProps {
  onDragStart: (type: ModuleType, e: React.DragEvent) => void
}

export const ModuleLibrary: React.FC<ModuleCardLibraryProps> = ({ onDragStart }) => {
  return (
    <div className="flex flex-col gap-3 p-3">
      <h3 className="font-mono text-xs uppercase tracking-widest text-synth-primary/70 mb-1">
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
          <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{
              boxShadow: '0 0 20px rgba(124, 58, 237, 0.15), inset 0 0 20px rgba(124, 58, 237, 0.05)',
            }}
          />
        </div>
      ))}
    </div>
  )
}

interface ModuleCardPanelProps {
  module: SynthModule
  panelOffset: { x: number; y: number }
  onPortMouseDown: (moduleId: string, direction: 'input' | 'output', portIndex: number, e: React.MouseEvent) => void
  onModuleDragStart: (moduleId: string, e: React.MouseEvent) => void
  onModuleDrag: (moduleId: string, e: React.MouseEvent) => void
  onModuleDragEnd: (moduleId: string) => void
}

export const ModuleCardPanel: React.FC<ModuleCardPanelProps> = ({
  module,
  panelOffset,
  onPortMouseDown,
  onModuleDragStart,
  onModuleDrag,
  onModuleDragEnd,
}) => {
  const updateParam = useModuleStore((s) => s.updateParam)
  const removeModule = useModuleStore((s) => s.removeModule)
  const clearSpringIn = useModuleStore((s) => s.clearSpringIn)

  const handleParamChange = useCallback(
    (key: string, value: number) => {
      updateParam(module.id, key, value)
    },
    [module.id, updateParam]
  )

  const onAnimationEnd = useCallback(() => {
    clearSpringIn(module.id)
  }, [module.id, clearSpringIn])

  const CARD_W = 180
  const CARD_H = 200
  const left = module.gridX - panelOffset.x
  const top = module.gridY - panelOffset.y

  const paramConfigs = PARAM_CONFIGS[module.type]

  return (
    <div
      className={`absolute select-none ${module.springIn ? 'module-spring-in' : ''} ${module.activated ? 'module-activated' : ''}`}
      style={{
        left,
        top,
        width: CARD_W,
        height: CARD_H,
        borderColor: module.activated ? undefined : 'rgba(124, 58, 237, 0.4)',
        borderStyle: 'solid',
        borderWidth: 1.5,
        borderRadius: 10,
        background: 'rgba(26, 26, 46, 0.92)',
        boxShadow: module.activated
          ? undefined
          : '0 4px 20px rgba(0, 0, 0, 0.4), 0 0 12px rgba(124, 58, 237, 0.15)',
      }}
      onAnimationEnd={onAnimationEnd}
    >
      {/* Header - draggable area */}
      <div
        className="flex items-center justify-between px-3 py-2 cursor-grab active:cursor-grabbing border-b border-synth-border/50"
        onMouseDown={(e) => onModuleDragStart(module.id, e)}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm text-synth-primary">{MODULE_ICONS[module.type]}</span>
          <span className="font-display text-xs font-semibold text-slate-200">
            {MODULE_LABELS[module.type]}
          </span>
        </div>
        <button
          className="text-slate-500 hover:text-red-400 transition-colors text-sm leading-none"
          onClick={(e) => {
            e.stopPropagation()
            removeModule(module.id)
          }}
        >
          ✕
        </button>
      </div>

      {/* Parameters */}
      <div className="px-3 py-2 flex-1 overflow-y-auto space-y-1.5" style={{ maxHeight: 130 }}>
        {paramConfigs.map((cfg) => (
          <div key={cfg.key} className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-slate-400 w-12 shrink-0">
              {cfg.label}
            </span>
            <input
              type="range"
              min={cfg.min}
              max={cfg.max}
              step={cfg.step}
              value={module.params[cfg.key]}
              onChange={(e) => handleParamChange(cfg.key, parseFloat(e.target.value))}
              className="flex-1 h-1 appearance-none bg-synth-border rounded-full cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-synth-primary
                [&::-webkit-slider-thumb]:shadow-glow-purple [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <span className="font-mono text-[10px] text-synth-highlight w-10 text-right shrink-0">
              {module.type === 'oscillator' && cfg.key === 'type'
                ? OSC_TYPE_LABELS[Math.floor(module.params[cfg.key])]
                : module.params[cfg.key].toFixed(cfg.step < 1 ? (cfg.step < 0.01 ? 3 : 2) : 0)}
            </span>
          </div>
        ))}
      </div>

      {/* Input Ports (left side) */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col gap-3 -translate-x-1/2">
        {[0, 1, 2].map((i) => (
          <div
            key={`in-${i}`}
            className="port-dot input"
            data-module-id={module.id}
            data-port-direction="input"
            data-port-index={i}
            onMouseDown={(e) => {
              e.stopPropagation()
              onPortMouseDown(module.id, 'input', i, e)
            }}
          />
        ))}
      </div>

      <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-3 translate-x-1/2">
        {[0, 1, 2].map((i) => (
          <div
            key={`out-${i}`}
            className="port-dot output"
            data-module-id={module.id}
            data-port-direction="output"
            data-port-index={i}
            onMouseDown={(e) => {
              e.stopPropagation()
              onPortMouseDown(module.id, 'output', i, e)
            }}
          />
        ))}
      </div>
    </div>
  )
}
