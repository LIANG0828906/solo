import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import type { DesignTokens } from '../../context/DesignTokensContext'

interface PreviewNavbarProps {
  tokens: DesignTokens
}

const navItems = ['首页', '关于', '联系']

const PreviewNavbar: React.FC<PreviewNavbarProps> = ({ tokens }) => {
  const { colors, spacing, fonts } = tokens
  const [activeIndex, setActiveIndex] = useState(0)
  const navRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const [underlineStyle, setUnderlineStyle] = useState<React.CSSProperties>({})

  const updateUnderline = useCallback(() => {
    const activeEl = itemRefs.current[activeIndex]
    if (activeEl && navRef.current) {
      const parentRect = navRef.current.getBoundingClientRect()
      const elRect = activeEl.getBoundingClientRect()
      setUnderlineStyle({
        left: `${elRect.left - parentRect.left}px`,
        width: `${elRect.width}px`,
        backgroundColor: colors.accent,
        transition: 'all 0.3s ease',
      })
    }
  }, [activeIndex, colors.accent])

  useEffect(() => {
    updateUnderline()
    const handleResize = () => updateUnderline()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [updateUnderline])

  const navbarStyle = useMemo<React.CSSProperties>(
    () => ({
      height: `${spacing.l}px`,
      backgroundColor: colors.primary,
      color: colors.text,
      transition: 'all 0.2s ease',
    }),
    [colors, spacing]
  )

  const itemStyle = useMemo<React.CSSProperties>(
    () => ({
      color: colors.text,
      fontFamily: fonts.body,
      lineHeight: `${spacing.l}px`,
      transition: 'all 0.2s ease',
    }),
    [colors, fonts, spacing]
  )

  return (
    <div className="preview-navbar" style={navbarStyle} ref={navRef}>
      {navItems.map((item, idx) => (
        <div
          key={item}
          ref={(el) => (itemRefs.current[idx] = el)}
          className="navbar-item"
          style={itemStyle}
          onClick={() => setActiveIndex(idx)}
        >
          {item}
        </div>
      ))}
      <div className="navbar-underline" style={underlineStyle} />
    </div>
  )
}

export default React.memo(PreviewNavbar)
