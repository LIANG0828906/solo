import { Clock, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Version } from '@/types'

interface VersionHistoryProps {
  versions: Version[]
  onSelectVersion?: (version: Version) => void
  selectedVersionId?: string
  className?: string
}

export default function VersionHistory({
  versions,
  onSelectVersion,
  selectedVersionId,
  className,
}: VersionHistoryProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins} 分钟前`
    if (diffHours < 24) return `${diffHours} 小时前`
    if (diffDays < 7) return `${diffDays} 天前`
    return date.toLocaleDateString('zh-CN')
  }

  if (versions.length === 0) {
    return (
      <div className={cn('p-8 text-center text-dark-muted', className)}>
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>暂无版本记录</p>
        <p className="text-sm mt-1">开始编辑后将自动保存版本</p>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <h3 className="text-lg font-semibold text-dark-text mb-4 px-2">
        版本历史
      </h3>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {versions.map((version, index) => (
          <div
            key={version.id}
            onClick={() => onSelectVersion?.(version)}
            className={cn(
              'p-3 rounded-lg cursor-pointer transition-all duration-200',
              'border border-transparent',
              'hover:bg-dark-surface',
              selectedVersionId === version.id
                ? 'bg-dark-surface border-blue-500/50'
                : 'bg-dark-base'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-sm font-semibold text-blue-400">
                版本 {version.version}
              </span>
              {index === 0 && (
                <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">
                  当前
                </span>
              )}
            </div>
            <p className="text-sm text-dark-text mb-2 line-clamp-2">
              {version.message || '自动保存'}
            </p>
            <div className="flex items-center gap-4 text-xs text-dark-muted">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{formatDate(version.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>作者</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
