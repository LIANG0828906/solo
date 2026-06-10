import { cn } from '@/lib/utils'

export interface InspirationTask {
  id: string
  name: string
  description: string
  requiredColors: string[]
  targetInspiration: number
  currentInspiration: number
}

interface TaskPanelProps {
  task: InspirationTask
  timeRemaining: number
  taskIndex: number
  totalTasks: number
}

const TOTAL_TIME = 120

export default function TaskPanel({
  task,
  timeRemaining,
  taskIndex,
  totalTasks,
}: TaskPanelProps) {
  const progress = (taskIndex + 1) / totalTasks
  const timeProgress = timeRemaining / TOTAL_TIME
  const isWarning = timeRemaining <= 10

  const getTimeColor = () => {
    if (timeProgress > 0.5) return '#2ecc71'
    if (timeProgress > 0.25) return '#f1c40f'
    return '#e74c3c'
  }

  const strokeDasharray = 2 * Math.PI * 40
  const strokeDashoffset = strokeDasharray * (1 - timeProgress)

  return (
    <div
      className={cn(
        'fixed top-4 right-4 w-[320px]',
        'bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20',
        'shadow-xl overflow-hidden',
        isWarning && 'animate-shake'
      )}
    >
      <div className="relative h-1 bg-white/10">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-stardust-purple to-stardust-blue transition-all duration-300"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2
              className={cn(
                'font-display text-xl font-bold text-white mb-1',
                'bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent'
              )}
            >
              {task.name}
            </h2>
            <p className="text-sm text-white/60 leading-relaxed">
              {task.description}
            </p>
          </div>

          <div className="relative flex-shrink-0">
            <svg width="70" height="70" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="6"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={getTimeColor()}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 50 50)"
                className="transition-all duration-1000"
                style={{
                  filter: isWarning ? 'drop-shadow(0 0 8px #e74c3c)' : 'none',
                }}
              />
            </svg>
            <div
              className={cn(
                'absolute inset-0 flex items-center justify-center',
                'text-lg font-bold',
                isWarning ? 'text-red-400 animate-pulse' : 'text-white'
              )}
            >
              {Math.ceil(timeRemaining)}s
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-white/50">所需星尘</span>
            <div className="flex gap-1.5">
              {task.requiredColors.map((color, index) => (
                <div
                  key={index}
                  className="w-5 h-5 rounded-full border-2 border-white/30"
                  style={{
                    backgroundColor: color,
                    boxShadow: `0 0 8px ${color}80`,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-white/50">灵感值</span>
              <span className="text-sm font-medium text-white">
                {task.currentInspiration} / {task.targetInspiration}
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-stardust-purple via-stardust-blue to-stardust-green rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (task.currentInspiration / task.targetInspiration) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-white/40">
            任务 {taskIndex + 1} / {totalTasks}
          </span>
          <div className="flex gap-1">
            {Array.from({ length: totalTasks }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-300',
                  i < taskIndex
                    ? 'bg-stardust-green'
                    : i === taskIndex
                    ? 'bg-stardust-blue animate-pulse'
                    : 'bg-white/20'
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {isWarning && (
        <div
          className="absolute inset-0 pointer-events-none animate-flash"
          style={{
            background:
              'radial-gradient(circle at center, rgba(231, 76, 60, 0.3) 0%, transparent 70%)',
          }}
        />
      )}
    </div>
  )
}
