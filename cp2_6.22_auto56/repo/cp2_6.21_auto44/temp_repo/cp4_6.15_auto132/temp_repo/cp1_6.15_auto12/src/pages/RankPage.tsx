import { useState, useEffect, useRef, useCallback } from 'react'
import { fetchRankRecipes } from '../api'
import type { Recipe } from '../types'

interface RankPageProps {
  navigate: (path: string) => void
}

export default function RankPage({ navigate }: RankPageProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [sortKey, setSortKey] = useState<'rating' | 'comments'>('rating')
  const [animKey, setAnimKey] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; r: number; alpha: number }>>([])
  const animFrameRef = useRef<number>(0)

  const loadRank = useCallback(async () => {
    try {
      const data = await fetchRankRecipes(10)
      setRecipes(data)
      setAnimKey(k => k + 1)
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    loadRank()
  }, [sortKey, loadRank])

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

  const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32']
  const medalLabels = ['🥇', '🥈', '🥉']

  return (
    <div className="rank-page">
      <style>{rankCSS}</style>
      <canvas ref={canvasRef} className="rank-canvas" />
      <div className="rank-content">
        <h1 className="rank-title">家庭厨神排行榜</h1>
        <p className="rank-subtitle">看看谁是家里的厨艺担当</p>

        <div className="rank-sort-bar">
          <button
            className={`rank-sort-btn ${sortKey === 'rating' ? 'rank-sort-btn-active' : ''}`}
            onClick={() => setSortKey('rating')}
          >
            按评分排序
          </button>
          <button
            className={`rank-sort-btn ${sortKey === 'comments' ? 'rank-sort-btn-active' : ''}`}
            onClick={() => setSortKey('comments')}
          >
            按热度排序
          </button>
        </div>

        {top3.length >= 3 && (
          <div className="rank-podium" key={animKey}>
            {top3.map((recipe, i) => (
              <div
                key={recipe.id}
                className={`rank-podium-card rank-podium-${i + 1}`}
                onClick={() => navigate(`/recipe/${recipe.id}`)}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="rank-medal">{medalLabels[i]}</div>
                <img src={recipe.image} alt={recipe.title} className="rank-podium-image" />
                <h3 className="rank-podium-title">{recipe.title}</h3>
                <div className="rank-podium-author">
                  <img src={recipe.author.avatar} alt={recipe.author.name} className="rank-podium-avatar" />
                  <span>{recipe.author.name}</span>
                </div>
                <div className="rank-podium-stats">
                  <span className="rank-podium-rating">★ {recipe.rating}</span>
                  <span className="rank-podium-comments">💬 {recipe.commentCount}</span>
                </div>
                <div
                  className="rank-podium-base"
                  style={{ background: medalColors[i], height: i === 0 ? 80 : 50 }}
                />
              </div>
            ))}
          </div>
        )}

        {rest.length > 0 && (
          <div className="rank-rest-section">
            <h2 className="rank-rest-title">更多排名</h2>
            <div className="rank-rest-grid">
              {rest.map((recipe, i) => (
                <div
                  key={recipe.id}
                  className="rank-rest-card"
                  onClick={() => navigate(`/recipe/${recipe.id}`)}
                  style={{ animationDelay: `${(i + 3) * 0.05}s` }}
                >
                  <span className="rank-rest-rank">#{i + 4}</span>
                  <img src={recipe.image} alt={recipe.title} className="rank-rest-image" />
                  <div className="rank-rest-info">
                    <h4 className="rank-rest-name">{recipe.title}</h4>
                    <span className="rank-rest-author">{recipe.author.name}</span>
                    <div className="rank-rest-stats">
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
  .rank-page {
    position: relative;
    min-height: calc(100vh - 64px);
    overflow: hidden;
  }
  .rank-canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0;
  }
  .rank-content {
    position: relative;
    z-index: 1;
    max-width: 1000px;
    margin: 0 auto;
    padding: 32px 24px 48px;
  }
  .rank-title {
    font-size: 36px;
    font-weight: 700;
    color: #4A3728;
    text-align: center;
    margin-bottom: 8px;
    font-family: 'Noto Serif SC', serif;
  }
  .rank-subtitle {
    text-align: center;
    color: #8B7355;
    font-size: 16px;
    margin-bottom: 24px;
  }
  @media (max-width: 768px) {
    .rank-title { font-size: 28px; }
    .rank-content { padding: 24px 16px 32px; }
  }

  .rank-sort-bar {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-bottom: 36px;
    flex-wrap: wrap;
  }
  .rank-sort-btn {
    padding: 8px 24px;
    border-radius: 24px;
    border: 1.5px solid #D4A574;
    background: transparent;
    color: #8B7355;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.25s ease;
    font-family: 'Noto Sans SC', sans-serif;
  }
  .rank-sort-btn-active {
    background: #D4A574;
    color: #FFFFFF;
    border-color: #D4A574;
  }

  .rank-podium {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: auto auto;
    gap: 16px;
    align-items: end;
    margin-bottom: 40px;
  }
  .rank-podium-1 {
    grid-column: 2;
    grid-row: 1 / span 2;
  }
  .rank-podium-2 {
    grid-column: 1;
    grid-row: 2;
  }
  .rank-podium-3 {
    grid-column: 3;
    grid-row: 2;
  }
  @media (max-width: 768px) {
    .rank-podium {
      grid-template-columns: 1fr;
      grid-template-rows: auto;
      gap: 12px;
    }
    .rank-podium-1,
    .rank-podium-2,
    .rank-podium-3 {
      grid-column: 1;
      grid-row: auto;
    }
  }

  .rank-podium-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: #FFFFFF;
    border-radius: 16px;
    padding: 20px 16px 0;
    box-shadow: 0 4px 20px rgba(74, 55, 40, 0.08);
    overflow: hidden;
    cursor: pointer;
    transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    animation: fadeInUp 0.6s ease both;
  }
  .rank-podium-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 32px rgba(74, 55, 40, 0.15);
  }
  .rank-podium-1 .rank-podium-image {
    width: 140px;
    height: 140px;
  }
  @media (max-width: 768px) {
    .rank-podium-1 .rank-podium-image {
      width: 120px;
      height: 120px;
    }
  }

  .rank-medal {
    font-size: 36px;
    margin-bottom: 8px;
  }
  .rank-podium-image {
    width: 120px;
    height: 120px;
    border-radius: 12px;
    object-fit: cover;
    margin-bottom: 12px;
  }
  @media (max-width: 768px) {
    .rank-podium-image {
      width: 100px;
      height: 100px;
    }
  }
  .rank-podium-title {
    font-size: 18px;
    font-weight: 600;
    color: #4A3728;
    text-align: center;
    margin-bottom: 8px;
    font-family: 'Noto Serif SC', serif;
  }
  .rank-podium-author {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: #8B7355;
    margin-bottom: 8px;
  }
  .rank-podium-avatar {
    width: 22px;
    height: 22px;
    border-radius: 50%;
  }
  .rank-podium-stats {
    display: flex;
    gap: 16px;
    font-size: 14px;
    color: #4A3728;
    margin-bottom: 12px;
  }
  .rank-podium-rating { color: #E74C3C; }
  .rank-podium-comments { color: #6B8E23; }
  .rank-podium-base {
    width: 100%;
    opacity: 0.2;
    margin-top: auto;
  }

  .rank-rest-section { margin-top: 8px; }
  .rank-rest-title {
    font-size: 22px;
    font-weight: 600;
    color: #4A3728;
    margin-bottom: 20px;
    font-family: 'Noto Serif SC', serif;
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

  .rank-rest-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px;
    background: #FFFFFF;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(74, 55, 40, 0.06);
    cursor: pointer;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    animation: fadeInUp 0.5s ease both;
  }
  .rank-rest-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(74, 55, 40, 0.12);
  }
  .rank-rest-rank {
    font-size: 18px;
    font-weight: 700;
    color: #D4A574;
    min-width: 36px;
  }
  .rank-rest-image {
    width: 56px;
    height: 56px;
    border-radius: 10px;
    object-fit: cover;
    flex-shrink: 0;
  }
  .rank-rest-info { flex: 1; min-width: 0; }
  .rank-rest-name {
    font-size: 15px;
    font-weight: 500;
    color: #4A3728;
    margin-bottom: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .rank-rest-author {
    font-size: 12px;
    color: #8B7355;
  }
  .rank-rest-stats {
    display: flex;
    gap: 12px;
    font-size: 13px;
    color: #8B7355;
    margin-top: 4px;
  }
`
