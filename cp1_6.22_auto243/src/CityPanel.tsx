import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import * as THREE from 'three'
import type { City } from './App'

interface CityPanelProps {
  city: City
  onClose: () => void
  viewportWidth: number
  containerRef: React.RefObject<HTMLDivElement>
}

function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  )
}

function CityPanel({ city, onClose, viewportWidth, containerRef }: CityPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(true)
    if (panelRef.current) {
      gsap.fromTo(
        panelRef.current,
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.3, ease: 'power2.out' },
      )
    }
    return () => {
      if (panelRef.current) {
        gsap.to(panelRef.current, { scale: 0.8, opacity: 0, duration: 0.2, ease: 'power2.in' })
      }
    }
  }, [])

  const handleClose = () => {
    if (panelRef.current) {
      gsap.to(panelRef.current, {
        scale: 0.8,
        opacity: 0,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: onClose,
      })
    } else {
      onClose()
    }
  }

  const panelWidth = viewportWidth < 768 ? 260 : 320

  return (
    <div
      ref={panelRef}
      className="city-panel"
      style={{
        position: 'absolute',
        top: '50%',
        right: viewportWidth < 768 ? '50%' : '80px',
        transform: viewportWidth < 768 ? 'translate(50%, -50%)' : 'translateY(-50%)',
        width: `${panelWidth}px`,
        background: 'rgba(26, 27, 58, 0.88)',
        border: '1px solid rgba(255, 107, 53, 0.4)',
        borderRadius: '12px',
        padding: '20px',
        zIndex: 10,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(255, 107, 53, 0.1)',
      }}
    >
      <button
        onClick={handleClose}
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'transparent',
          border: 'none',
          color: 'rgba(255, 255, 255, 0.6)',
          cursor: 'pointer',
          fontSize: '18px',
          padding: '4px 8px',
          borderRadius: '6px',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#ffffff'
          e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'
          e.currentTarget.style.background = 'transparent'
        }}
      >
        ×
      </button>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', color: '#FF6B35', marginBottom: '6px', fontWeight: 500 }}>
          巡演城市
        </div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.5px' }}>
          {city.name}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ width: '32px', color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>日期</div>
          <div style={{ fontSize: '15px', color: '#ffffff' }}>{city.date}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '32px', color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>场馆</div>
          <div style={{ fontSize: '15px', color: '#ffffff' }}>{city.venue}</div>
        </div>
      </div>

      <a
        href={city.ticketUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="ticket-button"
        style={{
          display: 'block',
          width: '100%',
          padding: '12px',
          background: '#FF6B35',
          color: '#ffffff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '15px',
          fontWeight: 600,
          cursor: 'pointer',
          textAlign: 'center',
          textDecoration: 'none',
        }}
      >
        立即购票
      </a>
    </div>
  )
}

export default CityPanel
