import { Leaf } from 'lucide-react'
import type { CareLog } from '@/plantManager/core/plantModel'
import CareLogItem from './CareLogItem'

interface CareLogListProps {
  logs: CareLog[]
  newLogId?: string
}

export default function CareLogList({ logs, newLogId }: CareLogListProps) {
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  if (sortedLogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Leaf className="w-8 h-8" />
        </div>
        <p className="text-sm font-medium text-gray-500">暂无养护记录</p>
        <p className="text-xs text-gray-400 mt-1">开始记录您的植物养护吧</p>
      </div>
    )
  }

  return (
    <div className="overflow-y-auto h-full">
      <div className="relative pr-2">
        {sortedLogs.map((log, index) => (
          <CareLogItem
            key={log.id}
            log={log}
            isNew={newLogId === log.id}
            isLast={index === sortedLogs.length - 1}
          />
        ))}
      </div>
    </div>
  )
}
