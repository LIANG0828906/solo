import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  description?: string
  rightContent?: React.ReactNode
  className?: string
}

export default function PageHeader({
  title,
  subtitle,
  description,
  rightContent,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'mb-8 animate-slide-down',
        className
      )}
      style={{
        animationDuration: '0.4s',
        animationTimingFunction: 'ease-out',
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-darkBlue">{title}</h1>
          {(subtitle || description) && (
            <p className="mt-2 text-gray-600 text-lg">{subtitle || description}</p>
          )}
        </div>
        {rightContent && (
          <div className="flex-shrink-0">{rightContent}</div>
        )}
      </div>
    </div>
  )
}
