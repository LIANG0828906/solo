import { useState } from 'react'
import { Globe, Snowflake, Wind, Menu, X } from 'lucide-react'
import { useClimateStore, type ViewPreset } from '@/store/useClimateStore'
import type { DataType } from '@/utils/dataLoader'
import { cn } from '@/lib/utils'

const dataTypes: { type: DataType; label: string; gradient: string }[] = [
  { type: 'temperature', label: '温度', gradient: 'from-red-500 to-blue-500' },
  { type: 'precipitation', label: '降水', gradient: 'from-green-400 to-emerald-600' },
  { type: 'wind', label: '风速', gradient: 'from-yellow-400 to-purple-500' },
]

const viewPresets: { preset: ViewPreset; label: string; icon: typeof Globe }[] = [
  { preset: 'global', label: '全球视角', icon: Globe },
  { preset: 'northPole', label: '北极视角', icon: Snowflake },
  { preset: 'equator', label: '赤道视角', icon: Wind },
]

export default function ControlBar() {
  const dataType = useClimateStore((state) => state.dataType)
  const setDataType = useClimateStore((state) => state.setDataType)
  const viewPreset = useClimateStore((state) => state.viewPreset)
  const setViewPreset = useClimateStore((state) => state.setViewPreset)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-4xl px-4">
      <div className="glass-panel flex items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          {dataTypes.map((item) => (
            <button
              key={item.type}
              onClick={() => setDataType(item.type)}
              className={cn(
                'relative w-12 h-12 rounded-full transition-all duration-300',
                'hover:-translate-y-0.5 hover:brightness-110',
                'active:scale-95',
                'bg-gradient-to-r',
                item.gradient,
                'p-[2px]'
              )}
              title={item.label}
            >
              <span
                className={cn(
                  'flex items-center justify-center w-full h-full rounded-full text-white text-sm font-medium transition-all duration-300',
                  dataType === item.type
                    ? 'bg-gradient-to-r ' + item.gradient
                    : 'bg-[#0a0e27]'
                )}
              >
                {item.label.charAt(0)}
              </span>
            </button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          {viewPresets.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.preset}
                onClick={() => setViewPreset(item.preset)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-300',
                  'hover:-translate-y-0.5 hover:brightness-110',
                  'active:scale-95',
                  viewPreset === item.preset
                    ? 'bg-white/20 text-white'
                    : 'text-white/60 hover:text-white/80 hover:bg-white/10'
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>

        <button
          className="md:hidden text-white/80 hover:text-white transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden glass-panel mt-2 p-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          {viewPresets.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.preset}
                onClick={() => {
                  setViewPreset(item.preset)
                  setMobileMenuOpen(false)
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-300',
                  'active:scale-95',
                  viewPreset === item.preset
                    ? 'bg-white/20 text-white'
                    : 'text-white/60 hover:text-white/80 hover:bg-white/10'
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
