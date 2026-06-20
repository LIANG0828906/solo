import { useEffect, useState } from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import FlowerLibrary from './modules/flowerLibrary'
import FlowerDesigner from './modules/flowerDesigner'
import { useFlowerStore, CATEGORIES } from './store/flowerStore'
import type { Flower } from './services/api'
import { flowerApi } from './services/api'

const CATEGORY_ICONS: Record<string, string> = {
  玫瑰类: '🌹',
  百合类: '💮',
  菊类: '🌼',
  配叶类: '🌿',
  填充花类: '✨',
}

const CATEGORY_COLORS: Record<string, string> = {
  玫瑰类: 'var(--cat-rose)',
  百合类: 'var(--cat-lily)',
  菊类: 'var(--cat-chrysanthemum)',
  配叶类: 'var(--cat-foliage)',
  填充花类: 'var(--cat-filler)',
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  玫瑰类: 'var(--rose-gradient)',
  百合类: 'var(--lily-gradient)',
  菊类: 'var(--chrysanthemum-gradient)',
  配叶类: 'var(--foliage-gradient)',
  填充花类: 'var(--filler-gradient)',
}

const CATEGORY_FADE_GRADIENTS: Record<string, string> = {
  玫瑰类: 'linear-gradient(90deg, var(--cat-rose), transparent)',
  百合类: 'linear-gradient(90deg, var(--cat-lily), transparent)',
  菊类: 'linear-gradient(90deg, var(--cat-chrysanthemum), transparent)',
  配叶类: 'linear-gradient(90deg, var(--cat-foliage), transparent)',
  填充花类: 'linear-gradient(90deg, var(--cat-filler), transparent)',
}

function createRipple(e: React.MouseEvent<HTMLButtonElement>) {
  const button = e.currentTarget
  const circle = document.createElement('span')
  const diameter = Math.max(button.clientWidth, button.clientHeight)
  const radius = diameter / 2
  const rect = button.getBoundingClientRect()
  circle.style.width = circle.style.height = `${diameter}px`
  circle.style.left = `${e.clientX - rect.left - radius}px`
  circle.style.top = `${e.clientY - rect.top - radius}px`
  circle.classList.add('ripple')
  const existingRipple = button.getElementsByClassName('ripple')[0]
  if (existingRipple) {
    existingRipple.remove()
  }
  button.appendChild(circle)
  setTimeout(() => circle.remove(), 600)
}

function App() {
  const {
    allFlowers,
    activeCategory,
    setActiveCategory,
    loadAllFlowers,
    scoreResult,
    vaseFlowers,
    clearVase,
    isMobileDrawerOpen,
    setMobileDrawerOpen,
  } = useFlowerStore()

  const [recommendations, setRecommendations] = useState<any[]>([])
  const [showRecommendations, setShowRecommendations] = useState(false)
  const [recLoading, setRecLoading] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [highlightedColor, setHighlightedColor] = useState<string | null>(null)

  useEffect(() => {
    loadAllFlowers()
  }, [loadAllFlowers])

  const handleAutoRecommend = async () => {
    setRecLoading(true)
    try {
      const ids = vaseFlowers.map((f) => f.flowerId)
      const result = await flowerApi.getRecommendations(ids, 3)
      setRecommendations(result)
      setShowRecommendations(true)
    } catch (err) {
      console.error(err)
      showToast('获取搭配建议失败，请检查后端服务')
    } finally {
      setRecLoading(false)
    }
  }

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 2500)
  }

  const handleSave = () => {
    if (vaseFlowers.length === 0) {
      showToast('花瓶还是空的哦～')
      return
    }
    const names = vaseFlowers.map((f) => f.flower.name).join('、')
    showToast(`已保存花束：${names} (${vaseFlowers.length}枝花材)`)
  }

  const handleSelectScheme = (scheme: any) => {
    useFlowerStore.getState().replaceVaseFlowers(scheme.flowers as Flower[])
    setShowRecommendations(false)
    showToast(`已应用搭配方案：${scheme.reason}`)
  }

  const colorStats = (() => {
    const map: Record<string, { count: number; hex: string; name: string }> = {}
    vaseFlowers.forEach((vf) => {
      const key = vf.flower.color
      if (!map[key]) {
        map[key] = { count: 0, hex: vf.flower.color_hex, name: key }
      }
      map[key].count += 1
    })
    const total = vaseFlowers.length
    return Object.values(map).map((item) => ({
      ...item,
      percentage: total > 0 ? item.count / total : 0,
    }))
  })()

  const renderStars = (count: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ fontSize: '18px', opacity: i < count ? 1 : 0.25 }}>
        {i < count ? '⭐' : '☆'}
      </span>
    ))
  }

  const drawPieChart = (canvas: HTMLCanvasElement | null, highlight: string | null) => {
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)
    if (colorStats.length === 0) {
      ctx.fillStyle = 'rgba(212, 165, 116, 0.15)'
      ctx.beginPath()
      ctx.arc(w / 2, h / 2, Math.min(w, h) / 2 - 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'var(--text-muted)'
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('暂无配色', w / 2, h / 2 + 4)
      return
    }
    const cx = w / 2
    const cy = h / 2
    const r = Math.min(w, h) / 2 - 6
    let startAngle = -Math.PI / 2
    colorStats.forEach((item) => {
      const endAngle = startAngle + item.percentage * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, r, startAngle, endAngle)
      ctx.closePath()
      ctx.fillStyle = item.hex
      const isHighlighted = highlight === item.name
      if (isHighlighted) {
        ctx.shadowColor = item.hex
        ctx.shadowBlur = 12
      }
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1.5
      ctx.stroke()
      if (item.percentage >= 0.08) {
        const midAngle = startAngle + (endAngle - startAngle) / 2
        const labelR = r * 0.6
        const lx = cx + Math.cos(midAngle) * labelR
        const ly = cy + Math.sin(midAngle) * labelR
        ctx.fillStyle = getContrastColor(item.hex)
        ctx.font = 'bold 10px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(`${Math.round(item.percentage * 100)}%`, lx, ly + 3)
      }
      startAngle = endAngle
    })
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.beginPath()
    ctx.arc(cx, cy, r * 0.42, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'var(--text-primary)'
    ctx.font = 'bold 13px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(vaseFlowers.length.toString(), cx, cy - 2)
    ctx.fillStyle = 'var(--text-muted)'
    ctx.font = '9px sans-serif'
    ctx.fillText('枝花', cx, cy + 10)
  }

  useEffect(() => {
    const canvas = document.getElementById('colorPieChart') as HTMLCanvasElement | null
    drawPieChart(canvas, highlightedColor)
  }, [colorStats, highlightedColor])

  function getContrastColor(hex: string): string {
    const h = hex.replace('#', '')
    const r = parseInt(h.substring(0, 2), 16)
    const g = parseInt(h.substring(2, 4), 16)
    const b = parseInt(h.substring(4, 6), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.5 ? '#4a3728' : '#ffffff'
  }

  return (
    <Router>
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-main)',
          position: 'relative',
        }}
      >
        <nav
          style={{
            height: '64px',
            flexShrink: 0,
            padding: '0 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-glass)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            borderBottom: '1px solid var(--border-soft)',
            boxShadow: 'var(--shadow-soft)',
            zIndex: 50,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '28px' }}>🌸</span>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                花语设计室
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
                在线插花设计 · 智能搭配推荐
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {scoreResult && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  padding: '4px 14px',
                  background: 'var(--bg-glass-strong)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-soft)',
                }}
              >
                <div style={{ display: 'flex', gap: '2px' }}>
                  {renderStars(scoreResult.stars)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  和谐度 {scoreResult.percentage}%
                </div>
              </div>
            )}
            {!scoreResult && vaseFlowers.length === 0 && (
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  padding: '8px 16px',
                  background: 'var(--bg-glass-strong)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-soft)',
                }}
              >
                拖入花材开始创作吧
              </div>
            )}
            <button
              onClick={(e) => {
                createRipple(e)
                handleSave()
              }}
              style={{
                padding: '10px 24px',
                background: 'var(--accent-gradient)',
                color: '#fff',
                borderRadius: '14px',
                fontWeight: 600,
                fontSize: '14px',
                boxShadow: 'var(--shadow-soft)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              💾 保存花束
            </button>
            <button
              onClick={(e) => {
                createRipple(e)
                if (vaseFlowers.length > 0) {
                  if (confirm('确定要清空花瓶吗？')) clearVase()
                }
              }}
              style={{
                padding: '10px 16px',
                background: 'var(--bg-glass-strong)',
                color: 'var(--text-secondary)',
                borderRadius: '14px',
                fontWeight: 500,
                fontSize: '13px',
                border: '1px solid var(--border-soft)',
                transition: 'all 0.2s ease',
              }}
            >
              🗑️ 清空
            </button>
            <button
              onClick={(e) => {
                createRipple(e)
                setMobileDrawerOpen(true)
              }}
              style={{
                display: 'none',
                padding: '10px 14px',
                background: 'var(--bg-glass-strong)',
                borderRadius: '14px',
                border: '1px solid var(--border-soft)',
                fontSize: '18px',
              }}
              className="mobile-drawer-toggle"
            >
              🎨
            </button>
          </div>
        </nav>

        <div
          style={{
            flex: 1,
            display: 'flex',
            minHeight: 0,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <aside
            style={{
              width: '320px',
              flexShrink: 0,
              backgroundColor: 'var(--bg-panel)',
              borderRight: '1px solid var(--border-soft)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            className="library-panel"
          >
            <div
              style={{
                padding: '14px 18px 0 18px',
                flexShrink: 0,
                borderBottom: '1px solid var(--border-soft)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  🎨 花材库
                </span>
                <span
                  style={{
                    marginLeft: '8px',
                    padding: '2px 8px',
                    background: 'var(--accent-gradient)',
                    color: '#fff',
                    borderRadius: '10px',
                    fontSize: '10px',
                    fontWeight: 600,
                  }}
                >
                  {allFlowers.length} 种
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '2px',
                  marginBottom: '10px',
                  overflowX: 'auto',
                }}
              >
                {CATEGORIES.map((cat) => {
                  const isActive = activeCategory === cat
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      style={{
                        flex: '1',
                        minWidth: '56px',
                        padding: '10px 4px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        background: isActive ? 'var(--bg-glass-strong)' : 'transparent',
                        borderRadius: '10px 10px 0 0',
                        position: 'relative',
                        transition: 'all 0.2s ease',
                        ['--category-color' as any]: CATEGORY_COLORS[cat],
                      }}
                    >
                      <span style={{ fontSize: '18px' }}>{CATEGORY_ICONS[cat]}</span>
                      <span
                        style={{
                          fontSize: '10.5px',
                          color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                          fontWeight: isActive ? 600 : 400,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {cat.replace('类', '')}
                      </span>
                      {isActive && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            left: '8px',
                            right: '8px',
                            height: '8px',
                            borderRadius: '4px 4px 0 0',
                            background:
                              'linear-gradient(90deg, var(--category-color), transparent)',
                            animation: 'fadeIn 0.3s ease',
                          }}
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
            <FlowerLibrary />
          </aside>

          <main
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
              overflow: 'hidden',
            }}
          >
            <FlowerDesigner />
          </main>
        </div>

        <footer
          style={{
            height: '88px',
            flexShrink: 0,
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            background: 'var(--bg-glass)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            borderTop: '1px solid var(--border-soft)',
            zIndex: 40,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
            <canvas
              id="colorPieChart"
              width={90}
              height={90}
              style={{
                width: '70px',
                height: '70px',
                flexShrink: 0,
              }}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minWidth: 0 }}>
              {colorStats.length === 0 ? (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  添加花材查看配色分布
                </span>
              ) : (
                colorStats.map((item) => (
                  <button
                    key={item.name}
                    onClick={() =>
                      setHighlightedColor(highlightedColor === item.name ? null : item.name)
                    }
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '5px 12px',
                      borderRadius: '20px',
                      background:
                        highlightedColor === item.name
                          ? 'var(--bg-glass-strong)'
                          : 'rgba(255,255,255,0.4)',
                      border:
                        highlightedColor === item.name
                          ? '1.5px solid ' + item.hex
                          : '1px solid var(--border-soft)',
                      transition: 'all 0.2s ease',
                      transform:
                        highlightedColor === item.name ? 'translateY(-1px)' : 'translateY(0)',
                    }}
                  >
                    <span
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: item.hex,
                        border: highlightedColor === item.name ? '1.5px solid #fff' : 'none',
                        boxShadow:
                          highlightedColor === item.name ? `0 0 8px ${item.hex}` : 'none',
                      }}
                    />
                    <span style={{ fontSize: '11.5px', color: 'var(--text-primary)' }}>
                      {item.name}
                    </span>
                    <span
                      style={{
                        fontSize: '10.5px',
                        color: 'var(--text-muted)',
                        marginLeft: '-2px',
                      }}
                    >
                      ×{item.count}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          <button
            onClick={(e) => {
              createRipple(e)
              handleAutoRecommend()
            }}
            disabled={recLoading}
            style={{
              padding: '14px 32px',
              background: recLoading ? 'var(--border-soft)' : 'var(--accent-gradient)',
              color: '#fff',
              borderRadius: '16px',
              fontWeight: 700,
              fontSize: '14px',
              boxShadow: recLoading ? 'none' : 'var(--shadow-medium)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              if (!recLoading) e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            {recLoading ? (
              <>
                <span
                  style={{
                    display: 'inline-block',
                    animation: 'spin 0.8s linear infinite',
                  }}
                >
                  🔄
                </span>
                生成中...
              </>
            ) : (
              <>
                ✨ 自动搭配推荐
              </>
            )}
          </button>
        </footer>

        {showRecommendations && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(74, 55, 40, 0.35)',
              backdropFilter: 'blur(4px)',
              zIndex: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              animation: 'fadeIn 0.25s ease',
            }}
            onClick={() => setShowRecommendations(false)}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '880px',
                maxHeight: '85vh',
                overflowY: 'auto',
                background: 'var(--bg-main)',
                borderRadius: '24px',
                padding: '28px',
                boxShadow: 'var(--shadow-deep)',
                animation: 'fadeInScale 0.3s ease',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '22px',
                }}
              >
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    💡 智能搭配方案
                  </h2>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    以下 3 套方案基于当前花材组合，综合配色、季节、形态特征智能生成
                  </p>
                </div>
                <button
                  onClick={() => setShowRecommendations(false)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'var(--bg-glass-strong)',
                    border: '1px solid var(--border-soft)',
                    fontSize: '18px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  ✕
                </button>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '18px',
                }}
              >
                {recommendations.map((scheme, idx) => (
                  <button
                    key={scheme.scheme_id}
                    onClick={() => handleSelectScheme(scheme)}
                    style={{
                      padding: '20px',
                      borderRadius: '18px',
                      background: 'var(--bg-glass-strong)',
                      border: '1px solid var(--border-soft)',
                      textAlign: 'left',
                      transition: 'all 0.25s ease',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)'
                      e.currentTarget.style.boxShadow = 'var(--shadow-medium)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '12px',
                          background: 'var(--accent-gradient)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '16px',
                        }}
                      >
                        {idx + 1}
                      </div>
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            gap: '2px',
                          }}
                        >
                          {renderStars(
                            max(1, min(5, Math.round(scheme.score * 5)))
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          和谐度 {(scheme.score * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        minHeight: '110px',
                        background: 'var(--bg-panel)',
                        borderRadius: '14px',
                        padding: '16px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        border: '1px dashed var(--border-medium)',
                      }}
                    >
                      {scheme.flowers.map((f: Flower, i: number) => (
                        <div
                          key={i}
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            background: f.color_hex + '30',
                            border: `2px solid ${f.color_hex}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '22px',
                            animation: `bounce-in 0.4s ease ${i * 0.04}s both`,
                          }}
                          title={f.name}
                        >
                          {f.image}
                        </div>
                      ))}
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: '12.5px',
                          color: 'var(--text-primary)',
                          fontWeight: 600,
                          marginBottom: '5px',
                          lineHeight: 1.4,
                        }}
                      >
                        {scheme.reason}
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '4px',
                        }}
                      >
                        {scheme.flowers.map((f: Flower, i: number) => (
                          <span
                            key={i}
                            style={{
                              padding: '2px 8px',
                              background: f.color_hex + '25',
                              color: f.color_hex,
                              borderRadius: '8px',
                              fontWeight: 500,
                            }}
                          >
                            {f.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {toastMsg && (
          <div
            style={{
              position: 'fixed',
              bottom: '120px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '12px 24px',
              background: 'rgba(74, 55, 40, 0.9)',
              color: '#fff',
              borderRadius: '14px',
              fontSize: '13px',
              fontWeight: 500,
              boxShadow: 'var(--shadow-deep)',
              zIndex: 300,
              animation: 'slideUp 0.3s ease',
              maxWidth: '80vw',
            }}
          >
            {toastMsg}
          </div>
        )}

        {isMobileDrawerOpen && (
          <div
            className="mobile-drawer-overlay"
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(74, 55, 40, 0.4)',
              zIndex: 150,
              display: 'none',
              animation: 'fadeIn 0.2s ease',
            }}
            onClick={() => setMobileDrawerOpen(false)}
          >
            <div
              className="mobile-drawer-content"
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                maxHeight: '75vh',
                background: 'var(--bg-panel)',
                borderRadius: '24px 24px 0 0',
                animation: 'slideUp 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid var(--border-soft)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontWeight: 700 }}>🎨 花材库</span>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'var(--bg-glass-strong)',
                  }}
                >
                  ✕
                </button>
              </div>
              <div style={{ padding: '0 20px', borderBottom: '1px solid var(--border-soft)' }}>
                <div
                  style={{
                    display: 'flex',
                    gap: '4px',
                    margin: '12px 0',
                    overflowX: 'auto',
                  }}
                >
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      style={{
                        flex: '1',
                        minWidth: '60px',
                        padding: '8px 4px',
                        borderRadius: '10px',
                        background:
                          activeCategory === cat ? 'var(--bg-glass-strong)' : 'transparent',
                        border:
                          activeCategory === cat
                            ? `2px solid ${
                                CATEGORY_GRADIENTS[cat]
                              }`
                            : '1px solid transparent',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                      }}
                    >
                      <span style={{ fontSize: '16px' }}>{CATEGORY_ICONS[cat]}</span>
                      <span
                        style={{
                          fontSize: '10px',
                          color:
                            activeCategory === cat ? 'var(--text-primary)' : 'var(--text-secondary)',
                          fontWeight: activeCategory === cat ? 600 : 400,
                        }}
                      >
                        {cat.replace('类', '')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <FlowerLibrary />
              </div>
            </div>
          </div>
        )}

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @media (max-width: 768px) {
            .library-panel {
              display: none !important;
            }
            .mobile-drawer-toggle {
              display: block !important;
            }
            .mobile-drawer-overlay {
              display: block !important;
            }
            nav {
              padding: 0 16px !important;
              height: 56px !important;
            }
            footer {
              height: auto !important;
              min-height: 88px;
              padding: 10px 16px !important;
              flex-wrap: wrap;
              gap: 10px !important;
            }
          }
        `}</style>
      </div>
    </Router>
  )
}

function max(a: number, b: number) {
  return Math.max(a, b)
}
function min(a: number, b: number) {
  return Math.min(a, b)
}

export default App
