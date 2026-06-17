import React, { useEffect, useState, useRef } from 'react'
import { useColorStore, SemanticColor } from '../store'

const getColor = (colors: SemanticColor[], id: string): SemanticColor => {
  return colors.find(c => c.id === id) || colors[0]
}

const adjustBrightness = (hex: string, percent: number): string => {
  const num = parseInt(hex.slice(1), 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + Math.round(2.55 * percent)))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + Math.round(2.55 * percent)))
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + Math.round(2.55 * percent)))
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()
}

const UIPreview: React.FC = () => {
  const colors = useColorStore(state => state.colors)
  const [animatedColors, setAnimatedColors] = useState<SemanticColor[]>(colors)
  const animationRef = useRef<number | null>(null)
  const startRef = useRef<SemanticColor[]>(animatedColors)

  useEffect(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    startRef.current = JSON.parse(JSON.stringify(animatedColors))
    const targetColors = JSON.parse(JSON.stringify(colors))
    const duration = 300
    const startTime = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)

      const interpolated = startRef.current.map((start: SemanticColor, i: number) => {
        const target = targetColors[i] || start
        const nr = Math.round(start.r + (target.r - start.r) * easeOut)
        const ng = Math.round(start.g + (target.g - start.g) * easeOut)
        const nb = Math.round(start.b + (target.b - start.b) * easeOut)
        const nhex = '#' + [nr, ng, nb].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase()
        return {
          ...start,
          r: nr,
          g: ng,
          b: nb,
          hex: nhex,
        }
      })

      setAnimatedColors(interpolated)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colors])

  const primary = getColor(animatedColors, 'primary')
  const secondary = getColor(animatedColors, 'secondary')
  const accent = getColor(animatedColors, 'accent')
  const background = getColor(animatedColors, 'background')
  const text = getColor(animatedColors, 'text')

  const primaryHex = '#' + [primary.r, primary.g, primary.b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase()
  const secondaryHex = '#' + [secondary.r, secondary.g, secondary.b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase()
  const accentHex = '#' + [accent.r, accent.g, accent.b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase()
  const backgroundHex = '#' + [background.r, background.g, background.b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase()
  const textHex = '#' + [text.r, text.g, text.b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase()

  const textSecondaryHex = textHex + 'AA'

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: '#fff',
      padding: '32px',
      overflow: 'auto',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <h2 style={{
        fontSize: '16px',
        fontWeight: 600,
        color: '#1E293B',
        marginBottom: '24px',
        letterSpacing: '0.5px',
        flexShrink: 0,
      }}>
        组件预览
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', flex: 1 }}>
        <div style={{
          width: '240px',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          overflow: 'hidden',
          background: backgroundHex,
          transition: 'background 300ms ease-out',
        }}>
          <div style={{
            height: '100px',
            background: `linear-gradient(135deg, ${primaryHex}, ${secondaryHex})`,
            transition: 'background 300ms ease-out',
          }} />
          <div style={{ padding: '16px' }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 700,
              color: textHex,
              marginBottom: '8px',
              transition: 'color 300ms ease-out',
            }}>
              示例卡片
            </h3>
            <p style={{
              fontSize: '14px',
              color: textSecondaryHex,
              lineHeight: 1.6,
              transition: 'color 300ms ease-out',
            }}>
              这是一个使用当前语义色系统渲染的卡片组件，您可以实时查看配色效果。
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              background: primaryHex,
              color: '#fff',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 200ms ease, transform 200ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = adjustBrightness(primaryHex, 10)
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = primaryHex
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            主要按钮
          </button>

          <button
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: `2px solid ${primaryHex}`,
              background: 'transparent',
              color: primaryHex,
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 200ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${primaryHex}10`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            次要按钮
          </button>

          <button
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              background: accentHex,
              color: '#fff',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 200ms ease, transform 200ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = adjustBrightness(accentHex, 10)
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = accentHex
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            强调按钮
          </button>
        </div>

        <div style={{
          width: '100%',
          height: '180px',
          borderRadius: '12px',
          background: `linear-gradient(45deg, ${primaryHex}, ${secondaryHex})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          transition: 'background 300ms ease-out',
        }}>
          <div style={{
            color: '#fff',
            fontSize: '18px',
            fontWeight: 600,
            textShadow: '0 2px 8px rgba(0,0,0,0.2)',
            letterSpacing: '1px',
          }}>
            渐变背景区域
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {animatedColors.map(c => {
            const hex = '#' + [c.r, c.g, c.b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase()
            const isLight = (c.r + c.g + c.b) > 400
            return (
              <div key={c.id} style={{
                padding: '8px 16px',
                borderRadius: '6px',
                background: hex,
                border: '1px solid rgba(0,0,0,0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background 300ms ease-out',
              }}>
                <span style={{
                  fontSize: '12px',
                  color: isLight ? '#1E293B' : '#fff',
                  fontWeight: 500,
                }}>
                  {c.name}
                </span>
                <span style={{
                  fontSize: '11px',
                  color: isLight ? '#64748B' : 'rgba(255,255,255,0.7)',
                  fontFamily: 'Monaco, monospace',
                }}>
                  {hex}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default UIPreview
