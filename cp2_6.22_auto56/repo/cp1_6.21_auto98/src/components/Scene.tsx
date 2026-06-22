import { useRef, useEffect, useState, useMemo } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { useScrollContext } from '../context/ScrollContext'
import './Scene.css'

export interface SceneProps {
  imageUrl: string
  title: string
  content: string
  index: number
}

export function Scene({ imageUrl, title, content, index }: SceneProps) {
  const { viewportHeight, scrollProgress } = useScrollContext()
  const sectionRef = useRef<HTMLElement>(null)
  const [isActive, setIsActive] = useState(false)
  const [hasEntered, setHasEntered] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const imageControls = useAnimation()
  const textControls = useAnimation()

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    let ticking = false
    let rafId: number | null = null

    const checkScene = () => {
      if (!ticking) {
        rafId = requestAnimationFrame(() => {
          const scrollY = window.scrollY
          const vh = viewportHeight
          const heroHeight = vh
          const sceneStart = heroHeight + index * vh
          const sceneEnd = sceneStart + vh

          const active = scrollY + vh * 0.5 >= sceneStart && scrollY < sceneEnd
          setIsActive(active)

          if (active && !hasEntered) {
            setHasEntered(true)
          }

          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', checkScene, { passive: true })
    checkScene()

    return () => {
      window.removeEventListener('scroll', checkScene)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [viewportHeight, index, hasEntered])

  useEffect(() => {
    if (hasEntered) {
      imageControls.start({
        y: 0,
        scale: 1,
        opacity: 1,
        transition: { duration: 0.6, ease: 'easeOut' },
      })
      textControls.start({
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: 'easeOut', delay: 0.3 },
      })
    }
  }, [hasEntered, imageControls, textControls])

  const renderContent = (text: string) => {
    const parts: JSX.Element[] = []
    let lastIndex = 0
    const regex = /"([^"]+)"/g
    let match

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>{text.slice(lastIndex, match.index)}</span>
        )
      }
      parts.push(
        <blockquote key={`quote-${match.index}`} className="scene-quote">
          {match[1]}
        </blockquote>
      )
      lastIndex = match.index + match[0].length
    }

    if (lastIndex < text.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>{text.slice(lastIndex)}</span>
      )
    }

    return parts.length > 0 ? parts : text
  }

  const sceneProgress = useMemo(() => {
    const scrollY = window.scrollY
    const heroHeight = viewportHeight
    const sceneStart = heroHeight + index * viewportHeight
    const sceneEnd = sceneStart + viewportHeight
    const progress = (scrollY - sceneStart) / (sceneEnd - sceneStart)
    return Math.max(0, Math.min(1, progress))
  }, [scrollProgress, viewportHeight, index])

  const getHorizontalOffset = () => {
    if (isMobile) return 0
    if (sceneProgress < 0) return '100%'
    if (sceneProgress > 1) return '-100%'
    return '0%'
  }

  return (
    <section
      ref={sectionRef}
      className={`scene-section ${isActive ? 'active' : ''}`}
      style={{ height: isMobile ? 'auto' : viewportHeight }}
      data-scene-index={index}
    >
      <div className="scene-inner">
        <motion.div
          className="scene-content"
          initial={{ x: '100%' }}
          animate={{ x: getHorizontalOffset() }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          style={{ willChange: 'transform' }}
        >
          <motion.div
            className="scene-image-wrapper"
            initial={{ y: 60, scale: 1.1, opacity: 0 }}
            animate={imageControls}
            style={{ willChange: 'transform, opacity' }}
          >
            <img
              src={imageUrl}
              alt={title}
              className="scene-image"
            />
          </motion.div>

          <motion.div
            className="scene-text"
            initial={{ opacity: 0, y: 20 }}
            animate={textControls}
            style={{ willChange: 'opacity, transform' }}
          >
            <div className="scene-index">
              <span className="scene-index-number">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="scene-index-line" />
            </div>
            <h2 className="scene-title">{title}</h2>
            <div className="scene-body">{renderContent(content)}</div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

export default Scene
