import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ColorWheel from './ColorWheel'
import { useColorStore } from './store'
import { formatHex, formatRgb, formatHsl, generateAllSchemes, getContrastColor, hslToHex } from './utils/colorUtils'
import type { SchemeType } from './types'

export default function ColorPanel() {
  const hue = useColorStore((state) => state.hue)
  const saturation = useColorStore((state) => state.saturation)
  const lightness = useColorStore((state) => state.lightness)
  const alpha = useColorStore((state) => state.alpha)
  const setSaturation = useColorStore((state) => state.setSaturation)
  const setLightness = useColorStore((state) => state.setLightness)
  const setAlpha = useColorStore((state) => state.setAlpha)
  const addFavorite = useColorStore((state) => state.addFavorite)
  const setHue = useColorStore((state) => state.setHue)

  const [showSchemes, setShowSchemes] = useState(false)

  const currentHsl = useMemo(() => ({ h: hue, s: saturation / 100, l: lightness / 100 }), [hue, saturation, lightness])
  const hex = useMemo(() => formatHex(currentHsl), [currentHsl])
  const rgb = useMemo(() => formatRgb(currentHsl), [currentHsl])
  const hsl = useMemo(() => formatHsl(currentHsl), [currentHsl])
  const bgColor = useMemo(() => hslToHex(currentHsl), [currentHsl])
  const textColor = useMemo(() => getContrastColor(bgColor), [bgColor])

  const schemes = useMemo(() => showSchemes ? generateAllSchemes(currentHsl) : [], [currentHsl, showSchemes])

  const handleColorClick = (colorHex: string) => {
    const r = parseInt(colorHex.slice(1, 3), 16)
    const g = parseInt(colorHex.slice(3, 5), 16)
    const b = parseInt(colorHex.slice(5, 7), 16)
    const max = Math.max(r, g, b) / 255
    const min = Math.min(r, g, b) / 255
    let h = 0
    let s = 0
    const l = (max + min) / 2

    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r / 255: h = ((g / 255 - b / 255) / d + (g < b ? 6 : 0)) / 6; break
        case g / 255: h = ((b / 255 - r / 255) / d + 2) / 6; break
        case b / 255: h = ((r / 255 - g / 255) / d + 4) / 6; break
      }
    }

    setHue(Math.round(h * 360))
    setSaturation(Math.round(s * 100))
    setLightness(Math.round(l * 100))
  }

  const handleSaveScheme = (type: SchemeType, _name: string, colors: string[]) => {
    addFavorite({
      name: `方案${useColorStore.getState().favorites.length + 1}`,
      type,
      colors
    })
  }

  const Slider = ({
    label,
    value,
    min,
    max,
    step,
    onChange,
    gradient
  }: {
    label: string
    value: number
    min: number
    max: number
    step: number
    onChange: (v: number) => void
    gradient: string
  }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)' }}>
        <span>{label}</span>
        <span style={{ fontFamily: 'monospace' }}>{value.toFixed(step < 1 ? 2 : 0)}</span>
      </div>
      <div
        style={{
          height: 8,
          borderRadius: 4,
          background: gradient,
          position: 'relative',
          cursor: 'pointer'
        }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const pct = (e.clientX - rect.left) / rect.width
          onChange(Math.min(max, Math.max(min, pct * (max - min) + min)))
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: `${((value - min) / (max - min)) * 100}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            pointerEvents: 'none'
          }}
        />
      </div>
    </div>
  )

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-color)',
      overflowY: 'auto',
      overflowX: 'hidden'
    }}>
      <div style={{ padding: 20, borderBottom: '1px solid var(--border-color)' }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>调色板</h2>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>拖拽选择颜色</p>
      </div>

      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <ColorWheel />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Slider
            label="饱和度"
            value={saturation}
            min={0}
            max={100}
            step={1}
            onChange={setSaturation}
            gradient={`linear-gradient(to right, hsl(${hue}, 0%, ${lightness}%), hsl(${hue}, 100%, ${lightness}%))`}
          />
          <Slider
            label="亮度"
            value={lightness}
            min={0}
            max={100}
            step={1}
            onChange={setLightness}
            gradient={`linear-gradient(to right, hsl(${hue}, ${saturation}%, 0%), hsl(${hue}, ${saturation}%, 50%), hsl(${hue}, ${saturation}%, 100%))`}
          />
          <Slider
            label="透明度"
            value={alpha}
            min={0}
            max={1}
            step={0.01}
            onChange={setAlpha}
            gradient={`linear-gradient(to right, transparent, ${bgColor}), repeating-linear-gradient(45deg, #333 0, #333 4px, #222 4px, #222 8px)`}
          />
        </div>

        <div
          style={{
            padding: 16,
            borderRadius: 12,
            backgroundColor: bgColor,
            color: textColor,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            transition: 'background-color 0.2s ease',
            willChange: 'background-color'
          }}
        >
          <div style={{ fontSize: 11, opacity: 0.8 }}>当前颜色</div>
          <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 600 }}>{hex}</div>
          <div style={{ fontFamily: 'monospace', fontSize: 12, opacity: 0.9 }}>{rgb}</div>
          <div style={{ fontFamily: 'monospace', fontSize: 12, opacity: 0.9 }}>{hsl}</div>
        </div>

        <button
          onClick={() => setShowSchemes(!showSchemes)}
          style={{
            padding: '12px 20px',
            borderRadius: 8,
            border: 'none',
            backgroundColor: 'var(--accent-primary)',
            color: '#000',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            boxShadow: '0 2px 8px rgba(187, 134, 252, 0.3)'
          }}
          onMouseDown={(e) => {
            const btn = e.currentTarget
            btn.style.transform = 'scale(0.97)'
          }}
          onMouseUp={(e) => {
            const btn = e.currentTarget
            btn.style.transform = 'scale(1)'
          }}
          onMouseLeave={(e) => {
            const btn = e.currentTarget
            btn.style.transform = 'scale(1)'
          }}
        >
          {showSchemes ? '收起配色方案' : '生成配色方案'}
        </button>
      </div>

      <AnimatePresence>
        {showSchemes && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>配色方案</h3>
              {schemes.map((scheme, index) => (
                <motion.div
                  key={scheme.type}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: 12,
                    padding: 12,
                    cursor: 'pointer',
                    transition: 'box-shadow 0.2s ease',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                  }}
                  onClick={() => handleSaveScheme(scheme.type as SchemeType, scheme.name, scheme.colors)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{scheme.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--accent-success)' }}>点击收藏</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {scheme.colors.map((color, i) => (
                      <motion.div
                        key={i}
                        style={{
                          flex: 1,
                          height: 32,
                          borderRadius: 6,
                          backgroundColor: color,
                          cursor: 'pointer',
                          position: 'relative'
                        }}
                        whileHover={{ scale: 1.3, zIndex: 10 }}
                        transition={{ duration: 0.2 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleColorClick(color)
                        }}
                        title={color}
                      />
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
