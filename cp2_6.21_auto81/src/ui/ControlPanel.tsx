import { useRef, useState } from 'react'
import { Trash2, Wind, Droplets, Flame, Droplet } from 'lucide-react'
import { useSimulationStore, type GradientMode } from '@/store/useSimulationStore'
import { cn } from '@/lib/utils'

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  format?: (v: number) => string
  unit?: string
}

function Slider({ label, value, min, max, step, onChange, format, unit = '' }: SliderProps) {
  const tooltipRef = useRef<HTMLDivElement>(null)

  const displayValue = format ? format(value) : value.toFixed(2)

  return (
    <div className="param-row">
      <span className="param-label">{label}</span>
      <div className="slider-container flex-1 mx-3">
        <div className="slider-tooltip" ref={tooltipRef}>
          {displayValue}{unit}
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>
      <span className="param-value">{displayValue}{unit}</span>
    </div>
  )
}

interface Vec3SliderProps {
  label: string
  value: [number, number, number]
  min: number
  max: number
  step: number
  onChange: (v: [number, number, number]) => void
}

function Vec3Slider({ label, value, min, max, step, onChange }: Vec3SliderProps) {
  return (
    <div className="mb-2">
      <div className="param-label mb-2" style={{ marginBottom: '6px' }}>{label}</div>
      <div className="space-y-1.5">
        {(['X', 'Y', 'Z'] as const).map((axis, i) => (
          <div key={axis} className="flex items-center gap-2">
            <span
            className="text-xs font-mono w-4 text-center"
              style={{ color: i === 0 ? '#e94560' : i === 1 ? '#00d2ff' : '#ffd200' }}
            >
              {axis}
            </span>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={value[i]}
              onChange={(e) => {
                const newVal = [...value] as [number, number, number]
                newVal[i] = parseFloat(e.target.value)
                onChange(newVal)
              }}
              className="flex-1 h-1"
            />
            <span className="param-value text-[10px] w-10">
              {value[i].toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function GradientToggle({ mode, onChange }: { mode: GradientMode; onChange: (m: GradientMode) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange('linear')}
        className={cn(
          "flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-all spring-animate border",
          mode === 'linear'
            ? "bg-[var(--accent-start)] border-[var(--accent-start)] text-white"
            : "bg-transparent border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-start)]/50"
        )}
      >
        线性渐变
      </button>
      <button
        onClick={() => onChange('exponential')}
        className={cn(
          "flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-all spring-animate border",
          mode === 'exponential'
            ? "bg-[var(--accent-start)] border-[var(--accent-start)] text-white"
            : "bg-transparent border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-start)]/50"
        )}
      >
        指数渐变
      </button>
    </div>
  )
}

function EmitterTabs() {
  const emitters = useSimulationStore((s) => s.emitters)
  const activeEmitterId = useSimulationStore((s) => s.activeEmitterId)
  const setActiveEmitter = useSimulationStore((s) => s.setActiveEmitter)

  if (emitters.length === 0) return null

  return (
    <div className="flex gap-2 flex-wrap">
      {emitters.map((em, idx) => (
        <button
          key={em.id}
          onClick={() => setActiveEmitter(em.id)}
          className={cn("emitter-tab", activeEmitterId === em.id ? 'active' : '')}
          style={{
            borderColor: activeEmitterId === em.id ? em.colorStart : undefined,
          }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: em.colorStart }}
          />
          发射器 {idx + 1}
        </button>
      ))}
    </div>
  )
}

function ActiveEmitterPanel() {
  const emitters = useSimulationStore((s) => s.emitters)
  const activeEmitterId = useSimulationStore((s) => s.activeEmitterId)
  const updateEmitter = useSimulationStore((s) => s.updateEmitter)
  const removeEmitter = useSimulationStore((s) => s.removeEmitter)

  const active = emitters.find((e) => e.id === activeEmitterId)

  if (!active) {
    return (
      <div className="text-center py-8 text-sm text-[var(--text-dim)]">
        选择一个发射器以编辑参数
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: active.colorStart }}
          />
          <span className="text-sm font-medium">发射器参数</span>
        </div>
        <button
          onClick={() => removeEmitter(active.id)}
          className="p-1.5 rounded-md text-[var(--text-dim)] hover:text-[var(--accent-start)] hover:bg-[var(--accent-start)]/10 transition-all spring-animate"
          title="删除发射器"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <Slider
        label="生命周期"
        value={active.lifetime}
        min={1}
        max={8}
        step={0.1}
        onChange={(v) => updateEmitter(active.id, { lifetime: v })}
        unit="s"
      />

      <Slider
        label="发射速率"
        value={active.emitRate}
        min={50}
        max={500}
        step={10}
        onChange={(v) => updateEmitter(active.id, { emitRate: v })}
        format={(v) => v.toFixed(0)}
        unit="/s"
      />

      <Slider
        label="粒子大小"
        value={active.particleSize}
        min={1}
        max={6}
        step={0.5}
        onChange={(v) => updateEmitter(active.id, { particleSize: v })}
        unit="px"
      />

      <Vec3Slider
        label="初始速度"
        value={active.velocity}
        min={-10}
        max={10}
        step={0.5}
        onChange={(v) => updateEmitter(active.id, { velocity: v })}
      />

      <div>
        <div className="param-label mb-2">颜色渐变</div>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 flex items-center gap-2">
            <span className="text-xs text-[var(--text-dim)] w-8">起始</span>
            <input
              type="color"
              value={active.colorStart}
              onChange={(e) => updateEmitter(active.id, { colorStart: e.target.value })}
            />
          </div>
          <div className="flex-1 flex items-center gap-2">
            <span className="text-xs text-[var(--text-dim)] w-8">终止</span>
            <input
              type="color"
              value={active.colorEnd}
              onChange={(e) => updateEmitter(active.id, { colorEnd: e.target.value })}
            />
          </div>
        </div>
        <GradientToggle
          mode={active.gradientMode}
          onChange={(m) => updateEmitter(active.id, { gradientMode: m })}
        />
      </div>
    </div>
  )
}

export default function ControlPanel() {
  const physics = useSimulationStore((s) => s.physics)
  const updatePhysics = useSimulationStore((s) => s.updatePhysics)
  const emitters = useSimulationStore((s) => s.emitters)

  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{ backgroundColor: 'var(--bg-panel)' }}
    >
      <div className="panel-section">
        <h2 className="text-base font-semibold mb-1" style={{ fontFamily: 'var(--font-ui)' }}>
          粒子流体动力学模拟器
        </h2>
        <p className="text-xs text-[var(--text-dim)]">
          点击场景放置发射器，调节参数观察粒子运动
        </p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="panel-section">
          <div className="section-title flex items-center gap-2">
            <Droplets size={12} />
            全局物理参数
          </div>

          <Slider
            label="粘滞系数"
            value={physics.viscosity}
            min={0.01}
            max={1.0}
            step={0.01}
            onChange={(v) => updatePhysics({ viscosity: v })}
          />

          <Slider
            label="重力强度"
            value={physics.gravity}
            min={-2}
            max={2}
            step={0.05}
            onChange={(v) => updatePhysics({ gravity: v })}
          />

          <Slider
            label="涡流频率"
            value={physics.vortexFrequency}
            min={0.1}
            max={5.0}
            step={0.1}
            onChange={(v) => updatePhysics({ vortexFrequency: v })}
          />

          <Slider
            label="涡流振幅"
            value={physics.vortexAmplitude}
            min={0}
            max={10}
            step={0.2}
            onChange={(v) => updatePhysics({ vortexAmplitude: v })}
          />
        </div>

        <div className="panel-section">
          <div className="section-title flex items-center gap-2">
            <Wind size={12} />
            风场控制
          </div>

          <Slider
            label="风强度"
            value={physics.windStrength}
            min={0}
            max={5}
            step={0.1}
            onChange={(v) => updatePhysics({ windStrength: v })}
          />

          <Vec3Slider
            label="风向"
            value={physics.windDirection}
            min={-1}
            max={1}
            step={0.1}
            onChange={(v) => updatePhysics({ windDirection: v })}
          />
        </div>

        <div className="panel-section">
          <div className="section-title flex items-center gap-2">
            <Flame size={12} />
            粒子外观
          </div>

          <Slider
            label="拖尾长度"
            value={physics.trailLength}
            min={0.1}
            max={2.0}
            step={0.1}
            onChange={(v) => updatePhysics({ trailLength: v })}
            unit="s"
          />
        </div>

        <div className="panel-section">
          <div className="section-title flex items-center gap-2">
            <Droplet size={12} />
            发射器
            <span className="ml-auto text-[10px] font-normal">
              {emitters.length}/3
            </span>
          </div>

          <EmitterTabs />

          <div className="mt-4">
            <ActiveEmitterPanel />
          </div>
        </div>
      </div>

      <div className="panel-section text-center">
        <p className="text-[10px] text-[var(--text-dim)] text-center">
          点击地面放置发射器 · 拖拽旋转视角 · 滚轮缩放
        </p>
      </div>
    </div>
  )
}
