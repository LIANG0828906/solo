import React from 'react'
import { usePaintStore } from '../../store/paintStore'
import { BASE_COLORS } from '../../types'
import styles from '../../styles/canvas.module.css'

function rgbToStr(r: number, g: number, b: number) {
  return `rgb(${r}, ${g}, ${b})`
}

export const ColorPalette: React.FC = () => {
  const s = usePaintStore()
  const c = s.currentColor

  return (
    <div className={styles.paletteWrap}>
      <div className={styles.swatches}>
        {BASE_COLORS.map((col, i) => (
          <button
            key={i}
            className={`${styles.swatch} ${s.baseColorIndex === i ? styles.active : ''}`}
            style={{ background: rgbToStr(col.r, col.g, col.b) }}
            onClick={() => s.setBaseColorIndex(i)}
            title={`颜色 #${col.r.toString(16).padStart(2, '0')}${col.g.toString(16).padStart(2, '0')}${col.b.toString(16).padStart(2, '0')}`}
          />
        ))}
      </div>
      <div className={styles.rgbBox}>
        <div
          className={styles.rgbPreview}
          style={{ background: rgbToStr(c.r, c.g, c.b) }}
        />
        <span>RGB</span>
        <span className={styles.rgbValues}>
          {c.r.toString().padStart(3, '0')} / {c.g.toString().padStart(3, '0')} / {c.b.toString().padStart(3, '0')}
        </span>
      </div>
    </div>
  )
}
