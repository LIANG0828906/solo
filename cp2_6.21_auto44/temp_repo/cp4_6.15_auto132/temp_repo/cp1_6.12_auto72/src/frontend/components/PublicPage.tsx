import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'

interface Project {
  id: string
  name: string
  description: string
  stage: '构思中' | '进行中' | '已完成'
  progress: number
  images: string[]
}

interface Material {
  id: string
  name: string
  quantity: number
  unitPrice: number
}

interface PublicData {
  project: Project
  materials: Material[]
  totalCost: number
}

const stageClassMap: Record<string, string> = {
  '构思中': 'stage-concept',
  '进行中': 'stage-progress',
  '已完成': 'stage-completed'
}

function PublicPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [data, setData] = useState<PublicData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!projectId) return
    
    fetch(`/api/public/${projectId}`)
      .then(res => {
        if (!res.ok) {
          throw new Error('项目不存在')
        }
        return res.json()
      })
      .then((data: PublicData) => {
        setData(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('加载数据失败:', err)
        setLoading(false)
      })
  }, [projectId])

  const goToSlide = useCallback((index: number) => {
    if (!data) return
    const totalSlides = data.project.images.length
    setCurrentSlide((index + totalSlides) % totalSlides)
  }, [data])

  const nextSlide = useCallback(() => {
    goToSlide(currentSlide + 1)
  }, [currentSlide, goToSlide])

  const prevSlide = useCallback(() => {
    goToSlide(currentSlide - 1)
  }, [currentSlide, goToSlide])

  useEffect(() => {
    if (!data || data.project.images.length <= 1) return
    
    const interval = setInterval(() => {
      nextSlide()
    }, 5000)
    
    return () => clearInterval(interval)
  }, [data, nextSlide])

  const handleImageLoad = (src: string) => {
    setLoadedImages(prev => new Set(prev).add(src))
  }

  if (loading) {
    return (
      <div className="public-page-wrapper">
        <div className="loading">加载中...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="public-page-wrapper">
        <div className="public-page-card" style={{ padding: '40px', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '16px', color: 'var(--color-warm-gray-dark)' }}>页面不存在</h2>
          <p style={{ color: 'var(--color-warm-gray)' }}>该公开链接无效或已过期</p>
        </div>
      </div>
    )
  }

  const { project, materials, totalCost } = data

  return (
    <div className="public-page-wrapper">
      <div className="public-page-card">
        {project.images.length > 0 && (
          <div className="carousel-container">
            <div 
              className="carousel-track"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {project.images.map((imgSrc, index) => (
                <div key={index} className="carousel-slide">
                  <img
                    src={imgSrc}
                    alt={`${project.name} - 图片 ${index + 1}`}
                    loading="lazy"
                    onLoad={() => handleImageLoad(imgSrc)}
                    style={{
                      opacity: loadedImages.has(imgSrc) ? 1 : 0,
                      transition: 'opacity 0.5s ease'
                    }}
                  />
                </div>
              ))}
            </div>
            
            {project.images.length > 1 && (
              <>
                <button 
                  className="carousel-arrow prev"
                  onClick={prevSlide}
                  aria-label="上一张"
                >
                  ‹
                </button>
                <button 
                  className="carousel-arrow next"
                  onClick={nextSlide}
                  aria-label="下一张"
                >
                  ›
                </button>
                <div className="carousel-dots">
                  {project.images.map((_, index) => (
                    <button
                      key={index}
                      className={`carousel-dot ${index === currentSlide ? 'active' : ''}`}
                      onClick={() => goToSlide(index)}
                      aria-label={`跳转到第 ${index + 1} 张`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        
        <div className="public-content">
          <h1 className="public-title">{project.name}</h1>
          <div className="public-stage">
            <span className={`stage-badge ${stageClassMap[project.stage]}`}>
              {project.stage}
            </span>
          </div>
          
          {project.description && (
            <p className="public-description">{project.description}</p>
          )}
          
          {materials.length > 0 && (
            <>
              <h3 className="public-materials-title">材料清单</h3>
              <ul className="public-materials-list">
                {materials.map(material => (
                  <li key={material.id}>
                    <span className="material-name">{material.name}</span>
                    <div className="material-detail">
                      数量: {material.quantity} × ¥{material.unitPrice.toFixed(2)}
                    </div>
                  </li>
                ))}
              </ul>
              
              <div className="public-total-cost">
                <div className="label">预估总成本</div>
                <div className="value">¥ {totalCost.toFixed(2)}</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default PublicPage
