import { useStore, type Theme } from './store'

const themes: { id: Theme; label: string }[] = [
  { id: 'dawn', label: '晨曦' },
  { id: 'deepSea', label: '深海' },
  { id: 'aurora', label: '极光' }
]

export default function ThemeSelector() {
  const currentTheme = useStore((state) => state.theme)
  const setTheme = useStore((state) => state.setTheme)

  return (
    <div className="theme-selector glass">
      {themes.map((theme) => (
        <div
          key={theme.id}
          className={`theme-dot ${theme.id} ${currentTheme === theme.id ? 'active' : ''}`}
          onClick={() => setTheme(theme.id)}
          title={theme.label}
        />
      ))}
    </div>
  )
}
