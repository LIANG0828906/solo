import { useState, useEffect, useRef, useCallback } from 'react'
import { fetchRankRecipes } from '../api'
import type { Recipe } from '../types'

interface RankPageProps {
  navigate: (path: string) => void
}

export default function RankPage({ navigate }: RankPageProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [sortKey, setSortKey] = useState<'rating' | 'comments'>('rating')
  const [prevOrder, setPrevOrder] = useState<string[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; r: number; alpha: number }>>([])
  const animFrameRef = useRef<number>(0)

  const loadRank = useCallback(async () => {
    try {
      const data = await fetchRankRecipes(10)
      const newOrder = data.map(r => r.id)
      setPrevOrder(recipes.map(r => r.id).length > 0 ? recipes.map(r => r.id) : newOrder)
      setRecipes(data)
    } catch (e) {
      console.error(e)
    }
  }, [sortKey])

  useEffect(() => {
    loadRank()
  }, [sortKey])

  const sortedRecipes = [...recipes].sort((a, b) => {
    if (sortKey === 'comments') return b.commentCount - a.commentCount
    return b.rating - a.rating
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resize()
    window.addEventListener('resize', resize)

    if (particlesRef.current.length === 0) {
      for (let i = 0; i < 50; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.offsetWidth,
          y: Math.random() * canvas.offsetHeight,
          vx: (Math.random() - 0.5) * 0.3,
          vy: -Math.random() * 0.4 - 0.1,
          r: Math.random() * 2 + 1,
          alpha: Math.random() * 0.4 + 0.1,
        })
      }
    }

    const animate = () => {
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      ctx.clearRect(0, 0, w, h)

      particlesRef.current.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w }
        if (p.x < -10) p.x = w + 10
        if (p.x > w + 10) p.x = -10

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(212, 165, 116, ${p.alpha})`
        ctx.fill()

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * 2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(212, 165, 116, ${p.alpha * 0.3})`
        ctx.fill()
      })

      animFrameRef.current = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  const top3 = sortedRecipes.slice(0, 3)
  const rest = sortedRecipes.slice(3)

  const getRankPosition = (rank: number) => {
    if (rank === 0) return { order: 2, gridColumn: '2', gridRow: '1' }
    if (rank === 1) return { order: 1, gridColumn: '1', gridRow: '2' }
    return { order: 3, gridColumn: '3', gridRow: '2' }
  }

  const getPodiumStyle = (recipe: Recipe, rank: number): React.CSSProperties => {
    const pos = getRankPosition(rank)
    const isNew = !prevOrder.includes(recipe.id)
    return {
      ...styles.podiumCard,
      order: pos.order,
      gridColumn: pos.gridColumn,
      gridRow: pos.gridRow,
      animation: isNew ? 'fadeInUp 0.6s ease' : 'none',
      transition: 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    }
  }

  const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32']
  const medalLabels = ['🥇', '🥈', '🥉']

  return (
    <div style={styles.container}>
      <style>{rankCSS}</style>
      <canvas ref={canvasRef} style={styles.canvas} />
      <div style={styles.content}>
        <h1 style={styles.title}>家庭厨神排行榜</h1>
        <p style={styles.subtitle}>看看谁是家里的厨艺担当</p>

        <div style={styles.sortBar}>
          <button
            style={{ ...styles.sortBtn, ...(sortKey === 'rating' ? styles.sortBtnActive : {}) }}
            onClick={() => setSortKey('rating')}
          >
            按评分排序
          </button>
          <button
            style={{ ...styles.sortBtn, ...(sortKey === 'comments' ? styles.sortBtnActive : {}) }}
            onClick={() => setSortKey('comments')}
          >
            按热度排序
          </button>
        </div>

        {top3.length >= 3 && (
          <div style={styles.podium}>
            {top3.map((recipe, i) => (
              <div
                key={recipe.id}
                style={getPodiumStyle(recipe, i)}
                onClick={() => navigate(`/recipe/${recipe.id}`)}
                className="podium-card"
              >
                <div style={styles.medal}>{medalLabels[i]}</div>
                <img src={recipe.image} alt={recipe.title} style={styles.podiumImage} />
                <h3 style={styles.podiumTitle}>{recipe.title}</h3>
                <div style={styles.podiumAuthor}>
                  <img src={recipe.author.avatar} alt={recipe.author.name} style={styles.podiumAvatar} />
                  <span>{recipe.author.name}</span>
                </div>
                <div style={styles.podiumStats}>
                  <span style={styles.podiumRating}>★ {recipe.rating}</span>
                  <span style={styles.podiumComments}>💬 {recipe.commentCount}</span>
                </div>
                <div style={{
                  ...styles.podiumBase,
                  background: medalColors[i],
                  height: i === 0 ? 80 : 50,
                }} />
              </div>
            ))}
          </div>
        )}

        {rest.length > 0 && (
          <div style={styles.restSection}>
            <h2 style={styles.restTitle}>更多排名</h2>
            <div className="rank-rest-grid" style={styles.restGrid}>
              {rest.map((recipe, i) => (
                <div
                  key={recipe.id}
                  style={styles.restCard}
                  onClick={() => navigate(`/recipe/${recipe.id}`)}
                  className="rest-card"
                >
                  <span style={styles.restRank}>#{i + 4}</span>
                  <img src={recipe.image} alt={recipe.title} style={styles.restImage} />
                  <div style={styles.restInfo}>
                    <h4 style={styles.restName}>{recipe.title}</h4>
                    <span style={styles.restAuthor}>{recipe.author.name}</span>
                    <div style={styles.restStats}>
                      <span>★ {recipe.rating}</span>
                      <span>💬 {recipe.commentCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const rankCSS = `
  .podium-card {
    cursor: pointer;
  }
  .podium-card:hover {
    transform: translateY(-4px) !important;
  }
  .rest-card {
    cursor: pointer;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  .rest-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(74, 55, 40, 0.12);
  }
  .rank-rest-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  @media (max-width: 768px) {
    .rank-rest-grid {
      grid-template-columns: 1fr;
    }
  }
`

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    minHeight: 'calc(100vh - 64px)',
    overflow: 'hidden',
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 0,
  },
  content: {
    position: 'relative',
    zIndex: 1,
    maxWidth: 1000,
    margin: '0 auto',
    padding: '32px 24px 48px',
  },
  title: {
    fontSize: 36,
    fontWeight: 700,
    color: '#4A3728',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: "'Noto Serif SC', serif",
  },
  subtitle: {
    textAlign: 'center',
    color: '#8B7355',
    fontSize: 16,
    marginBottom: 24,
  },
  sortBar: {
    display: 'flex',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 36,
  },
  sortBtn: {
    padding: '8px 24px',
    borderRadius: 24,
    border: '1.5px solid #D4A574',
    background: 'transparent',
    color: '#8B7355',
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    fontFamily: "'Noto Sans SC', sans-serif",
  },
  sortBtnActive: {
    background: '#D4A574',
    color: '#FFFFFF',
    borderColor: '#D4A574',
  },
  podium: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gridTemplateRows: 'auto auto',
    gap: 16,
    alignItems: 'end',
    marginBottom: 40,
  },
  podiumCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: '#FFFFFF',
    borderRadius: 16,
    padding: '20px 16px 0',
    boxShadow: '0 4px 20px rgba(74, 55, 40, 0.08)',
    overflow: 'hidden',
    transition: 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  },
  medal: {
    fontSize: 36,
    marginBottom: 8,
  },
  podiumImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    objectFit: 'cover',
    marginBottom: 12,
  },
  podiumTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#4A3728',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: "'Noto Serif SC', serif",
  },
  podiumAuthor: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 14,
    color: '#8B7355',
    marginBottom: 8,
  },
  podiumAvatar: {
    width: 22,
    height: 22,
    borderRadius: '50%',
  },
  podiumStats: {
    display: 'flex',
    gap: 16,
    fontSize: 14,
    color: '#4A3728',
    marginBottom: 12,
  },
  podiumRating: {
    color: '#E74C3C',
  },
  podiumComments: {
    color: '#6B8E23',
  },
  podiumBase: {
    width: '100%',
    borderRadius: '0',
    opacity: 0.2,
    marginTop: 'auto',
  },
  restSection: {
    marginTop: 8,
  },
  restTitle: {
    fontSize: 22,
    fontWeight: 600,
    color: '#4A3728',
    marginBottom: 20,
    fontFamily: "'Noto Serif SC', serif",
  },
  restGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 16,
  },
  restCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    background: '#FFFFFF',
    borderRadius: 12,
    boxShadow: '0 2px 12px rgba(74, 55, 40, 0.06)',
  },
  restRank: {
    fontSize: 18,
    fontWeight: 700,
    color: '#D4A574',
    minWidth: 36,
  },
  restImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
    objectFit: 'cover',
    flexShrink: 0,
  },
  restInfo: {
    flex: 1,
  },
  restName: {
    fontSize: 15,
    fontWeight: 500,
    color: '#4A3728',
    marginBottom: 2,
  },
  restAuthor: {
    fontSize: 12,
    color: '#8B7355',
  },
  restStats: {
    display: 'flex',
    gap: 12,
    fontSize: 13,
    color: '#8B7355',
    marginTop: 4,
  },
}
