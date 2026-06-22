import React, { useRef } from 'react'
import { useParticleSystem } from '../modules/portal/PortalNavigator'

const StarryScene: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useParticleSystem(canvasRef, {
    count: 120,
    colors: ['#FFFFFF', '#F0F8FF', '#E6E6FA', '#B0E0E6', '#FFFACD'],
    minSize: 1,
    maxSize: 4,
    minSpeedX: -0.05,
    maxSpeedX: 0.05,
    minSpeedY: -0.05,
    maxSpeedY: 0.05,
    shapes: ['star', 'circle']
  })

  return (
    <div className="scene starry-scene">
      <div className="scene-sky" style={{ background: 'linear-gradient(180deg, #000011 0%, #0a0a2e 50%, #191970 100%)' }} />
      <div className="scene-ground" style={{ background: 'linear-gradient(180deg, #191970 0%, #0f0f3f 100%)' }} />
      <div className="scene-decorations">
        <div className="moon" style={{ background: 'radial-gradient(circle at 30% 30%, #FFFACD, #F0E68C, #DAA520)' }} />
        <div className="nebula nebula-1" style={{ background: 'radial-gradient(ellipse, rgba(138, 43, 226, 0.3), transparent 70%)' }} />
        <div className="nebula nebula-2" style={{ background: 'radial-gradient(ellipse, rgba(0, 191, 255, 0.2), transparent 70%)' }} />
        <div className="mountain mountain-1" style={{ borderBottomColor: '#1a1a4a' }} />
        <div className="mountain mountain-2" style={{ borderBottomColor: '#0f0f3f' }} />
      </div>
      <canvas ref={canvasRef} className="particles-canvas" />
    </div>
  )
}

export default StarryScene
