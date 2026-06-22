import React, { useRef } from 'react'
import { useParticleSystem } from '../modules/portal/PortalNavigator'

const DesertScene: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useParticleSystem(canvasRef, {
    count: 80,
    colors: ['#D2B48C', '#DEB887', '#F4A460', '#DAA520', '#CD853F'],
    minSize: 1,
    maxSize: 3,
    minSpeedX: 1.5,
    maxSpeedX: 4.0,
    minSpeedY: -0.3,
    maxSpeedY: 0.3,
    shapes: ['sand', 'circle']
  })

  return (
    <div className="scene desert-scene">
      <div className="scene-sky" style={{ background: 'linear-gradient(180deg, #FFB347 0%, #D2B48C 60%, #F4A460 100%)' }} />
      <div className="scene-ground" style={{ background: 'linear-gradient(180deg, #F4A460 0%, #CD853F 100%)' }} />
      <div className="scene-decorations">
        <div className="sun" style={{ background: 'radial-gradient(circle, #FFD700, #FFA500, #FF8C00)' }} />
        <div className="cactus" style={{ left: '15%', height: '120px' }}>
          <div className="cactus-main" />
          <div className="cactus-arm cactus-arm-left" />
          <div className="cactus-arm cactus-arm-right" />
        </div>
        <div className="cactus" style={{ left: '80%', height: '90px' }}>
          <div className="cactus-main" />
          <div className="cactus-arm cactus-arm-right" />
        </div>
        <div className="sand-dune" style={{ left: '60%', width: '300px', height: '60px' }} />
        <div className="sand-dune" style={{ left: '0%', width: '400px', height: '50px', bottom: '0' }} />
      </div>
      <canvas ref={canvasRef} className="particles-canvas" />
    </div>
  )
}

export default DesertScene
