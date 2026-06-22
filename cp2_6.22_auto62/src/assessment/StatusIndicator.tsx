interface StatusIndicatorProps {
  status: 'idle' | 'queued' | 'running' | 'completed'
}

const segments = [
  { key: 'queued', label: '排队中' },
  { key: 'running', label: '运行中' },
  { key: 'completed', label: '已完成' },
] as const

const statusIndex: Record<string, number> = {
  idle: -1,
  queued: 0,
  running: 1,
  completed: 2,
}

const segmentColor = (key: string, active: boolean): string => {
  if (!active) return 'bg-gray-200'
  if (key === 'queued') return 'bg-orange-400'
  if (key === 'running') return 'bg-blue-500 animate-pulse-glow'
  return 'bg-green-500'
}

export default function StatusIndicator({ status }: StatusIndicatorProps) {
  const currentIdx = statusIndex[status]

  return (
    <div className="flex items-center gap-2">
      {segments.map((seg, i) => {
        const active = i <= currentIdx
        return (
          <div key={seg.key} className="flex flex-col items-center gap-1 flex-1">
            <div
              className={`h-3 w-full rounded-full transition-colors duration-300 ${segmentColor(seg.key, active)}`}
            />
            <span className={`text-xs ${active ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
              {seg.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
