import { Droplets, Leaf, Scissors, RefreshCw } from 'lucide-react'
import type { CareLog, CareLogType } from '@/plantManager/core/plantModel'
import { cn, formatDate, formatRelative } from '@/shared/utils'

interface CareLogItemProps {
  log: CareLog
  isNew?: boolean
  isLast?: boolean
}

const typeConfig: Record<CareLogType, {
  label: string
  icon: typeof Droplets
  color: string
  bgColor: string
  dotColor: string
}> = {
  watering: {
    label: '浇水',
    icon: Droplets,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    dotColor: 'bg-blue-500',
  },
  fertilizing: {
    label: '施肥',
    icon: Leaf,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    dotColor: 'bg-green-500',
  },
  pruning: {
    label: '修剪',
    icon: Scissors,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    dotColor: 'bg-orange-500',
  },
  rotating: {
    label: '转盆',
    icon: RefreshCw,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    dotColor: 'bg-purple-500',
  },
}

export default function CareLogItem({ log, isNew, isLast }: CareLogItemProps) {
  const config = typeConfig[log.type]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'relative flex gap-4 pl-2 py-4',
        isNew ? 'animate-slide-in' : ''
      )}
    >
      <div className="relative flex flex-col items-center">
        <div
          className={cn(
            'relative z-10 w-10 h-10 rounded-full flex items-center justify-center',
            config.bgColor,
            'ring-4 ring-white'
          )}
        >
          <Icon className={cn('w-5 h-5', config.color)} />
        </div>
        {!isLast && <div className="absolute top-10 bottom-0 w-0.5 bg-gray-200" />}
      </div>

      <div className="flex-1 min-w-0 pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={cn('font-medium text-gray-900', config.color)}>
              {config.label}
            </span>
            <span className="text-xs text-gray-400">
              {formatRelative(log.date)}
            </span>
          </div>
          <span className="text-xs text-gray-500 flex-shrink-0">
            {formatDate(log.date, 'MM-dd HH:mm')}
          </span>
        </div>

        {log.note && (
          <p className="mt-1.5 text-sm text-gray-600 break-words">
            {log.note}
          </p>
        )}
      </div>
    </div>
  )
}
