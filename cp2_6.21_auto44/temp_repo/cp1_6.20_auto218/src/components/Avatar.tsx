import { cn } from '@/lib/utils'

interface AvatarProps {
  name: string
  color?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
}

export default function Avatar({
  name,
  color,
  size = 'md',
  className,
}: AvatarProps) {
  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase()
  }

  const getRandomColor = (name: string) => {
    const colors = [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#96CEB4',
      '#FFEAA7',
      '#DDA0DD',
      '#98D8C8',
      '#F7DC6F',
      '#BB8FCE',
      '#85C1E9',
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  const bgColor = color || getRandomColor(name)
  const initial = getInitial(name)

  return (
    <div
      className={cn(
        'rounded-full',
        'flex items-center justify-center',
        'font-semibold text-white',
        'shadow-lg',
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: bgColor,
        boxShadow: `0 4px 14px ${bgColor}40`,
      }}
    >
      {initial}
    </div>
  )
}
