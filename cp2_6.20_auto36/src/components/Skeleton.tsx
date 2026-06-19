import { motion } from 'framer-motion'

type SkeletonVariant = 'card' | 'text' | 'circle' | 'button'

interface SkeletonProps {
  variant?: SkeletonVariant
  width?: number | string
  height?: number | string
  count?: number
  style?: React.CSSProperties
}

const pulseAnimation = {
  initial: { opacity: 0.6 },
  animate: { opacity: 1 },
  transition: {
    duration: 1.5,
    repeat: Infinity,
    repeatType: 'reverse' as const,
    ease: 'easeInOut',
  },
}

const Skeleton = ({ variant = 'text', width, height, count = 1, style }: SkeletonProps) => {
  const getDefaultSize = () => {
    switch (variant) {
      case 'card':
        return { width: '100%', height: '280px' }
      case 'circle':
        return { width: '48px', height: '48px' }
      case 'button':
        return { width: '120px', height: '40px' }
      case 'text':
      default:
        return { width: '100%', height: '16px' }
    }
  }

  const defaultSize = getDefaultSize()
  const finalWidth = width ?? defaultSize.width
  const finalHeight = height ?? defaultSize.height

  const renderSkeleton = (index: number) => {
    const commonStyle: React.CSSProperties = {
      backgroundColor: '#e8e3de',
      width: typeof finalWidth === 'number' ? `${finalWidth}px` : finalWidth,
      height: typeof finalHeight === 'number' ? `${finalHeight}px` : finalHeight,
      ...style,
    }

    if (variant === 'card') {
      return (
        <motion.div
          key={index}
          {...pulseAnimation}
          style={{
            ...commonStyle,
            borderRadius: '16px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: '100%',
              paddingTop: '75%',
              backgroundColor: '#e0dbd6',
            }}
          />
          <div style={{ padding: '16px' }}>
            <div
              style={{
                height: '16px',
                width: '60%',
                backgroundColor: '#e0dbd6',
                borderRadius: '4px',
                marginBottom: '12px',
              }}
            />
            <div
              style={{
                height: '12px',
                width: '40%',
                backgroundColor: '#e0dbd6',
                borderRadius: '4px',
                marginBottom: '8px',
              }}
            />
            <div
              style={{
                height: '20px',
                width: '30%',
                backgroundColor: '#e0dbd6',
                borderRadius: '4px',
              }}
            />
          </div>
        </motion.div>
      )
    }

    if (variant === 'circle') {
      return (
        <motion.div
          key={index}
          {...pulseAnimation}
          style={{
            ...commonStyle,
            borderRadius: '50%',
          }}
        />
      )
    }

    if (variant === 'button') {
      return (
        <motion.div
          key={index}
          {...pulseAnimation}
          style={{
            ...commonStyle,
            borderRadius: '8px',
          }}
        />
      )
    }

    return (
      <motion.div
        key={index}
        {...pulseAnimation}
        style={{
          ...commonStyle,
          borderRadius: '4px',
          marginBottom: index < count - 1 ? '8px' : 0,
          width: typeof finalWidth === 'number'
            ? `${finalWidth}px`
            : index === count - 1 && typeof finalWidth === 'string' && finalWidth === '100%'
              ? '60%'
              : finalWidth,
        }}
      />
    )
  }

  return (
    <>
      {Array.from({ length: count }).map((_, index) => renderSkeleton(index))}
    </>
  )
}

export const CardSkeleton = (props?: Omit<SkeletonProps, 'variant'>) => <Skeleton variant="card" {...props} />
export const TextSkeleton = (props?: Omit<SkeletonProps, 'variant'>) => <Skeleton variant="text" {...props} />
export const CircleSkeleton = (props?: Omit<SkeletonProps, 'variant'>) => <Skeleton variant="circle" {...props} />
export const ButtonSkeleton = (props?: Omit<SkeletonProps, 'variant'>) => <Skeleton variant="button" {...props} />

export default Skeleton
