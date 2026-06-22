import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  rounded?: boolean
}

export default function Skeleton({
  className,
  width,
  height,
  rounded = false,
}: SkeletonProps) {
  const style: React.CSSProperties = {}
  if (width !== undefined) style.width = typeof width === 'number' ? `${width}px` : width
  if (height !== undefined) style.height = typeof height === 'number' ? `${height}px` : height

  return (
    <div
      className={cn('skeleton-block animate-pulseSkeleton', rounded && 'rounded-full', className)}
      style={style}
    />
  )
}
