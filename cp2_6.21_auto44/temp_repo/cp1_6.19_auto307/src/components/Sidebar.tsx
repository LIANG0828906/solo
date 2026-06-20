import { useMemo, useState, useEffect, FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStarStore, Constellation } from '../store/starStore'

function ZodiacIcon({ path, active }: { path: string; active: boolean }) {
  return (
    <svg
      viewBox="0 0 56 44"
      width="44"
      height="36"
      style={{ display: 'block' }}
    >
      <path
        d={path}
        fill="none"
        stroke={active ? '#FFD700' : '#C9A96E'}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={active ? 1 : 0.85}
        style={{
          filter: active ? 'drop-shadow(0 0 4px rgba(255,215,0,0.6))' : 'none',
        }}
      />
    </svg>
  )
}

export default function Sidebar() {
  const isOpen = useStarStore((s) => s.isSidebarOpen)
  const toggleSidebar = useStarStore((s) => s.toggleSidebar)
  const searchTerm = useStarStore((s) => s.searchTerm)
  const setSearchTerm = useStarStore((s) => s.setSearchTerm)
  const searchAndFly = useStarStore((s) => s.searchAndFly)
  const flyToConstellation = useStarStore((s) => s.flyToConstellation)
  const constellations = useStarStore((s) => s.constellations)
  const selectedConstellationId = useStarStore((s) => s.selectedConstellationId)

  const [searchError, setSearchError] = useState<string | null>(null)
  const [justFound, setJustFound] = useState(false)

  const displayConstellations = useMemo<Constellation[]>(() => {
    return constellations.slice(0, 12)
  }, [constellations])

  useEffect(() => {
    if (justFound) {
      const t = setTimeout(() => setJustFound(false), 1800)
      return () => clearTimeout(t)
    }
  }, [justFound])

  useEffect(() => {
    if (searchError) {
      const t = setTimeout(() => setSearchError(null), 2400)
      return () => clearTimeout(t)
    }
  }, [searchError])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!searchTerm.trim()) return
    const found = searchAndFly(searchTerm)
    if (found) {
      setJustFound(true)
      setSearchError(null)
    } else {
      setSearchError(`未找到恒星「${searchTerm.trim()}」`)
      setJustFound(false)
    }
  }

  const handleConstellationClick = (id: string) => {
    flyToConstellation(id)
  }

  return (
    <>
      <button
        onClick={toggleSidebar}
        className="frosted-glass"
        style={{
          position: 'fixed',
          left: isOpen ? 232 : 24,
          top: 28,
          zIndex: 60,
          width: 40,
          height: 40,
          borderRadius: 10,
          border: '1px solid #C9A96E',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFD700',
          fontSize: 18,
          fontWeight: 600,
          transition: 'left 0.3s cubic-bezier(0.25,0.46,0.45,0.94)',
          background: 'rgba(22, 33, 62, 0.7)',
          padding: 0,
        }}
        title={isOpen ? '收起侧边栏' : '展开侧边栏'}
      >
        {isOpen ? '‹' : '›'}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -260, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -260, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              position: 'fixed',
              left: 20,
              bottom: 20,
              width: 200,
              maxHeight: 'calc(100vh - 40px)',
              overflow: 'hidden',
              zIndex: 55,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              className="frosted-glass"
              style={{
                width: '100%',
                height: '100%',
                padding: '24px 16px 20px',
                background: 'rgba(22, 33, 62, 0.75)',
                borderColor: 'rgba(201,169,110,0.5)',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                borderRadius: 10,
                boxShadow: '0 10px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
            >
              <div>
                <div
                  className="ui-panel-title"
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: '#FFD700',
                    letterSpacing: '3px',
                    textAlign: 'center',
                    textShadow: '0 0 12px rgba(255,215,0,0.35)',
                  }}
                >
                  星 辰 索 引
                </div>
                <div
                  style={{
                    textAlign: 'center',
                    fontSize: 10,
                    letterSpacing: '2px',
                    color: '#C9A96E',
                    opacity: 0.7,
                    marginTop: 3,
                    textTransform: 'uppercase',
                  }}
                >
                  Constellation Index
                </div>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="输入恒星名，如 Betelgeuse"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      height: 36,
                      borderRadius: 6,
                      padding: '0 32px 0 12px',
                      fontSize: 12,
                      boxSizing: 'border-box',
                    }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#C9A96E',
                      fontSize: 14,
                      opacity: 0.6,
                    }}
                  >
                    ⌕
                  </span>
                </div>
                <AnimatePresence>
                  {searchError && (
                    <motion.div
                      initial={{ y: -6, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{
                        fontSize: 10.5,
                        color: '#FF8080',
                        textAlign: 'center',
                        padding: '3px 0',
                        background: 'rgba(255,80,80,0.1)',
                        borderRadius: 4,
                        border: '1px solid rgba(255,100,100,0.3)',
                      }}
                    >
                      {searchError}
                    </motion.div>
                  )}
                  {justFound && (
                    <motion.div
                      initial={{ y: -6, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{
                        fontSize: 10.5,
                        color: '#9AFF9A',
                        textAlign: 'center',
                        padding: '3px 0',
                        background: 'rgba(100,255,100,0.1)',
                        borderRadius: 4,
                        border: '1px solid rgba(100,255,100,0.3)',
                      }}
                    >
                      已定位恒星 ✓
                    </motion.div>
                  )}
                </AnimatePresence>
                <button
                  type="submit"
                  style={{
                    width: '100%',
                    height: 32,
                    borderRadius: 6,
                    border: '1px solid #C9A96E',
                    background: 'linear-gradient(180deg, rgba(212,175,55,0.25), rgba(201,169,110,0.12))',
                    color: '#FFD700',
                    fontSize: 12,
                    fontWeight: 500,
                    letterSpacing: '1px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      'linear-gradient(180deg, rgba(255,215,0,0.45), rgba(212,175,55,0.25))'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      'linear-gradient(180deg, rgba(212,175,55,0.25), rgba(201,169,110,0.12))'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  搜索定位
                </button>
              </form>

              <div
                style={{
                  borderTop: '1px dashed rgba(201,169,110,0.3)',
                  margin: '4px 0 2px',
                }}
              />

              <div
                style={{
                  fontSize: 11,
                  color: '#C9A96E',
                  letterSpacing: '1.5px',
                  textAlign: 'center',
                  opacity: 0.8,
                }}
              >
                黄 道 十 二 宫
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 8,
                  overflowY: 'auto',
                  padding: '4px 2px',
                  flex: 1,
                  minHeight: 0,
                }}
              >
                {displayConstellations.map((c) => {
                  const active = selectedConstellationId === c.id
                  return (
                    <button
                      key={c.id}
                      onClick={() => handleConstellationClick(c.id)}
                      className={`zodiac-btn ${active ? 'active' : ''}`}
                      style={{
                        background: active
                          ? 'rgba(255,215,0,0.12)'
                          : 'rgba(15,23,42,0.45)',
                        borderRadius: 8,
                        padding: '10px 4px 8px',
                        border: `1px solid ${
                          active ? '#FFD700' : 'rgba(201,169,110,0.25)'
                        }`,
                        cursor: 'pointer',
                        color: active ? '#FFD700' : '#C9A96E',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                      }}
                      title={`${c.name}（${c.latinName}）`}
                    >
                      <ZodiacIcon path={c.symbol} active={active} />
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: active ? 600 : 400,
                          letterSpacing: '1px',
                        }}
                      >
                        {c.name}
                      </span>
                    </button>
                  )
                })}
              </div>

              <div
                style={{
                  fontSize: 9.5,
                  color: '#6B7A99',
                  textAlign: 'center',
                  letterSpacing: '0.5px',
                  paddingTop: 6,
                  borderTop: '1px dashed rgba(201,169,110,0.2)',
                }}
              >
                左键拖拽旋转 · 右键平移 · 滚轮缩放
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
