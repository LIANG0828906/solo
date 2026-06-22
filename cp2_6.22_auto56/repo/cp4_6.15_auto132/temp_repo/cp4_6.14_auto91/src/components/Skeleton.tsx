interface Props {
  width?: string
  height?: string
  variant?: 'rect' | 'circle' | 'text'
  style?: React.CSSProperties
}

export default function Skeleton({ width = '100%', height = '20px', variant = 'rect', style }: Props) {
  const baseStyle: React.CSSProperties = {
    width,
    height,
    background: 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)',
    backgroundSize: '200% 100%',
    animation: 'pulse-skeleton 1.5s ease-in-out infinite'
  }

  if (variant === 'circle') {
    return <div style={{ ...baseStyle, borderRadius: '50%', ...style }} />
  }
  if (variant === 'text') {
    return <div style={{ ...baseStyle, borderRadius: '4px', ...style }} />
  }
  return <div style={{ ...baseStyle, borderRadius: '8px', ...style }} />
}
