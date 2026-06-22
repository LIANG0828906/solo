import { useClimateStore } from '@/store/useClimateStore'
import type { DataType } from '@/utils/dataLoader'

const dataTypeLabels: Record<DataType, string> = {
  temperature: '温度',
  precipitation: '降水',
  wind: '风速',
}

const dataUnits: Record<DataType, string> = {
  temperature: '°C',
  precipitation: 'mm',
  wind: 'm/s',
}

const dataRanges: Record<DataType, { min: number; max: number }> = {
  temperature: { min: -40, max: 45 },
  precipitation: { min: 0, max: 2000 },
  wind: { min: 0, max: 100 },
}

const gradientColors: Record<DataType, string> = {
  temperature: 'linear-gradient(to right, #3b82f6, #22c55e, #ef4444)',
  precipitation: 'linear-gradient(to right, #065f46, #10b981, #67e8f9)',
  wind: 'linear-gradient(to right, #facc15, #a855f7, #6366f1)',
}

export default function InfoPanel() {
  const dataType = useClimateStore((state) => state.dataType)
  const displayYear = useClimateStore((state) => state.displayYear)
  const range = dataRanges[dataType]

  const midValue = (range.min + range.max) / 2

  return (
    <div className="fixed right-4 md:right-6 top-24 z-40 w-56 md:w-64">
      <div className="glass-panel p-4 md:p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold text-lg">{dataTypeLabels[dataType]}</h3>
          <span className="text-white/60 text-sm">{displayYear}年</span>
        </div>

        <div className="mb-3">
          <div
            className="h-3 rounded-full"
            style={{ background: gradientColors[dataType] }}
          />
        </div>

        <div className="flex justify-between text-xs text-white/60">
          <div className="flex flex-col">
            <span className="text-white/40">最低</span>
            <span className="text-white font-medium">
              {range.min}{dataUnits[dataType]}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-white/40">平均</span>
            <span className="text-white font-medium">
              {midValue.toFixed(0)}{dataUnits[dataType]}
            </span>
          </div>
          <div className="flex flex-col items-right">
            <span className="text-white/40">最高</span>
            <span className="text-white font-medium">
              {range.max}{dataUnits[dataType]}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/10">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/50">数据类型</span>
            <span className="text-white/80">{dataTypeLabels[dataType]}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
