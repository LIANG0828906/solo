import React, { useState, useEffect, useCallback } from 'react'

export type AnimationType = 
  | 'bounceInUp'
  | 'shrinkFadeOut'
  | 'fadeIn'
  | 'fadeInUp'
  | 'fadeOut'
  | 'slideInLeft'
  | 'slideInRight'
  | 'none'

interface AnimationWrapperProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
  animation?: AnimationType
  duration?: number
  delay?: number
  visible?: boolean
  onAnimationComplete?: () => void
  onExited?: () => void
  as?: keyof JSX.IntrinsicElements
}

const ANIMATION_CLASSES: Record<AnimationType, string> = {
  bounceInUp: 'anim-bounce-in-up',
  shrinkFadeOut: 'anim-shrink-fade-out',
  fadeIn: 'anim-fade-in',
  fadeInUp: 'anim-fade-in-up',
  fadeOut: 'anim-fade-out',
  slideInLeft: 'anim-slide-in-left',
  slideInRight: 'anim-slide-in-right',
  none: '',
}

function AnimationWrapper({
  children,
  animation = 'bounceInUp',
  duration = 400,
  delay = 0,
  visible = true,
  className = '',
  onAnimationComplete,
  onExited,
  as: Component = 'div',
  ...restProps
}: AnimationWrapperProps) {
  const [isRendered, setIsRendered] = useState(visible)
  const [isAnimating, setIsAnimating] = useState(false)
  const [currentAnimation, setCurrentAnimation] = useState<AnimationType>(
    visible ? animation : 'none'
  )

  useEffect(() => {
    if (visible) {
      setIsRendered(true)
      setCurrentAnimation(animation)
      setIsAnimating(true)
    } else if (isRendered) {
      setCurrentAnimation('shrinkFadeOut')
      setIsAnimating(true)
    }
  }, [visible, animation, isRendered])

  const handleAnimationEnd = useCallback(() => {
    setIsAnimating(false)

    if (!visible && isRendered) {
      setIsRendered(false)
      onExited?.()
    }

    if (visible) {
      onAnimationComplete?.()
    }
  }, [visible, isRendered, onExited, onAnimationComplete])

  useEffect(() => {
    if (!isAnimating) {
      return
    }

    const timer = setTimeout(() => {
      handleAnimationEnd()
    }, duration + delay)

    return () => clearTimeout(timer)
  }, [isAnimating, duration, delay, handleAnimationEnd])

  if (!isRendered) {
    return null
  }

  const animationClass = isAnimating ? ANIMATION_CLASSES[currentAnimation] : ''

  const style: React.CSSProperties = {
    animationDuration: `${duration}ms`,
    animationDelay: `${delay}ms`,
    animationFillMode: 'both',
  }

  return React.createElement(
    Component,
    {
      ...restProps,
      className: `${animationClass} ${className}`.trim(),
      style,
      onAnimationEnd: handleAnimationEnd,
    },
    children
  )
}

export default AnimationWrapper
