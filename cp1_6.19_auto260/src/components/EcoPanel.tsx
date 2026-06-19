import { motion } from 'framer-motion'
import { useEcosystemStore } from '@/store/ecosystemStore'

interface ParamConfig {
  key: 'temperature' | 'humidity' | 'light' | 'co2'
  label: string
  unit: string
  min: number
  max: number
  gradient: string
}

const params: ParamConfig[] = [
  {
    key: 'temperature',
    label: '温度',
    unit: '°C',
    min: 15,
    max: 45,
    gradient: 'linear-gradient(to right, #3b82f6, #ef4444)',
  },
  {
    key: 'humidity',
    label: '湿度',
    unit: '%',
    min: 20,
    max: 100,
    gradient: 'linear-gradient(to right, #3b82f6, #ffffff)',
  },
  {
    key: 'light',
    label: '光照',
    unit: 'lux',
    min: 500,
    max: 8000,
    gradient: 'linear-gradient(to right, #eab308, #ffffff)',
  },
  {
    key: 'co2',
    label: 'CO₂',
    unit: 'ppm',
    min: 300,
    max: 2000,
    gradient: 'linear-gradient(to right, #22c55e, #ef4444)',
  },
]

const prevKeyMap: Record<ParamConfig['key'], `prev${string}`> = {
  temperature: 'prevTemperature',
  humidity: 'prevHumidity',
  light: 'prevLight',
  co2: 'prevCo2',
}

function DeltaIndicator({ current, prev }: { current: number; prev: number }) {
  if (current > prev) {
    return <span className="text-xs text-green-400">▲</span>
  }
  if (current < prev) {
    return <span className="text-xs text-red-400">▼</span>
  }
  return null
}

function ParamSlider({ config }: { config: ParamConfig }) {
  const value = useEcosystemStore((s) => s[config.key])
  const prevValue = useEcosystemStore((s) => s[prevKeyMap[config.key]]) as number
  const setParam = useEcosystemStore((s) => s.setParam)

  return (
    <div className="rounded-lg border border-white/[0.08] bg-white/[0.04] p-3 backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-white/70">{config.label}</span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-white">{value}</span>
          <span className="text-white/50 text-xs">{config.unit}</span>
          <DeltaIndicator current={value} prev={prevValue} />
        </div>
      </div>
      <div className="relative">
        <div
          className="pointer-events-none absolute inset-x-0 top-1/2 h-[6px] -translate-y-1/2 rounded-full"
          style={{ background: config.gradient }}
        />
        <input
          type="range"
          min={config.min}
          max={config.max}
          value={value}
          onChange={(e) => setParam(config.key, Number(e.target.value))}
          className="relative z-10 w-full cursor-pointer"
          style={{
            WebkitAppearance: 'none',
            appearance: 'none',
            height: 6,
            background: 'transparent',
          }}
        />
      </div>
      <div className="mt-1 flex justify-between text-white/30 text-[10px]">
        <span>{config.min}</span>
        <span>{config.max}</span>
      </div>
    </div>
  )
)

export default function EcoPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="h-full w-full overflow-y-auto rounded-lg border border-white/[0.08] bg-white/[0.06] p-4"
      style={{ backdropFilter: 'blur(8px)' }}
    >
      <h2 className="mb-4 text-lg font-bold text-cyan-400">环境控制</h2>
      <div className="flex flex-col gap-3">
        {params.map((p) => (
          <ParamSlider key={p.key} config={p} />
        ))}
      </div>

      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 4px rgba(0,0,0,0.3);
        }
        input[type=range]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 4px rgba(0,0,0,0.3);
        }
      `}</style>
    </motion.div>
  )
}
