import React, { useRef } from 'react'
import { useParticleSystem } from '../modules/portal/PortalNavigator'

const ForestScene: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useParticleSystem(canvasRef, {
    count: 60,
    colors: ['#228B22', '#32CD32', '#006400', '#8FBC8F', '#556B2F'],
    minSize: 4,
    maxSize: 10,
    minSpeedX: -0.5,
    maxSpeedX: 0.5,
    minSpeedY: 0.3,
    maxSpeedY: 1.0,
    gravity: 0.02,
    shapes: ['leaf']
  })

  return (
    <div className="scene forest-scene">
      <div className="scene-sky" style={{ background: '#0B3D0B' }} />
      <div className="scene-ground" style={{ background: 'linear-gradient(180deg, #2E8B57 0%, #1a5c35 100%)' }} />
      <div className="scene-decorations">
        <div className="tree" style={{ left: '10%', height: '200px' }}>
          <div className="tree-trunk" />
          <div className="tree-leaves" style={{ background: 'radial-gradient(circle, #228B22, #006400)' }} />
        </div>
        <div className="tree" style={{ left: '85%', height: '240px' }}>
          <div className="tree-trunk" />
          <div className="tree-leaves" style={{ background: 'radial-gradient(circle, #32CD32, #228B22)' }} />
        </div>
        <div className="tree" style={{ left: '5%', height: '160px', bottom: '80px' }}>
          <div className="tree-trunk" />
          <div className="tree-leaves" style={{ background: 'radial-gradient(circle, #2E8B57, #006400)' }} />
        </div>
      </div>
      <canvas ref={canvasRef} className="particles-canvas" />
    </div>
  )
}

export default ForestScene
