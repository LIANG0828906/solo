import { cn } from '@/lib/utils'

interface EmptyProps {
  icon?: string
  title?: string
  description?: string
  message?: string
  className?: string
}

export default function Empty({
  icon = '📭',
  title = '暂无数据',
  description,
  message,
  className,
}: EmptyProps) {
  return (
    <div className={cn('empty-state', className)}>
      <div className="empty-state-icon">{icon}</div>
      <h3 className="text-lg font-semibold text-primary mb-2">{title}</h3>
      <p className="text-muted">{description || message}</p>
    </div>
  )
}
