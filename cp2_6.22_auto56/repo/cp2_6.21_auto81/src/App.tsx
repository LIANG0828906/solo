import { useState, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSimulationStore, type GradientMode } from '@/store/useSimulationStore'
import ParticleScene from '@/scene/ParticleScene'
import ControlPanel from '@/ui/ControlPanel'

export default function App() {
  const [isMobile, setIsMobile] = useState(false)
  const [activeTab, setActiveTab] = useState<'physics' | 'emitters' | 'appearance'>('physics')

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (isMobile) {
    return (
      <div className="w-full h-full flex flex-col" style={{ background: 'var(--bg-primary)' }}>
        <div className="flex-1 relative overflow-hidden">
          <ParticleScene />
        </div>

        <div
          className="flex-shrink-0 border-t"
          style={{
            backgroundColor: 'var(--bg-panel)',
            borderColor: 'var(--border-color)',
            height: '45%',
          }}
        >
          <div className="flex border-b" style={{ borderColor: 'var(--border-color)' }}>
            {(['physics', 'emitters', 'appearance'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 py-2.5 text-xs font-medium transition-all spring-animate"
                style={{
                  color: activeTab === tab ? 'var(--accent-start)' : 'var(--text-secondary)',
                  borderBottom: activeTab === tab ? '2px solid var(--accent-start)' : '2px solid transparent',
                }}
              >
                {tab === 'physics' ? '物理参数' : tab === 'emitters' ? '发射器' : '外观'}
              </button>
            ))}
          </div>
          <div className="h-full overflow-y-auto scrollbar-thin">
            <MobilePanelContent activeTab={activeTab} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex" style={{ background: 'var(--bg-primary)' }}>
      <div className="flex-1 relative overflow-hidden">
        <ParticleScene />
      </div>

      <div
        className="flex-shrink-0 border-l"
        style={{
          width: '320px',
          backgroundColor: 'var(--bg-panel)',
          borderColor: 'var(--border-color)',
        }}
      >
        <ControlPanel />
      </div>
    </div>
  )
}

function MobilePanelContent({ activeTab }: { activeTab: 'physics' | 'emitters' | 'appearance' }) {
  if (activeTab === 'physics') return <PhysicsSection />
  if (activeTab === 'emitters') return <EmittersSection />
  return <AppearanceSection />
}

function Slider({ label, value, min, max, step, onChange, format, unit = '' }: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  format?: (v: number) => string
  unit?: string
}) {
  const displayValue = format ? format(value) : value.toFixed(2)
  return (
    <div className="param-row">
      <span className="param-label">{label}</span>
      <div className="slider-container flex-1 mx-3">
        <div className="slider-tooltip">{displayValue}{unit}</div>
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

function Vec3Slider({ label, value, min, max, step, onChange }: {
  label: string
  value: [number, number, number]
  min: number
  max: number
  step: number
  onChange: (v: [number, number, number]) => void
}) {
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

function PhysicsSection() {
  const physics = useSimulationStore((s) => s.physics)
  const updatePhysics = useSimulationStore((s) => s.updatePhysics)

  return (
    <div className="panel-section">
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
  )
}

function EmittersSection() {
  const emitters = useSimulationStore((s) => s.emitters)
  const activeEmitterId = useSimulationStore((s) => s.activeEmitterId)
  const setActiveEmitter = useSimulationStore((s) => s.setActiveEmitter)
  const updateEmitter = useSimulationStore((s) => s.updateEmitter)
  const removeEmitter = useSimulationStore((s) => s.removeEmitter)
  const active = emitters.find((e) => e.id === activeEmitterId)

  return (
    <div className="panel-section">
      <div className="flex gap-2 flex-wrap mb-4">
        {emitters.length === 0 && (
          <p className="text-xs text-[var(--text-dim)]">点击场景地面放置发射器</p>
        )}
        {emitters.map((em, idx) => (
          <button
            key={em.id}
            onClick={() => setActiveEmitter(em.id)}
            className={`emitter-tab ${activeEmitterId === em.id ? 'active' : ''}`}
            style={{ borderColor: activeEmitterId === em.id ? em.colorStart : undefined }}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: em.colorStart }} />
            发射器 {idx + 1}
          </button>
        ))}
      </div>

      {active && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: active.colorStart }} />
              <span className="text-sm font-medium">参数设置</span>
            </div>
            <button
              onClick={() => removeEmitter(active.id)}
              className="p-1.5 rounded-md text-[var(--text-dim)] hover:text-[var(--accent-start)] hover:bg-[var(--accent-start)]/10 transition-all spring-animate"
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
      )}
    </div>
  )
}

function AppearanceSection() {
  const physics = useSimulationStore((s) => s.physics)
  const updatePhysics = useSimulationStore((s) => s.updatePhysics)

  return (
    <div className="panel-section">
      <div className="section-title">粒子外观</div>
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
  )
}
