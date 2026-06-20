import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setTheme } from '@/store/poemStore'
import { getAllThemes, applyTheme } from '@/core/themeEngine'
import type { RootState } from '@/store/poemStore'
import type { ThemeType } from '@/types'

const ThemeSelector: React.FC = () => {
  const dispatch = useDispatch()
  const currentTheme = useSelector((state: RootState) => state.poem.theme)
  const themes = getAllThemes()

  const handleThemeChange = (themeName: ThemeType) => {
    dispatch(setTheme(themeName))
    applyTheme(themeName)
  }

  return (
    <div style={containerStyle}>
      <span style={labelStyle}>主题</span>
      <div style={themesContainerStyle}>
        {themes.map((theme) => (
          <button
            key={theme.name}
            onClick={() => handleThemeChange(theme.name)}
            style={{
              ...themeButtonStyle,
              background: theme.backgroundGradient,
              border: currentTheme === theme.name ? '2px solid var(--accent)' : '2px solid transparent',
              transform: currentTheme === theme.name ? 'scale(1.1)' : 'scale(1)',
            }}
            title={theme.displayName}
          >
            <span style={{
              ...themeLabelStyle,
              color: theme.cssVariables['--text-primary'],
            }}>
              {theme.displayName}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '12px 16px',
  borderBottom: '1px solid var(--border)',
}

const labelStyle: React.CSSProperties = {
  fontSize: 14,
  color: 'var(--text-secondary)',
  minWidth: 40,
}

const themesContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
}

const themeButtonStyle: React.CSSProperties = {
  width: 70,
  height: 44,
  borderRadius: 10,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
}

const themeLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
}

export default ThemeSelector
