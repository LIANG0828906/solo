import React, { useState, useRef, useEffect } from 'react'
import type { DesignTokens } from '../../context/DesignTokensContext'

interface PreviewNavbarProps {
  tokens: DesignTokens
}

const navItems = ['首页', '关于', '联系']

const PreviewNavbar: React.FC<PreviewNavbarProps> = ({ tokens }) => {
  const { colors, spacing, fonts } = tokens
  const [activeIndex, setActiveIndex] = useState(0)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const [underlineStyle, setUnderlineStyle] = useState<React.CSSProperties>({})

  useEffect(() => {
    const activeEl = itemRefs.current[activeIndex]
    if (activeEl) {
      const parent = activeEl.parentElement
      if (parent) {
        const parentRect = parent.getBoundingClientRect()
        const elRect = activeEl.getBoundingClientRect()
        setUnderlineStyle({
          left: `${elRect.left - parentRect.left}px`,
          width: `${elRect.width}px`,
          backgroundColor: colors.accent,
        })
      }
    }
  }, [activeIndex, colors.accent])

  const navbarStyle: React.CSSProperties = {
    height: `${spacing.l}px`,
    backgroundColor: colors.primary,
    color: colors.text,
  }

  const itemStyle: React.CSSProperties = {
    color: colors.text,
    fontFamily: fonts.body,
    lineHeight: `${spacing.l}px`,
  }

  return (
    <div className="preview-navbar" style={navbarStyle}>
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

export default PreviewNavbar
