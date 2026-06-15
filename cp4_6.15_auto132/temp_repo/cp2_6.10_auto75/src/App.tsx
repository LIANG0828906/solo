import { useState, useRef, useEffect, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { Waterfall } from './Waterfall'
import { Rocks } from './Rocks'
import { useWaterfallStore } from './store'

function FlowSlider() {
  const flowRate = useWaterfallStore(state => state.flowRate)
  const setFlowRate = useWaterfallStore(state => state.setFlowRate)

  const [isDragging, setIsDragging] = useState(false)
  const lastPos = useRef(0)
  const velocity = useRef(0)
  const animationRef = useRef<number | null>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    lastPos.current = e.clientX
    velocity.current = 0
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return
    const delta = e.clientX - lastPos.current
    velocity.current = delta
    lastPos.current = e.clientX
    setFlowRate(flowRate + delta * 0.5)
  }, [isDragging, flowRate, setFlowRate])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    const startTime = performance.now()
    const startVel = velocity.current
    const startVal = flowRate

    const animate = () => {
      const t = (performance.now() - startTime) / 200
      if (t < 1) {
        const inertia = startVel * (1 - t) * 0.3
        setFlowRate(startVal + inertia * (1 - t))
        animationRef.current = requestAnimationFrame(animate)
      }
    }
    animationRef.current = requestAnimationFrame(animate)
  }, [flowRate, setFlowRate])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <div className="control-group">
      <span className="control-label">瀑布流量</span>
      <div className="slider-container">
        <input
          type="range"
          min="0"
          max="100"
          value={flowRate}
          onChange={(e) => setFlowRate(Number(e.target.value))}
          onMouseDown={handleMouseDown}
        />
      </div>
      <span className="control-value">{Math.round(flowRate)}%</span>
    </div>
  )
}

function WindDial() {
  const windDirection = useWaterfallStore(state => state.windDirection)
  const setWindDirection = useWaterfallStore(state => state.setWindDirection)

  const dialRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const calculateAngle = useCallback((clientX: number, clientY: number) => {
    if (!dialRef.current) return windDirection
    const rect = dialRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const angle = Math.atan2(clientY - centerY, clientX - centerX)
    const degrees = ((angle * 180 / Math.PI) + 360) % 360
    return degrees
  }, [windDirection])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    setWindDirection(calculateAngle(e.clientX, e.clientY))
  }, [calculateAngle, setWindDirection])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return
    setWindDirection(calculateAngle(e.clientX, e.clientY))
  }, [isDragging, calculateAngle, setWindDirection])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <div className="control-group">
      <span className="control-label">风向</span>
      <div
        ref={dialRef}
        className="dial-container"
        onMouseDown={handleMouseDown}
      >
        <div className="dial-bg" />
        <div className="dial-marks" />
        <div
          className="dial-pointer"
          style={{ transform: `translate(-50%, -100%) rotate(${windDirection}deg)` }}
        />
        <div className="dial-center" />
      </div>
      <span className="control-value">{Math.round(windDirection)}°</span>
    </div>
  )
}

function RoughnessSlider() {
  const rockRoughness = useWaterfallStore(state => state.rockRoughness)
  const setRockRoughness = useWaterfallStore(state => state.setRockRoughness)

  const [isDragging, setIsDragging] = useState(false)
  const lastPos = useRef(0)
  const velocity = useRef(0)
  const animationRef = useRef<number | null>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    lastPos.current = e.clientX
    velocity.current = 0
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return
    const delta = e.clientX - lastPos.current
    velocity.current = delta
    lastPos.current = e.clientX
    setRockRoughness(rockRoughness + delta * 0.5)
  }, [isDragging, rockRoughness, setRockRoughness])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    const startTime = performance.now()
    const startVel = velocity.current
    const startVal = rockRoughness

    const animate = () => {
      const t = (performance.now() - startTime) / 200
      if (t < 1) {
        const inertia = startVel * (1 - t) * 0.3
        setRockRoughness(startVal + inertia * (1 - t))
        animationRef.current = requestAnimationFrame(animate)
      }
    }
    animationRef.current = requestAnimationFrame(animate)
  }, [rockRoughness, setRockRoughness])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <div className="control-group">
      <span className="control-label">岩石凸起</span>
      <div className="slider-container">
        <input
          type="range"
          min="0"
          max="100"
          value={rockRoughness}
          onChange={(e) => setRockRoughness(Number(e.target.value))}
          onMouseDown={handleMouseDown}
        />
      </div>
      <span className="control-value">{Math.round(rockRoughness)}%</span>
    </div>
  )
}

export default function App() {
  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <div className="xuan-paper" />
      <div className="mountains" />
      <div className="cliff" />
      <div className="pool" />
      <div className="title">水图·瀑布</div>

      <div className="canvas-container">
        <Canvas
          orthographic
          camera={{
            position: [0, 0, 10],
            zoom: 80,
            near: 0.1,
            far: 1000
          }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
          }}
          dpr={[1, 2]}
        >
          <ambientLight intensity={0.6} color="#fff5e6" />
          <directionalLight
            position={[-5, 5, 5]}
            intensity={0.8}
            color="#ffffff"
            castShadow
          />
          <fog attach="fog" args={['#f5f0e8', 5, 20]} />

          <Waterfall />
          <Rocks />
        </Canvas>
      </div>

      <div className="control-panel">
        <FlowSlider />
        <WindDial />
        <RoughnessSlider />
      </div>
    </div>
  )
}
