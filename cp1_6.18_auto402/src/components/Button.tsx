import type { ReactNode, CSSProperties, MouseEvent } from 'react'

interface Props {
  children: ReactNode
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  style?: CSSProperties
  className?: string
}

const Button = ({ children, onClick, variant = 'primary', size = 'md', disabled, style, className }: Props) => {
  const getBgGradient = () => {
    switch (variant) {
      case 'primary':
        return 'linear-gradient(135deg, #00D4AA, #009FCC)'
      case 'secondary':
        return 'rgba(255,255,255,0.08)'
      case 'danger':
        return 'linear-gradient(135deg, #E74C3C, #C0392B)'
      case 'ghost':
        return 'transparent'
      default:
        return 'linear-gradient(135deg, #00D4AA, #009FCC)'
    }
  }

  const padding = size === 'sm' ? '6px 14px' : size === 'md' ? '10px 22px' : '14px 28px'
  const fontSize = size === 'sm' ? 13 : size === 'md' ? 15 : 17

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      onMouseDown={(e) => {
        if (!disabled) e.currentTarget.style.transform = 'scale(0.95)'
      }}
      onMouseUp={(e) => {
        if (!disabled) e.currentTarget.style.transform = 'scale(1)'
      }}
      onMouseLeave={(e) => {
        if (!disabled) e.currentTarget.style.transform = 'scale(1)'
      }}
      style={{
        padding,
        fontSize,
        fontWeight: 600,
        color: variant === 'ghost' ? '#00D4AA' : '#ffffff',
        background: getBgGradient(),
        border: variant === 'ghost' ? '1px solid #00D4AA50' : 'none',
        borderRadius: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.2s ease',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        lineHeight: 1.3,
        ...style,
      }}
    >
      {children}
    </button>
  )
}

export default Button
