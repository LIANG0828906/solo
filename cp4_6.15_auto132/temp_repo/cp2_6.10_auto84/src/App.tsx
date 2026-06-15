import { useState, useEffect, useCallback, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import ArmillarySphere from './components/ArmillarySphere'
import StarField from './components/StarField'
import { useHunyuanStore, SHICHEN, CONSTELLATIONS, CalibrationRecord } from './stores/hunyuanStore'

function playBellSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1)
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.3)
  } catch (e) {
    console.log('Audio not supported')
  }
}

function AngleDisplay() {
  const equatorialAngle = useHunyuanStore((state) => state.equatorialAngle)
  const horizonAngle = useHunyuanStore((state) => state.horizonAngle)
  const meridianAngle = useHunyuanStore((state) => state.meridianAngle)
  const isCalibrated = useHunyuanStore((state) => state.isCalibrated)

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute top-4 right-4 z-10"
      style={{
        background: 'rgba(0, 0, 0, 0.85)',
        border: '2px solid #b87333',
        borderRadius: '8px',
        padding: '16px 20px',
        minWidth: '180px',
        boxShadow: '0 0 20px rgba(184, 115, 51, 0.3)',
      }}
    >
      <div style={{ color: '#ffd700', fontSize: '14px', marginBottom: '12px', textAlign: 'center', fontFamily: 'SimHei, sans-serif' }}>
        环角度显示器
      </div>
      <div className="bronze-font" style={{ color: '#fff', fontSize: '18px', lineHeight: '2' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ff6b6b' }}>
          <span>赤道:</span>
          <span>{equatorialAngle.toFixed(1)}°</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b9fff' }}>
          <span>地平:</span>
          <span>{horizonAngle.toFixed(1)}°</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ffd700' }}>
          <span>子午:</span>
          <span>{meridianAngle.toFixed(1)}°</span>
        </div>
      </div>
      {isCalibrated && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{
            marginTop: '12px',
            textAlign: 'center',
            color: '#00ff00',
            fontSize: '12px',
            padding: '4px 8px',
            background: 'rgba(0, 255, 0, 0.1)',
            borderRadius: '4px',
          }}
        >
          ✓ 校准通过
        </motion.div>
      )}
    </motion.div>
  )
}

function DeviationDisplay() {
  const averageDeviation = useHunyuanStore((state) => state.averageDeviation)

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute top-4 left-4 z-10"
      style={{
        background: 'rgba(0, 0, 0, 0.85)',
        border: '2px solid #b87333',
        borderRadius: '8px',
        padding: '16px 20px',
        minWidth: '160px',
        boxShadow: '0 0 20px rgba(184, 115, 51, 0.3)',
      }}
    >
      <div style={{ color: '#ffd700', fontSize: '14px', marginBottom: '8px', textAlign: 'center', fontFamily: 'SimHei, sans-serif' }}>
        平均偏差角
      </div>
      <div className="bronze-font" style={{ color: averageDeviation > 120 ? '#ff4444' : '#fff', fontSize: '24px', textAlign: 'center' }}>
        {averageDeviation.toFixed(1)}′
      </div>
      <div style={{ color: '#888', fontSize: '11px', textAlign: 'center', marginTop: '4px' }}>
        (角分)
      </div>
    </motion.div>
  )
}

function StarScroll() {
  const currentSkyRegion = useHunyuanStore((state) => state.currentSkyRegion)
  const currentPlanetPosition = useHunyuanStore((state) => state.currentPlanetPosition)
  const averageDeviation = useHunyuanStore((state) => state.averageDeviation)
  const skyRotation = useHunyuanStore((state) => state.skyRotation)
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollOffset = ((skyRotation % (Math.PI * 2)) / (Math.PI * 2)) * 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10"
      style={{
        background: '#e8d5a3',
        border: '3px solid #8b7355',
        borderRadius: '8px',
        padding: '12px 24px',
        width: '80%',
        maxWidth: '900px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='%23e8d5a3'/%3E%3Cpath d='M0 20h40M20 0v40' stroke='%23d4c090' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")`,
      }}
    >
      <div ref={scrollRef} style={{ overflow: 'hidden', position: 'relative', height: '60px' }}>
        <motion.div
          animate={{ x: `${-scrollOffset}%` }}
          transition={{ ease: 'linear', duration: 0 }}
          style={{ display: 'flex', gap: '40px', whiteSpace: 'nowrap', position: 'absolute' }}
        >
          {[...CONSTELLATIONS, ...CONSTELLATIONS, ...CONSTELLATIONS].map((constellation, idx) => (
            <div
              key={idx}
              style={{
                color: constellation === currentSkyRegion ? '#ff4500' : '#2e1e0e',
                fontSize: constellation === currentSkyRegion ? '20px' : '14px',
                fontWeight: constellation === currentSkyRegion ? 'bold' : 'normal',
                padding: '4px 12px',
                fontFamily: 'SimHei, sans-serif',
                textShadow: constellation === currentSkyRegion ? '0 0 10px rgba(255, 69, 0, 0.5)' : 'none',
                transition: 'all 0.3s ease',
              }}
            >
              {constellation}
            </div>
          ))}
        </motion.div>
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '8px',
        paddingTop: '8px',
        borderTop: '1px solid #8b7355',
      }}>
        <div style={{ color: '#2e1e0e', fontSize: '13px', fontFamily: 'SimHei, sans-serif' }}>
          当前天区: <span style={{ color: '#ff4500', fontWeight: 'bold' }}>{currentSkyRegion}</span>
        </div>
        <div style={{ color: '#2e1e0e', fontSize: '13px', fontFamily: 'SimHei, sans-serif' }}>
          {currentPlanetPosition} | 偏差: <span className="bronze-font" style={{ color: averageDeviation > 120 ? '#c0392b' : '#2e1e0e' }}>{averageDeviation.toFixed(1)}′</span>
        </div>
      </div>
    </motion.div>
  )
}

function ShichenPointer() {
  const rotationSpeed = useHunyuanStore((state) => state.rotationSpeed)
  const setRotationSpeed = useHunyuanStore((state) => state.setRotationSpeed)
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const pointerRef = useRef<HTMLDivElement>(null)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    setIsDragging(true)
    playBellSound()
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent | PointerEvent) => {
    if (!isDragging || !pointerRef.current) return
    
    const rect = pointerRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX)
    const degrees = ((angle * 180 / Math.PI) + 360 + 90) % 360
    const normalizedSpeed = degrees / 360
    
    setRotationSpeed(normalizedSpeed)
  }, [isDragging, setRotationSpeed])

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const pointerAngle = rotationSpeed * 360
  const currentShichen = Math.floor((rotationSpeed * 12) % 12)

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
      return () => {
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerup', handlePointerUp)
      }
    }
  }, [isDragging, handlePointerMove, handlePointerUp])

  return (
    <div
      ref={pointerRef}
      onPointerDown={handlePointerDown}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        width: '120px',
        height: '120px',
        margin: '0 auto 16px',
        cursor: isDragging ? 'grabbing' : 'grab',
        transform: isHovered || isDragging ? 'scale(1.1)' : 'scale(1)',
        transition: 'transform 0.2s ease',
      }}
    >
      <svg width="120" height="120" viewBox="0 0 120 120">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <circle cx="60" cy="60" r="55" fill="rgba(0, 0, 0, 0.7)" stroke="#b87333" strokeWidth="3" filter={isHovered ? 'url(#glow)' : undefined} />
        
        {SHICHEN.map((shichen, idx) => {
          const angle = (idx * 30 - 90) * Math.PI / 180
          const x = 60 + Math.cos(angle) * 42
          const y = 60 + Math.sin(angle) * 42
          const tickX1 = 60 + Math.cos(angle) * 48
          const tickY1 = 60 + Math.sin(angle) * 48
          const tickX2 = 60 + Math.cos(angle) * 52
          const tickY2 = 60 + Math.sin(angle) * 52
          
          return (
            <g key={idx}>
              <line x1={tickX1} y1={tickY1} x2={tickX2} y2={tickY2} stroke="#ffd700" strokeWidth="2" />
              <text
                x={x}
                y={y}
                fill={idx === currentShichen ? '#ff4500' : '#ffd700'}
                fontSize="12"
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ fontFamily: 'SimHei, sans-serif' }}
              >
                {shichen}
              </text>
            </g>
          )
        })}
        
        <g style={{ transformOrigin: '60px 60px', transform: `rotate(${pointerAngle}deg)`, transition: isDragging ? 'none' : 'transform 0.3s ease' }}>
          <line x1="60" y1="60" x2="60" y2="15" stroke="#ff4500" strokeWidth="4" strokeLinecap="round" filter="url(#glow)" />
          <circle cx="60" cy="60" r="6" fill="#ff4500" filter="url(#glow)" />
          <polygon points="60,8 55,18 65,18" fill="#ff4500" filter="url(#glow)" />
        </g>
      </svg>
      
      <div style={{
        textAlign: 'center',
        color: '#ffd700',
        fontSize: '11px',
        marginTop: '4px',
        fontFamily: 'SimHei, sans-serif',
      }}>
        {SHICHEN[currentShichen]}时 | 转速: {(rotationSpeed * 100).toFixed(0)}%
      </div>
    </div>
  )
}

function CalibrationHistory() {
  const calibrationHistory = useHunyuanStore((state) => state.calibrationHistory)
  const resetAll = useHunyuanStore((state) => state.resetAll)
  const addCalibrationRecord = useHunyuanStore((state) => state.addCalibrationRecord)
  const [isResetHovered, setIsResetHovered] = useState(false)
  const [isRecordHovered, setIsRecordHovered] = useState(false)

  const handleReset = () => {
    playBellSound()
    resetAll()
  }

  const handleRecord = () => {
    playBellSound()
    addCalibrationRecord()
  }

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{
        color: '#ffd700',
        fontSize: '14px',
        marginBottom: '12px',
        textAlign: 'center',
        paddingBottom: '8px',
        borderBottom: '1px solid #b87333',
        fontFamily: 'SimHei, sans-serif',
      }}>
        校准历史记录
      </div>
      
      <div style={{
        flex: 1,
        overflowY: 'auto',
        marginBottom: '12px',
        paddingRight: '4px',
      }}>
        {calibrationHistory.length === 0 ? (
          <div style={{ color: '#666', fontSize: '12px', textAlign: 'center', padding: '20px' }}>
            暂无校准记录
          </div>
        ) : (
          calibrationHistory.map((record: CalibrationRecord) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                background: record.status === 'pass' ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)',
                border: `1px solid ${record.status === 'pass' ? '#00ff00' : '#ff0000'}`,
                borderRadius: '4px',
                padding: '8px',
                marginBottom: '6px',
                fontSize: '11px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#ffd700' }}>{record.timestamp}</span>
                <span style={{ color: record.status === 'pass' ? '#00ff00' : '#ff4444' }}>
                  {record.status === 'pass' ? '✓ 通过' : '✗ 失败'}
                </span>
              </div>
              <div style={{ color: '#aaa', lineHeight: '1.5' }}>
                赤:{record.equatorialAngle.toFixed(1)}° 地:{record.horizonAngle.toFixed(1)}° 子:{record.meridianAngle.toFixed(1)}°
              </div>
              <div style={{ color: '#888' }}>
                偏差: {record.averageDeviation.toFixed(1)}′
              </div>
            </motion.div>
          ))
        )}
      </div>
      
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleRecord}
          onMouseEnter={() => setIsRecordHovered(true)}
          onMouseLeave={() => setIsRecordHovered(false)}
          style={{
            flex: 1,
            padding: '10px',
            background: isRecordHovered ? '#ffd700' : '#b87333',
            color: '#000',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
            fontFamily: 'SimHei, sans-serif',
            transform: isRecordHovered ? 'scale(1.05)' : 'scale(1)',
            transition: 'all 0.2s ease',
            boxShadow: isRecordHovered ? '0 0 15px rgba(255, 215, 0, 0.5)' : 'none',
          }}
        >
          记录校准
        </button>
        <button
          onClick={handleReset}
          onMouseEnter={() => setIsResetHovered(true)}
          onMouseLeave={() => setIsResetHovered(false)}
          style={{
            flex: 1,
            padding: '10px',
            background: isResetHovered ? '#ff6b6b' : '#8b0000',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
            fontFamily: 'SimHei, sans-serif',
            transform: isResetHovered ? 'scale(1.05)' : 'scale(1)',
            transition: 'all 0.2s ease',
            boxShadow: isResetHovered ? '0 0 15px rgba(255, 107, 107, 0.5)' : 'none',
          }}
        >
          一键重置
        </button>
      </div>
    </div>
  )
}

function WarningToast() {
  const showWarning = useHunyuanStore((state) => state.showWarning)
  const warningMessage = useHunyuanStore((state) => state.warningMessage)

  return (
    <AnimatePresence>
      {showWarning && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(139, 0, 0, 0.95)',
            border: '2px solid #ff0000',
            borderRadius: '8px',
            padding: '12px 24px',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 'bold',
            zIndex: 100,
            boxShadow: '0 0 30px rgba(255, 0, 0, 0.5)',
            fontFamily: 'SimHei, sans-serif',
          }}
        >
          ⚠ {warningMessage}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function ControlPanel() {
  return (
    <div style={{
      background: 'rgba(11, 14, 46, 0.95)',
      borderLeft: '3px solid #b87333',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 0,
    }}>
      <div style={{
        color: '#ffd700',
        fontSize: '18px',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '2px solid #b87333',
        fontFamily: 'SimHei, sans-serif',
        textShadow: '0 0 10px rgba(255, 215, 0, 0.3)',
      }}>
        司天监控制台
      </div>
      
      <div style={{
        color: '#aaa',
        fontSize: '12px',
        marginBottom: '12px',
        textAlign: 'center',
        fontFamily: 'SimHei, sans-serif',
      }}>
        拖动浑天仪三环调整角度<br/>
        旋转时辰指针控制天球自转
      </div>
      
      <ShichenPointer />
      <CalibrationHistory />
    </div>
  )
}

function Scene3D() {
  return (
    <div style={{ width: '100%', height: '100%', background: '#0b0e2e' }}>
      <Canvas
        camera={{ position: [0, 2, 15], fov: 60 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#0b0e2e']} />
        <fog attach="fog" args={['#0b0e2e', 20, 40]} />
        
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4a4a6a" />
        <directionalLight position={[0, 10, 5]} intensity={0.5} color="#ffd700" />
        
        <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={0.5} />
        
        <StarField />
        <ArmillarySphere />
        
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -8, 0]} receiveShadow>
          <circleGeometry args={[20, 64]} />
          <meshStandardMaterial
            color="#3a3d44"
            roughness={0.9}
            metalness={0.1}
          />
        </mesh>
        
        <OrbitControls
          enablePan={false}
          minDistance={8}
          maxDistance={25}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI * 5 / 6}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  )
}

export default function App() {
  const [isWideLayout, setIsWideLayout] = useState(true)

  useEffect(() => {
    const checkLayout = () => {
      setIsWideLayout(window.innerWidth > 1024)
    }
    checkLayout()
    window.addEventListener('resize', checkLayout)
    return () => window.removeEventListener('resize', checkLayout)
  }, [])

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: isWideLayout ? 'row' : 'column',
      overflow: 'hidden',
      background: '#0b0e2e',
    }}>
      <div style={{
        flex: isWideLayout ? '0 0 75%' : '0 0 60%',
        position: 'relative',
        minWidth: isWideLayout ? 0 : '100%',
        minHeight: isWideLayout ? '100%' : 0,
      }}>
        <Scene3D />
        <AngleDisplay />
        <DeviationDisplay />
        <StarScroll />
        <WarningToast />
      </div>
      
      <div style={{
        flex: isWideLayout ? '1' : '0 0 35%',
        minWidth: isWideLayout ? '280px' : '100%',
        minHeight: isWideLayout ? '100%' : 0,
      }}>
        <ControlPanel />
      </div>
    </div>
  )
}
