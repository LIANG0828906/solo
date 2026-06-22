import { useRef, useEffect, useState } from 'react'
import { useScrollContext } from '../context/ScrollContext'
import { motion } from 'framer-motion'
import './HeroVideo.css'

export interface HeroVideoProps {
  videoUrl?: string
  title: string
  subtitle: string
}

export function HeroVideo({
  videoUrl = 'https://www.w3schools.com/html/mov_bbb.mp4',
  title,
  subtitle,
}: HeroVideoProps) {
  const { viewportHeight } = useScrollContext()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [scrollY, setScrollY] = useState(0)
  const fadeThreshold = viewportHeight * 0.2

  useEffect(() => {
    let ticking = false
    let rafId: number | null = null

    const handleScroll = () => {
      if (!ticking) {
        rafId = requestAnimationFrame(() => {
          const currentScroll = window.scrollY
          setScrollY(currentScroll)
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [fadeThreshold])

  const opacity = Math.max(0, 1 - scrollY / fadeThreshold)
  const translateY = scrollY > 0 ? scrollY * 0.3 : 0

  return (
    <section
      className="hero-video-section"
      style={{ height: viewportHeight }}
    >
      <div
        className="hero-video-wrapper"
        style={{
          transform: `translateY(${translateY}px)`,
          opacity: opacity,
        }}
      >
        <video
          ref={videoRef}
          className="hero-video"
          autoPlay
          loop
          muted
          playsInline
          poster="https://via.placeholder.com/1920x1080/1a1a2e/ffffff?text=Brand+Story"
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
        <div className="hero-overlay" />
        <div className="hero-content">
          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
          >
            {title}
          </motion.h1>
          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.6 }}
          >
            {subtitle}
          </motion.p>
          <motion.div
            className="hero-scroll-hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            <span>向下滚动</span>
            <div className="scroll-arrow" />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default HeroVideo
