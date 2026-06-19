import { useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStarStore, Constellation, StarInfo } from '../store/starStore'

interface SelectedInfo {
  constellation: Constellation
  star: StarInfo
}

export default function UIPanel() {
  const visible = useStarStore((s) => s.isPanelVisible)
  const scrollSpeed = useStarStore((s) => s.scrollSpeed)
  const setScrollSpeed = useStarStore((s) => s.setScrollSpeed)
  const closePanel = useStarStore((s) => s.closePanel)
  const selectedGlobalIdx = useStarStore((s) => s.selectedStarGlobalIndex)
  const constellations = useStarStore((s) => s.constellations)
  const scrollInnerRef = useRef<HTMLDivElement>(null)

  const selected = useMemo<SelectedInfo | null>(() => {
    if (selectedGlobalIdx === null) return null
    let idx = 0
    for (const c of constellations) {
      for (let i = 0; i < c.stars.length; i++) {
        if (idx === selectedGlobalIdx) {
          return { constellation: c, star: c.stars[i] }
        }
        idx++
      }
    }
    return null
  }, [selectedGlobalIdx, constellations])

  useEffect(() => {
    const el = scrollInnerRef.current
    if (!el) return
    el.style.animationDuration = `${40 / scrollSpeed}s`
    void el.offsetWidth
    el.style.animation = 'none'
    requestAnimationFrame(() => {
      el.style.animation = `scroll-up linear infinite`
      el.style.animationDuration = `${40 / scrollSpeed}s`
    })
  }, [scrollSpeed, selected?.constellation.myth])

  const spectralLabels: Record<string, string> = {
    O: 'O型 · 蓝白色',
    B: 'B型 · 淡蓝色',
    A: 'A型 · 白色',
    F: 'F型 · 淡黄色',
    G: 'G型 · 黄色',
    K: 'K型 · 橙色',
    M: 'M型 · 红色',
  }

  return (
    <AnimatePresence mode="wait">
      {visible && selected && (
        <motion.div
          key="constellation-panel"
          initial={{ opacity: 0, x: -40, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          exit={{ opacity: 0, x: -20, y: -20, scale: 0.9 }}
          transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="frosted-glass"
          style={{
            position: 'fixed',
            left: '8%',
            top: '14%',
            width: '440px',
            maxWidth: '40vw',
            padding: '28px 28px 22px',
            boxShadow: '0 8px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,169,110,0.25), inset 0 1px 0 rgba(255,255,255,0.05)',
            zIndex: 40,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <div>
              <div
                className="ui-panel-title"
                style={{
                  fontSize: '30px',
                  fontWeight: 600,
                  color: '#FFD700',
                  textShadow: '0 0 20px rgba(255,215,0,0.4)',
                  lineHeight: 1.1,
                }}
              >
                {selected.constellation.name}
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: '#C9A96E',
                  marginTop: '4px',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  opacity: 0.8,
                }}
              >
                {selected.constellation.latinName}
              </div>
            </div>
            <button
              onClick={closePanel}
              className="close-btn"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                border: '1.5px solid #F5E6C8',
                background: 'transparent',
                color: '#F5E6C8',
                fontSize: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 300,
                padding: 0,
              }}
              aria-label="关闭面板"
            >
              ✕
            </button>
          </div>

          <div
            style={{
              borderTop: '1px solid rgba(201,169,110,0.35)',
              margin: '8px -28px 16px',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: -1,
                width: '60%',
                height: '1px',
                background: 'linear-gradient(90deg, #FFD700 0%, transparent 100%)',
              }}
            />
          </div>

          <div
            style={{
              background: 'rgba(0,0,0,0.25)',
              border: '1px solid rgba(201,169,110,0.2)',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '16px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px 16px',
              fontSize: '12px',
            }}
          >
            <div>
              <span style={{ color: '#C9A96E', opacity: 0.8 }}>恒星：</span>
              <span style={{ color: '#F5E6C8', fontWeight: 500 }}>
                {selected.star.commonName ?? selected.star.name}
                {selected.star.commonName && selected.star.commonName !== selected.star.name && (
                  <span style={{ color: '#C9A96E', opacity: 0.7 }}> （{selected.star.name}）</span>
                )}
              </span>
            </div>
            <div>
              <span style={{ color: '#C9A96E', opacity: 0.8 }}>距离：</span>
              <span style={{ color: '#F5E6C8' }}>{selected.star.distance}</span>
            </div>
            <div>
              <span style={{ color: '#C9A96E', opacity: 0.8 }}>光谱：</span>
              <span style={{ color: '#F5E6C8' }}>
                {spectralLabels[selected.star.spectralType] ?? selected.star.spectralType}
              </span>
            </div>
            <div>
              <span style={{ color: '#C9A96E', opacity: 0.8 }}>亮度：</span>
              <span style={{ color: '#F5E6C8' }}>{(selected.star.brightness * 100).toFixed(0)}%</span>
            </div>
          </div>

          <div
            className="scroll-container"
            style={{
              height: '200px',
              position: 'relative',
              marginBottom: '16px',
              padding: '4px 0',
            }}
          >
            <div
              ref={scrollInnerRef}
              className="mono-scroll scroll-inner"
              style={{
                color: '#E8DCC0',
                fontSize: '14px',
                textAlign: 'justify',
                padding: '10px 4px',
                animationDuration: `${40 / scrollSpeed}s`,
              }}
            >
              <p style={{ margin: 0, textIndent: '2em' }}>{selected.constellation.myth}</p>
              <div style={{ height: '180px' }} />
              <p style={{ margin: 0, textIndent: '2em' }}>{selected.constellation.myth}</p>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 2px 0',
              borderTop: '1px dashed rgba(201,169,110,0.3)',
              paddingTop: '14px',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                color: '#C9A96E',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                opacity: 0.85,
              }}
            >
              滚动速度
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '200px' }}>
              <span style={{ color: '#C9A96E', fontSize: '11px', opacity: 0.7 }}>1×</span>
              <input
                type="range"
                className="gold-slider"
                min={1}
                max={3}
                step={0.1}
                value={scrollSpeed}
                onChange={(e) => setScrollSpeed(parseFloat(e.target.value))}
              />
              <span style={{ color: '#FFD700', fontSize: '11px', fontWeight: 600, minWidth: '24px', textAlign: 'right' }}>
                {scrollSpeed.toFixed(1)}×
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
