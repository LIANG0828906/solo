import { useCallback } from 'react'
import { HexColorPicker } from 'react-colorful'
import { useStore } from '@/store'
import { toHexColor, COLOR_PRESETS } from '@/types'
import type { HexColor } from '@/types'
import { X, Check } from 'lucide-react'

interface ColorThemePickerProps {
  onClose: () => void
}

export function ColorThemePicker({ onClose }: ColorThemePickerProps) {
  const { filters, updateFilters } = useStore()

  const handleColorChange = useCallback(
    (color: string) => {
      updateFilters({ color: toHexColor(color) })
    },
    [updateFilters]
  )

  const handleClear = useCallback(() => {
    updateFilters({ color: null })
  }, [updateFilters])

  const isMobile = window.innerWidth < 768

  const pickerContent = (
    <div className={`flex flex-col gap-4 ${isMobile ? 'p-6' : 'p-4'}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-dark">选择颜色筛选</h3>
        <div className="flex items-center gap-2">
          {filters.color && (
            <button
              onClick={handleClear}
              className="btn-hover flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-600 hover:bg-gray-200"
            >
              清除
              <X className="w-3 h-3" />
            </button>
          )}
          {isMobile && (
            <button
              onClick={onClose}
              className="btn-hover p-1.5 rounded-full bg-gray-100 hover:bg-gray-200"
            >
              <Check className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex justify-center">
        <HexColorPicker
          color={filters.color || '#D4A574'}
          onChange={handleColorChange}
          style={{ width: isMobile ? 300 : 220, height: isMobile ? 300 : 220 }}
        />
      </div>

      {filters.color && (
        <div className="flex items-center gap-3 px-2">
          <span
            className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
            style={{ backgroundColor: filters.color }}
          />
          <span className="text-sm font-mono text-gray-600">{filters.color.toUpperCase()}</span>
          <span className="text-xs text-gray-400">≈ 相似颜色余料将显示</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2 px-2">
        {COLOR_PRESETS.map((c: { value: HexColor; label: string }) => (
          <button
            key={c.value}
            onClick={() => handleColorChange(c.value)}
            className={`btn-hover w-8 h-8 rounded-full border-2 transition-all ${
              filters.color === c.value ? 'border-forest scale-110' : 'border-white/50'
            }`}
            style={{ backgroundColor: c.value }}
            title={c.label}
          />
        ))}
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        {pickerContent}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-card shadow-card border border-white/60 max-w-xs">
      {pickerContent}
    </div>
  )
}
