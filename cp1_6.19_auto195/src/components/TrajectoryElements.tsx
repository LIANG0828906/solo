import { Html } from '@react-three/drei'
import { motion } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'
import { useState } from 'react'

interface TrajectoryLabelsProps {
  hoveredPoint: number | null
  setHoveredPoint: (index: number | null) => void
}

const TrajectoryLabels = ({ hoveredPoint, setHoveredPoint }: TrajectoryLabelsProps) => {
  const trajectory = useAppStore((state) => state.trajectory)
  const showTrajectory = useAppStore((state) => state.showTrajectory)

  if (!showTrajectory) return null

  return (
    <>
      {trajectory.map((point, i) => {
        const now = performance.now()
        const isRecent = now - point.timestamp < 3000
        const opacity = isRecent ? 0.8 : 0.3
        const isHovered = hoveredPoint === i

        return (
          <group key={point.timestamp} position={[point.position.x, point.position.y, point.position.z]}>
            <mesh
              onPointerOver={() => setHoveredPoint(i)}
              onPointerOut={() => setHoveredPoint(null)}
            >
              <sphereGeometry args={[isHovered ? 0.15 : 0.08, 16, 16]} />
              <meshBasicMaterial
                color="#1E90FF"
                transparent
                opacity={opacity}
              />
            </mesh>

            <Html
              position={[0, 0.3, 0]}
              center
              style={{
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  color: '#ffffff',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  whiteSpace: 'nowrap',
                  textShadow: '0 0 8px rgba(30, 144, 255, 0.8)',
                  opacity: opacity,
                  transition: 'all 0.2s ease-out',
                  transform: isHovered ? 'scale(1.2)' : 'scale(1)',
                }}
              >
                {isHovered ? (
                  <div style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #1E90FF',
                  }}>
                    <div>{new Date(point.timestamp).toLocaleTimeString()}</div>
                    <div style={{ color: '#4FC3F7' }}>专注度: {(point.focus * 100).toFixed(1)}%</div>
                    <div style={{ color: '#FF7043' }}>情绪值: {(point.emotion * 100).toFixed(1)}%</div>
                    <div style={{ color: '#81C784' }}>跃迁率: {(point.transition * 100).toFixed(1)}%</div>
                  </div>
                ) : (
                  <div style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                  }}>
                    <div>{point.label}</div>
                    <div style={{ color: '#4FC3F7', fontSize: '10px' }}>
                      {(point.focus * 100).toFixed(0)}%
                    </div>
                  </div>
                )}
              </div>
            </Html>
          </group>
        )
      })}
    </>
  )
}

const ToggleButton = () => {
  const showTrajectory = useAppStore((state) => state.showTrajectory)
  const toggleTrajectory = useAppStore((state) => state.toggleTrajectory)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.button
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4, ease: 'easeOut' }}
      onClick={toggleTrajectory}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100px',
        height: '32px',
        borderRadius: '16px',
        backgroundColor: isHovered ? '#555555' : '#333333',
        color: '#ffffff',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'monospace',
        fontSize: '12px',
        transition: 'all 0.2s ease-out',
        boxShadow: isHovered ? '0 0 15px rgba(100, 150, 255, 0.3)' : 'none',
        textShadow: '0 0 8px rgba(255, 255, 255, 0.3)',
        zIndex: 100,
      }}
    >
      {showTrajectory ? '隐藏轨迹' : '显示轨迹'}
    </motion.button>
  )
}

export { TrajectoryLabels, ToggleButton }
