import { useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { motion, AnimatePresence } from 'framer-motion'

type Step = {
  id: number
  name: string
  progress: number
}

type Material = {
  id: string
  name: string
  icon: string
  count: number
}

const STEPS: Step[] = [
  { id: 1, name: '选址定基', progress: 0 },
  { id: 2, name: '搭建哈纳', progress: 20 },
  { id: 3, name: '竖立陶脑', progress: 40 },
  { id: 4, name: '连接乌尼', progress: 60 },
  { id: 5, name: '覆盖毡包', progress: 80 },
  { id: 6, name: '装饰完善', progress: 100 },
]

const MATERIALS: Material[] = [
  { id: 'hana', name: '哈纳', icon: '🏗️', count: 12 },
  { id: 'un', name: '乌尼', icon: '🪵', count: 60 },
  { id: 'tono', name: '陶脑', icon: '⭕', count: 1 },
  { id: 'felt', name: '毛毡', icon: '🧶', count: 8 },
  { id: 'rope', name: '鬃绳', icon: '🪢', count: 24 },
]

export default function App() {
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [totalProgress, setTotalProgress] = useState<number>(0)
  const [timeLeft, setTimeLeft] = useState<number>(600)
  const [skyColor, setSkyColor] = useState<string>('#87CEEB')
  const [isDivinationOpen, setIsDivinationOpen] = useState<boolean>(false)
  const [cameraMode, setCameraMode] = useState<'orbit' | 'firstPerson'>('orbit')

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCurrentStep(1)
          setTotalProgress(0)
          return 600
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const step = STEPS.find((s) => s.id === currentStep)
    if (step) {
      setTotalProgress(step.progress)
    }
  }, [currentStep])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const currentStepName = STEPS.find((s) => s.id === currentStep)?.name || ''
  const isUrgent = timeLeft < 60

  const parchmentStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #f5e6d3 0%, #e8d4b8 50%, #d4b896 100%)',
    border: '2px solid #8b7355',
    borderRadius: '8px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.3), inset 0 0 30px rgba(139,115,85,0.2)',
    color: '#3d2914',
    fontFamily: '"Source Han Serif SC", "Noto Serif SC", "SimSun", serif',
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: skyColor }}>
      <Canvas
        shadows
        camera={{ position: [0, 5, 15], fov: 60 }}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#7cb342" />
        </mesh>
      </Canvas>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ ...parchmentStyle, position: 'absolute', top: 20, left: 20, padding: '16px 24px', minWidth: 200 }}
      >
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
          步骤 {currentStep}：{currentStepName}
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#8b4513' }}>
          {totalProgress}%
        </div>
        <div style={{ width: '100%', height: 8, background: '#c4a574', borderRadius: 4, marginTop: 8, overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${totalProgress}%` }}
            transition={{ duration: 0.5 }}
            style={{ height: '100%', background: 'linear-gradient(90deg, #8b4513, #cd853f)' }}
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          ...parchmentStyle,
          position: 'absolute',
          top: 20,
          right: 20,
          padding: '16px 28px',
          minWidth: 140,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 14, marginBottom: 4 }}>剩余时间</div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: isUrgent ? '#c62828' : '#8b4513',
            fontFamily: '"Source Han Serif SC", monospace',
          }}
        >
          {formatTime(timeLeft)}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)' }}
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsDivinationOpen(!isDivinationOpen)}
          style={{
            ...parchmentStyle,
            width: 70,
            height: 70,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
          }}
        >
          🔮
        </motion.button>
        <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: '#3d2914', textShadow: '1px 1px 2px rgba(255,255,255,0.8)' }}>
          宝力格
        </div>
      </motion.div>

      <AnimatePresence>
        {isDivinationOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -20 }}
            style={{
              ...parchmentStyle,
              position: 'absolute',
              left: 100,
              top: '50%',
              transform: 'translateY(-50%)',
              padding: 24,
              minWidth: 220,
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, textAlign: 'center' }}>
              占卜面板
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.8, textAlign: 'center' }}>
              今日吉时：<span style={{ color: '#8b4513', fontWeight: 600 }}>巳时</span>
              <br />
              方位：<span style={{ color: '#8b4513', fontWeight: 600 }}>东南</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          ...parchmentStyle,
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '16px 24px',
          display: 'flex',
          gap: 16,
        }}
      >
        {MATERIALS.map((material, index) => (
          <motion.div
            key={material.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            whileHover={{ scale: 1.05, y: -4 }}
            style={{
              background: 'linear-gradient(180deg, #faf0e0 0%, #e8d4b8 100%)',
              border: '1px solid #8b7355',
              borderRadius: 8,
              padding: '12px 16px',
              minWidth: 80,
              textAlign: 'center',
              cursor: 'grab',
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 4 }}>{material.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{material.name}</div>
            <div style={{ fontSize: 12, color: '#8b4513', marginTop: 2 }}>×{material.count}</div>
          </motion.div>
        ))}
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setCameraMode(cameraMode === 'orbit' ? 'firstPerson' : 'orbit')}
        style={{
          ...parchmentStyle,
          position: 'absolute',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '10px 20px',
          fontSize: 14,
        }}
      >
        🎥 {cameraMode === 'orbit' ? '环绕视角' : '第一视角'}
      </motion.button>
    </div>
  )
}
