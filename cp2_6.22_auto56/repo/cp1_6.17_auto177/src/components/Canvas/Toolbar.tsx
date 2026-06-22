import React from 'react'
import { Brush, Droplets, Sparkles, EyeDropper, Layers } from 'lucide-react'
import { usePaintStore } from '../../store/paintStore'
import type { PaperType } from '../../types'
import { PAPER_CONFIGS } from '../../types'
import styles from '../../styles/toolbar.module.css'

const PAPER_ORDER: PaperType[] = ['fine', 'medium', 'rough', 'cold', 'hot']

function paperTexture(p: PaperType): string {
  const seed = p.charCodeAt(0) * 13
  const grains: string[] = []
  for (let i = 0; i < 40; i++) {
    const x = (seed + i * 37) % 100
    const y = (seed * 3 + i * 53) % 100
    const s = 0.4 + ((seed + i * 7) % 5) / 6
    const shade = 180 + ((seed + i * 11) % 50)
    grains.push(`<circle cx='${x}' cy='${y}' r='${s}' fill='rgba(${shade},${shade - 8},${shade - 20},0.35)'/>`)
  }
  return `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'>${grains.join('')}</svg>")`
}

export const Toolbar: React.FC = () => {
  const s = usePaintStore()

  return (
    <aside className={styles.toolbar} aria-label="工具栏">
      <div className={styles.iconColumn}>
        <button className={styles.iconBtn} title="画笔"><Brush size={18} /></button>
        <button className={styles.iconBtn} title="含水量"><Droplets size={18} /></button>
        <button className={styles.iconBtn} title="纹理"><Sparkles size={18} /></button>
        <button
          className={`${styles.iconBtn} ${s.isPipette ? styles.active : ''}`}
          onClick={s.togglePipette}
          title="吸管工具（P）"
        >
          <EyeDropper size={18} />
        </button>
        <button className={styles.iconBtn} title="纸张"><Layers size={18} /></button>
      </div>

      <div className={styles.panel}>
        <section>
          <h3 className={styles.sectionTitle}>画笔参数</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className={styles.sliderWrap}>
              <div className={styles.sliderHeader}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Brush size={14} /> 笔刷大小
                </span>
                <span className={styles.sliderValue}>{s.size}px</span>
              </div>
              <input
                className={styles.slider}
                type="range"
                min={8}
                max={80}
                value={s.size}
                onChange={(e) => s.setSize(Number(e.target.value))}
              />
            </div>

            <div className={styles.sliderWrap}>
              <div className={styles.sliderHeader}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Droplets size={14} /> 颜料含水量
                </span>
                <span className={styles.sliderValue}>{s.waterContent}%</span>
              </div>
              <input
                className={styles.slider}
                type="range"
                min={0}
                max={100}
                value={s.waterContent}
                onChange={(e) => s.setWaterContent(Number(e.target.value))}
              />
            </div>

            <div className={styles.sliderWrap}>
              <div className={styles.sliderHeader}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={14} /> 纹理强度
                </span>
                <span className={styles.sliderValue}>{s.textureStrength}%</span>
              </div>
              <input
                className={styles.slider}
                type="range"
                min={0}
                max={100}
                value={s.textureStrength}
                onChange={(e) => s.setTextureStrength(Number(e.target.value))}
              />
            </div>
          </div>
        </section>

        <section>
          <h3 className={styles.sectionTitle}>纸张纹理</h3>
          <div className={styles.paperGrid}>
            {PAPER_ORDER.map((p) => {
              const cfg = PAPER_CONFIGS[p]
              return (
                <button
                  key={p}
                  className={`${styles.paperTile} ${s.paperType === p ? styles.active : ''}`}
                  onClick={() => s.setPaperType(p)}
                  title={cfg.name}
                >
                  <div
                    className={styles.paperInner}
                    style={{
                      backgroundImage: paperTexture(p),
                      filter: cfg.filter,
                    }}
                  >
                    {cfg.name[0]}
                  </div>
                </button>
              )
            })}
          </div>
          <div className={styles.paperLabel}>
            当前：{PAPER_CONFIGS[s.paperType].name}
          </div>
        </section>

        <section style={{ marginTop: 'auto' }}>
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.05)',
              fontSize: 12,
              color: 'rgba(237,242,244,0.7)',
              lineHeight: 1.6,
            }}
          >
            <div style={{ marginBottom: 4, color: '#fff', fontWeight: 600 }}>💡 提示</div>
            慢速运笔颜料更饱和<br />
            Ctrl+Z 撤销上一步<br />
            点击吸管取画布颜色
          </div>
        </section>
      </div>
    </aside>
  )
}
