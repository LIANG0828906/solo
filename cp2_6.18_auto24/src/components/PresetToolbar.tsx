import React, { memo } from 'react'
import { LayoutGrid, Columns3, ShoppingCart, Gauge, Image as ImageIcon } from 'lucide-react'
import { useLayoutStore } from '../store'
import { BREAKPOINT_PRESETS, type PresetId } from '../layoutEngine'

const PRESET_ICONS: Record<PresetId, React.ReactNode> = {
  blog2: <LayoutGrid size={12} />,
  blog3: <Columns3 size={12} />,
  ecommerce: <ShoppingCart size={12} />,
  dashboard: <Gauge size={12} />,
  gallery: <ImageIcon size={12} />,
}

export const PresetToolbar = memo(function PresetToolbar() {
  const activePreset = useLayoutStore((s) => s.activePreset)
  const loadPreset = useLayoutStore((s) => s.loadPreset)

  return (
    <div className="preset-toolbar">
      {(Object.keys(BREAKPOINT_PRESETS) as PresetId[]).map((id) => {
        const preset = BREAKPOINT_PRESETS[id]
        const isActive = activePreset === id
        return (
          <button
            key={id}
            type="button"
            className={`preset-btn ${isActive ? 'active' : ''}`}
            onClick={() => loadPreset(id)}
            title={preset.description}
          >
            {PRESET_ICONS[id]}
            <span>{preset.name}</span>
          </button>
        )
      })}
    </div>
  )
})
