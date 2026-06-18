import { useEffect, useRef, useState, useCallback } from 'react'
import { PageFlipEngine, type FlipKeyframe } from '../engine/pageFlipEngine'
import { RenderEngine, type PageData } from '../engine/renderEngine'
import { useSketchStore, type Annotation } from '../stores/sketchStore'
import './SketchBook.css'

export function SketchBook() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const flipEngineRef = useRef<PageFlipEngine | null>(null)
  const renderEngineRef = useRef<RenderEngine | null>(null)
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map())
  
  const [pageSize, setPageSize] = useState({ width: 600, height: 800 })
  const [isMobile, setIsMobile] = useState(false)
  const [editingAnnotation, setEditingAnnotation] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [transitioning, setTransitioning] = useState(false)
  const [displayPage, setDisplayPage] = useState(0)

  const { 
    pages, 
    currentPage, 
    setCurrentPage, 
    annotations,
    addAnnotation, 
    updateAnnotation, 
    deleteAnnotation,
    getAnnotationsByPage 
  } = useSketchStore()

  const currentAnnotations = getAnnotationsByPage(displayPage)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return
      
      const containerWidth = containerRef.current.clientWidth
      let width: number
      
      if (isMobile) {
        width = Math.min(window.innerWidth * 0.95, 600)
      } else {
        width = Math.max(600, window.innerWidth * 0.6)
      }
      
      const height = width * 1.33
      setPageSize({ width, height })
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [isMobile])

  const loadImage = useCallback((url: string): Promise<HTMLImageElement> => {
    const cached = imageCacheRef.current.get(url)
    if (cached) {
      return Promise.resolve(cached)
    }

    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        imageCacheRef.current.set(url, img)
        resolve(img)
      }
      img.onerror = reject
      img.src = url
    })
  }, [])

  const getPageData = useCallback((pageIndex: number): PageData => {
    if (pageIndex < 0 || pageIndex >= pages.length) {
      return { image: null, isLoaded: false, backgroundColor: '#FFFEF9' }
    }

    const page = pages[pageIndex]
    const cached = imageCacheRef.current.get(page.imageUrl)
    return {
      image: cached || null,
      isLoaded: !!cached,
      backgroundColor: '#FFFEF9'
    }
  }, [pages])

  useEffect(() => {
    if (!canvasRef.current) return

    const engine = new PageFlipEngine({
      pageWidth: pageSize.width,
      pageHeight: pageSize.height,
      flipThreshold: 0.3,
      easeFactor: 0.15,
    })

    const render = new RenderEngine({
      canvas: canvasRef.current,
      pageWidth: pageSize.width,
      pageHeight: pageSize.height,
    })

    flipEngineRef.current = engine
    renderEngineRef.current = render

    loadImage(pages[currentPage]?.imageUrl || '').then(() => {
      render.setCurrentPage(getPageData(currentPage))
    }).catch(() => {
      render.setCurrentPage({ image: null, isLoaded: true, backgroundColor: '#FFFEF9' })
    })

    const unsubscribe = engine.subscribe((keyframe: FlipKeyframe) => {
      const direction = engine.getFlipDirection()
      render.updateFlip(keyframe, direction)
    })

    return () => {
      unsubscribe()
      engine.destroy()
      render.destroy()
    }
  }, [])

  useEffect(() => {
    if (flipEngineRef.current) {
      flipEngineRef.current.setPageSize(pageSize.width, pageSize.height)
    }
    if (renderEngineRef.current) {
      renderEngineRef.current.setPageSize(pageSize.width, pageSize.height)
    }
  }, [pageSize])

  useEffect(() => {
    if (!renderEngineRef.current) return

    setDisplayPage(currentPage)

    const currentImg = loadImage(pages[currentPage]?.imageUrl || '')
    const nextImg = currentPage < pages.length - 1 
      ? loadImage(pages[currentPage + 1]?.imageUrl || '') 
      : Promise.resolve(null)
    const prevImg = currentPage > 0 
      ? loadImage(pages[currentPage - 1]?.imageUrl || '') 
      : Promise.resolve(null)

    Promise.all([currentImg, nextImg, prevImg]).then(([current, next, prev]) => {
      if (renderEngineRef.current) {
        renderEngineRef.current.setCurrentPage(getPageData(currentPage))
        renderEngineRef.current.setNextPage(currentPage < pages.length - 1 ? getPageData(currentPage + 1) : null)
        renderEngineRef.current.setPrevPage(currentPage > 0 ? getPageData(currentPage - 1) : null)
      }
    })
  }, [currentPage, pages, loadImage, getPageData])

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canvasRef.current || !flipEngineRef.current || transitioning) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    flipEngineRef.current.handlePointerDown(x, y)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canvasRef.current || !flipEngineRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    flipEngineRef.current.handlePointerMove(x, y)
  }

  const handlePointerUp = () => {
    if (!flipEngineRef.current) return

    const engine = flipEngineRef.current
    const wasDragging = engine['isDragging'] as boolean
    const progress = engine.getFlipProgress()
    const direction = engine.getFlipDirection()

    engine.handlePointerUp()

    if (wasDragging && progress > 0.3 && direction) {
      setTransitioning(true)
      setTimeout(() => {
        if (direction === 'next' && currentPage < pages.length - 1) {
          setCurrentPage(currentPage + 1)
        } else if (direction === 'prev' && currentPage > 0) {
          setCurrentPage(currentPage - 1)
        }
        setTransitioning(false)
      }, 400)
    }
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current || flipEngineRef.current?.isActive()) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    addAnnotation(currentPage, x, y, '新批注')
    const newAnnotations = getAnnotationsByPage(currentPage)
    const newest = newAnnotations[newAnnotations.length - 1]
    if (newest) {
      setEditingAnnotation(newest.id)
      setEditText('新批注')
    }
  }

  const handleAnnotationClick = (e: React.MouseEvent, annotation: Annotation) => {
    e.stopPropagation()
    setEditingAnnotation(annotation.id)
    setEditText(annotation.text)
  }

  const handleAnnotationUpdate = (id: string) => {
    updateAnnotation(id, editText)
    setEditingAnnotation(null)
    setEditText('')
  }

  const handleAnnotationDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    deleteAnnotation(id)
    if (editingAnnotation === id) {
      setEditingAnnotation(null)
      setEditText('')
    }
  }

  const handlePageJump = (index: number) => {
    if (index === currentPage || transitioning) return
    setTransitioning(true)
    setTimeout(() => {
      setCurrentPage(index)
      setTransitioning(false)
    }, 300)
  }

  const getAnnotationColor = (index: number, total: number): string => {
    if (total <= 1) return '#FF6B6B'
    const ratio = index / (total - 1)
    const r = Math.round(255 - ratio * (255 - 78))
    const g = Math.round(107 + ratio * (205 - 107))
    const b = Math.round(107 + ratio * (196 - 107))
    return `rgb(${r}, ${g}, ${b})`
  }

  return (
    <div className="sketchbook-container">
      <div 
        className={`canvas-wrapper ${isMobile ? 'mobile' : ''}`}
        ref={containerRef}
      >
        <div className="book-spine left" />
        
        <div 
          className="canvas-container"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onClick={handleCanvasClick}
          style={{ width: pageSize.width, height: pageSize.height }}
        >
          <canvas 
            ref={canvasRef} 
            className={`flip-canvas ${transitioning ? 'transitioning' : ''}`}
          />
          
          {currentAnnotations.map((annotation, index) => (
            <div
              key={annotation.id}
              className={`annotation-note ${editingAnnotation === annotation.id ? 'editing' : ''}`}
              style={{
                left: `${annotation.x}%`,
                top: `${annotation.y}%`,
                borderLeftColor: getAnnotationColor(index, currentAnnotations.length),
              }}
              onClick={(e) => handleAnnotationClick(e, annotation)}
            >
              {editingAnnotation === annotation.id ? (
                <div className="annotation-edit">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onBlur={() => handleAnnotationUpdate(annotation.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleAnnotationUpdate(annotation.id)
                      }
                    }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              ) : (
                <div className="annotation-content">
                  {annotation.text}
                  <button 
                    className="annotation-delete"
                    onClick={(e) => handleAnnotationDelete(e, annotation.id)}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="book-spine right" />
      </div>

      <div className={`annotation-panel ${isMobile ? 'mobile' : ''}`}>
        <div className="panel-header">
          <h3>批注笔记</h3>
          <span className="annotation-count">{currentAnnotations.length} 条</span>
        </div>
        <div className={`annotation-list ${isMobile ? 'horizontal' : ''}`}>
          {currentAnnotations.length === 0 ? (
            <div className="empty-state">
              点击页面添加批注
            </div>
          ) : (
            currentAnnotations.map((annotation, index) => (
              <div
                key={annotation.id}
                className="annotation-item"
                style={{ borderLeftColor: getAnnotationColor(index, currentAnnotations.length) }}
                onClick={() => {
                  setEditingAnnotation(annotation.id)
                  setEditText(annotation.text)
                }}
              >
                <div className="annotation-item-text">
                  {annotation.text}
                </div>
                <button 
                  className="annotation-item-delete"
                  onClick={(e) => handleAnnotationDelete(e, annotation.id)}
                >
                  删除
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="page-indicator">
        {pages.map((_, index) => (
          <button
            key={index}
            className={`page-dot ${index === currentPage ? 'active' : ''}`}
            onClick={() => handlePageJump(index)}
            aria-label={`跳转到第 ${index + 1} 页`}
          />
        ))}
        <span className="page-number">{currentPage + 1} / {pages.length}</span>
      </div>
    </div>
  )
}
