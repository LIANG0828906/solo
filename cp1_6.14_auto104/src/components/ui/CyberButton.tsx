import React, { useCallback } from 'react'
import styled from '@emotion/styled'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cyberTheme } from '@/styles/theme'
import { sfx } from '@/utils/soundEffects'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md' | 'lg' | 'block'

interface CyberButtonProps extends HTMLMotionProps<'button'> {
  variant?: Variant
  size?: Size
  accentColor?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const variantStyles = {
  primary: {
    bg: `linear-gradient(135deg, ${cyberTheme.colors.neonCyan}18 0%, ${cyberTheme.colors.neonPurple}18 100%)`,
    border: cyberTheme.colors.neonCyan,
    text: cyberTheme.colors.neonCyan,
    glow: cyberTheme.shadows.neonCyan
  },
  secondary: {
    bg: `linear-gradient(135deg, ${cyberTheme.colors.neonPurple}18 0%, transparent 100%)`,
    border: cyberTheme.colors.neonPurpleSoft,
    text: cyberTheme.colors.neonPurpleSoft,
    glow: cyberTheme.shadows.neonPurple
  },
  danger: {
    bg: `linear-gradient(135deg, ${cyberTheme.colors.neonRed}18 0%, transparent 100%)`,
    border: cyberTheme.colors.neonRedSoft,
    text: cyberTheme.colors.neonRedSoft,
    glow: cyberTheme.shadows.neonRed
  },
  ghost: {
    bg: 'transparent',
    border: cyberTheme.colors.borderGlow,
    text: cyberTheme.colors.textSecondary,
    glow: 'none'
  }
}

const sizeStyles = {
  sm: { padding: '6px 14px', fontSize: 13, minHeight: 32 },
  md: { padding: '10px 20px', fontSize: 14, minHeight: 40 },
  lg: { padding: '14px 28px', fontSize: 16, minHeight: 50 },
  block: { padding: '12px 24px', fontSize: 15, minHeight: 44, width: '100%' }
}

const ButtonBase = styled(motion.button)<{ $variant: Variant; $size: Size; $accent?: string }>(
  ({ $variant, $size, $accent }) => {
    const v = variantStyles[$variant]
    const s = sizeStyles[$size]
    const borderColor = $accent ?? v.border
    const textColor = $accent ?? v.text
    return {
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: s.padding,
      minHeight: s.minHeight,
      width: $size === 'block' ? '100%' : undefined,
      fontSize: s.fontSize,
      fontFamily: cyberTheme.fonts.display,
      fontWeight: 700,
      letterSpacing: '0.08em',
      color: textColor,
      background: v.bg,
      border: `1.5px solid ${borderColor}55`,
      clipPath: cyberTheme.clipPaths.notched,
      overflow: 'hidden',
      isolation: 'isolate',
      textTransform: 'uppercase',
      transition: 'all 180ms ease-out',
      '&::before': {
        content: '""',
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(90deg, transparent 0%, ${borderColor}18 50%, transparent 100%)`,
        transform: 'translateX(-120%)',
        transition: 'transform 400ms ease-out',
        zIndex: -1
      },
      '&::after': {
        content: '""',
        position: 'absolute',
        inset: 0,
        border: `1.5px solid transparent`,
        borderImage: `linear-gradient(135deg, ${borderColor} 0%, transparent 50%, ${borderColor} 100%) 1`,
        opacity: 0,
        transition: 'opacity 200ms ease-out',
        clipPath: cyberTheme.clipPaths.notched,
        pointerEvents: 'none'
      },
      '&:hover': {
        borderColor: `${borderColor}99`,
        boxShadow: `inset 0 0 16px ${borderColor}22, 0 0 12px ${borderColor}44`,
        color: textColor,
        '&::before': { transform: 'translateX(120%)' },
        '&::after': { opacity: 1 }
      },
      '&:active': {
        transform: 'translateY(1px) scale(0.98)',
        filter: 'brightness(0.85)'
      },
      '&:disabled': {
        opacity: 0.4,
        cursor: 'not-allowed',
        filter: 'grayscale(0.6)',
        '&:hover': { boxShadow: 'none', '&::before': { transform: 'translateX(-120%)' } }
      }
    }
  }
)

export const CyberButton: React.FC<CyberButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  accentColor,
  leftIcon,
  rightIcon,
  onMouseEnter,
  onClick,
  ...rest
}) => {
  const handleEnter = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      sfx.hover()
      onMouseEnter?.(e)
    },
    [onMouseEnter]
  )
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      sfx.click()
      onClick?.(e)
    },
    [onClick]
  )

  return (
    <ButtonBase
      $variant={variant}
      $size={size}
      $accent={accentColor}
      onMouseEnter={handleEnter}
      onClick={handleClick}
      whileTap={{ scale: 0.97 }}
      {...rest}
    >
      {leftIcon && <span style={{ display: 'inline-flex' }}>{leftIcon}</span>}
      {children}
      {rightIcon && <span style={{ display: 'inline-flex' }}>{rightIcon}</span>}
    </ButtonBase>
  )
}
