import { useMemo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ColorPanel from './ColorPanel'
import Gallery from './Gallery'
import DetailPanel from './components/DetailPanel'
import { useColorStore } from './store'
import { hslToHex, getContrastColor } from './utils/colorUtils'
import { colorblindMatrices } from './utils/colorblind'

export default function App() {
  const hue = useColorStore((state) => state.hue)
  const saturation = useColorStore((state) => state.saturation)
  const lightness = useColorStore((state) => state.lightness)
  const alpha = useColorStore((state) => state.alpha)
  const colorblindMode = useColorStore((state) => state.colorblindMode)
  const selectedScheme = useColorStore((state) => state.selectedScheme)
  const sidebarOpen = useColorStore((state) => state.sidebarOpen)
  const setSidebarOpen = useColorStore((state) => state.setSidebarOpen)

  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const bgColor = useMemo(() => {
    return hslToHex({ h: hue, s: saturation / 100, l: lightness / 100 })
  }, [hue, saturation, lightness])

  const textColor = useMemo(() => getContrastColor(bgColor), [bgColor])

  const filterId = `colorblind-filter-${colorblindMode}`
  const hasFilter = colorblindMode !== 'normal'

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'var(--bg-primary)',
        filter: hasFilter ? `url(#${filterId})` : 'none',
        transition: 'filter 0.3s ease'
      }}
    >
      <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }} aria-hidden="true">
        <defs>
          {Object.entries(colorblindMatrices).map(([mode, matrix]) => (
            <filter key={mode} id={`colorblind-filter-${mode}`}>
              <feColorMatrix type="matrix" values={matrix} />
            </filter>
          ))}
        </defs>
      </svg>

      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative' }}>
        <AnimatePresence>
          {isMobile && sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                zIndex: 50
              }}
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        <motion.aside
          style={{
            width: isMobile ? 280 : 300,
            flexShrink: 0,
            position: isMobile ? 'fixed' : 'relative',
            left: isMobile ? 0 : undefined,
            top: isMobile ? 0 : undefined,
            bottom: isMobile ? 0 : undefined,
            zIndex: 60,
            x: isMobile && !sidebarOpen ? -280 : 0
          }}
          animate={{ x: isMobile && !sidebarOpen ? -280 : 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        >
          <ColorPanel />
        </motion.aside>

        {isMobile && (
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              position: 'fixed',
              top: 16,
              left: 16,
              zIndex: 40,
              width: 40,
              height: 40,
              borderRadius: 10,
              border: 'none',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: 18,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ☰
          </button>
        )}

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {!isMobile && (
            <div
              style={{
                padding: '20px 24px',
                backgroundColor: 'var(--bg-secondary)',
                borderBottom: '1px solid var(--border-color)'
              }}
            >
              <div
                style={{
                  padding: 16,
                  borderRadius: 12,
                  backgroundColor: bgColor,
                  color: textColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'background-color 0.2s ease',
                  willChange: 'background-color'
                }}
              >
                <div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>预览背景色</div>
                  <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'monospace', marginTop: 4 }}>
                    {bgColor}
                  </div>
                </div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  透明度: {Math.round(alpha * 100)}%
                </div>
              </div>
            </div>
          )}

          <Gallery />
        </main>

        {!isMobile && (
          <div style={{ width: selectedScheme ? 320 : 0, flexShrink: 0, transition: 'width 0.3s ease' }} />
        )}

        {!isMobile && <DetailPanel />}
      </div>

      <AnimatePresence>
        {isMobile && selectedScheme && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed',
              left: 0,
              right: 0,
              bottom: 0,
              height: '85%',
              zIndex: 200,
              backgroundColor: 'rgba(18, 18, 18, 0.95)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderTop: '1px solid var(--border-color)',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <div style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: 'var(--border-color)',
              margin: '12px auto',
              flexShrink: 0
            }} />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <DetailPanel />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
