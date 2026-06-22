import { useRef, useEffect, useState, useCallback } from 'react'
import { useThree, useFrame, ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import {
  useFlowStore,
  GravityDirection,
  WindDirection,
  SpecialEffect,
} from '@/store/flowStore'

const GRAVITY_CYCLE: GravityDirection[] = ['down', 'up', 'none']
const WIND_CYCLE: WindDirection[] = ['left', 'right', 'random', 'none']

const GRAVITY_LABELS: Record<GravityDirection, string> = {
  down: '向下',
  up: '向上',
  none: '无',
}

const WIND_LABELS: Record<WindDirection, string> = {
  left: '向左',
  right: '向右',
  random: '随机',
  none: '无',
}

const HUD_FADE_DELAY = 5000
const HUD_UPDATE_INTERVAL = 1000

const ClickBurst = ({
  position,
  startTime,
}: {
  position: THREE.Vector3
  startTime: number
}) => {
  const spriteRef = useRef<THREE.Sprite>(null)
  const materialRef = useRef<THREE.SpriteMaterial | null>(null)

  const material = new THREE.SpriteMaterial({
    color: 0xffd700,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })

  useFrame(() => {
    const elapsed = performance.now() - startTime
    const progress = Math.min(elapsed / 1000, 1)
    const scale = 0.5 + progress * 4
    const opacity = 1 - progress

    if (spriteRef.current) {
      spriteRef.current.scale.set(scale, scale, scale)
    }
    if (materialRef.current) {
      materialRef.current.opacity = opacity
    }
  })

  useEffect(() => {
    materialRef.current = material
    return () => {
      material.dispose()
    }
  }, [material])

  return (
    <sprite
      ref={spriteRef}
      position={[position.x, position.y, position.z]}
      material={material}
      scale={[0.5, 0.5, 0.5]}
    />
  )
}

const UserControls = () => {
  const { camera, gl, scene, raycaster, pointer } = useThree()

  const {
    gravity,
    wind,
    specialEffect,
    particles,
    setGravity,
    setWind,
    setClickPosition,
    addClickParticles,
    triggerEffect,
    clearEffect,
  } = useFlowStore()

  const [hudVisible, setHudVisible] = useState(true)
  const [tipVisible, setTipVisible] = useState(false)
  const [tipText, setTipText] = useState('')
  const [fps, setFps] = useState(60)
  const [particleCount, setParticleCount] = useState(particles.length)

  const lastFpsUpdateRef = useRef(performance.now())
  const frameCountRef = useRef(0)
  const lastActivityRef = useRef(performance.now())
  const isDraggingRef = useRef(false)
  const previousMouseRef = useRef({ x: 0, y: 0 })
  const cameraDistanceRef = useRef(30)
  const cameraThetaRef = useRef(0)
  const cameraPhiRef = useRef(Math.PI / 3)
  const clickBurstsRef = useRef<
    { id: number; position: THREE.Vector3; startTime: number }[]
  >([])
  const burstIdRef = useRef(0)

  const showTip = useCallback((text: string, duration = 1500) => {
    setTipText(text)
    setTipVisible(true)
    setTimeout(() => setTipVisible(false), duration)
  }, [])

  const markActivity = useCallback(() => {
    lastActivityRef.current = performance.now()
    setHudVisible(true)
  }, [])

  useEffect(() => {
    camera.position.set(0, 0, 30)
    camera.lookAt(0, 0, 0)
  }, [camera])

  useEffect(() => {
    const interval = setInterval(() => {
      setParticleCount(particles.length)
    }, HUD_UPDATE_INTERVAL)
    return () => clearInterval(interval)
  }, [particles.length])

  useEffect(() => {
    const checkHudFade = setInterval(() => {
      const elapsed = performance.now() - lastActivityRef.current
      if (elapsed > HUD_FADE_DELAY && hudVisible) {
        setHudVisible(false)
      }
    }, 1000)
    return () => clearInterval(checkHudFade)
  }, [hudVisible])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      markActivity()
      switch (e.key.toLowerCase()) {
        case 'g': {
          const currentIndex = GRAVITY_CYCLE.indexOf(gravity)
          const nextIndex = (currentIndex + 1) % GRAVITY_CYCLE.length
          const nextGravity = GRAVITY_CYCLE[nextIndex]
          setGravity(nextGravity)
          showTip(`重力: ${GRAVITY_LABELS[nextGravity]}`)
          break
        }
        case 'w': {
          const currentIndex = WIND_CYCLE.indexOf(wind)
          const nextIndex = (currentIndex + 1) % WIND_CYCLE.length
          const nextWind = WIND_CYCLE[nextIndex]
          setWind(nextWind)
          showTip(`风向: ${WIND_LABELS[nextWind]}`)
          break
        }
        case '1': {
          if (specialEffect !== 'smoke') {
            triggerEffect('smoke')
            showTip('烟雾特效!')
            setTimeout(() => clearEffect(), 4000)
          }
          break
        }
        case '2': {
          if (specialEffect !== 'spark') {
            triggerEffect('spark')
            showTip('火花特效!')
            setTimeout(() => clearEffect(), 2000)
          }
          break
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    gravity,
    wind,
    specialEffect,
    setGravity,
    setWind,
    triggerEffect,
    clearEffect,
    markActivity,
    showTip,
  ])

  const handlePointerDown = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      markActivity()
      const e = event.nativeEvent

      if (e.button === 2) {
        isDraggingRef.current = true
        previousMouseRef.current = { x: e.clientX, y: e.clientY }
      } else if (e.button === 0) {
        raycaster.setFromCamera(pointer, camera)
        const direction = raycaster.ray.direction.clone()
        const origin = raycaster.ray.origin.clone()
        const distance = 20
        const clickPoint = origin.add(direction.multiplyScalar(distance))

        setClickPosition(clickPoint.clone())
        addClickParticles(clickPoint, 50)

        const burstId = burstIdRef.current++
        clickBurstsRef.current.push({
          id: burstId,
          position: clickPoint.clone(),
          startTime: performance.now(),
        })
        setTimeout(() => {
          clickBurstsRef.current = clickBurstsRef.current.filter(
            (b) => b.id !== burstId
          )
        }, 1000)

        setTimeout(() => setClickPosition(null), 100)
      }
    },
    [
      camera,
      raycaster,
      pointer,
      setClickPosition,
      addClickParticles,
      markActivity,
    ]
  )

  const handlePointerMove = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      markActivity()
      const e = event.nativeEvent

      if (isDraggingRef.current) {
        const deltaX = e.clientX - previousMouseRef.current.x
        const deltaY = e.clientY - previousMouseRef.current.y

        cameraThetaRef.current -= deltaX * 0.005
        cameraPhiRef.current -= deltaY * 0.005

        cameraPhiRef.current = Math.max(0.1, Math.min(Math.PI - 0.1, cameraPhiRef.current))

        previousMouseRef.current = { x: e.clientX, y: e.clientY }
      }
    },
    [markActivity]
  )

  const handlePointerUp = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      if (event.nativeEvent.button === 2) {
        isDraggingRef.current = false
      }
    },
    []
  )

  const handleWheel = useCallback(
    (event: ThreeEvent<WheelEvent>) => {
      markActivity()
      const e = event.nativeEvent
      e.preventDefault()
      const zoomSpeed = 0.01
      cameraDistanceRef.current += e.deltaY * zoomSpeed
      cameraDistanceRef.current = Math.max(5, Math.min(100, cameraDistanceRef.current))
    },
    [markActivity]
  )

  const handleContextMenu = useCallback((event: ThreeEvent<MouseEvent>) => {
    event.nativeEvent.preventDefault()
  }, [])

  useFrame(() => {
    frameCountRef.current++
    const now = performance.now()
    if (now - lastFpsUpdateRef.current >= HUD_UPDATE_INTERVAL) {
      const elapsed = (now - lastFpsUpdateRef.current) / 1000
      const currentFps = Math.round(frameCountRef.current / elapsed)
      setFps(currentFps)
      frameCountRef.current = 0
      lastFpsUpdateRef.current = now
    }

    const targetX =
      cameraDistanceRef.current *
      Math.sin(cameraPhiRef.current) *
      Math.cos(cameraThetaRef.current)
    const targetY =
      cameraDistanceRef.current * Math.cos(cameraPhiRef.current)
    const targetZ =
      cameraDistanceRef.current *
      Math.sin(cameraPhiRef.current) *
      Math.sin(cameraThetaRef.current)

    camera.position.x += (targetX - camera.position.x) * 0.1
    camera.position.y += (targetY - camera.position.y) * 0.1
    camera.position.z += (targetZ - camera.position.z) * 0.1
    camera.lookAt(0, 0, 0)
  })

  const vignetteClass =
    specialEffect === 'smoke'
      ? 'vignette-effect active smoke'
      : specialEffect === 'spark'
      ? 'vignette-effect active spark'
      : 'vignette-effect'

  return (
    <>
      <mesh
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
        visible={false}
      >
        <sphereGeometry args={[100, 32, 32]} />
        <meshBasicMaterial side={THREE.BackSide} />
      </mesh>

      {clickBurstsRef.current.map((burst) => (
        <ClickBurst
          key={burst.id}
          position={burst.position}
          startTime={burst.startTime}
        />
      ))}

      <div className={`hud-panel ${hudVisible ? '' : 'hidden'}`}>
        <div className="hud-item">
          <span className="hud-label">粒子数:</span>
          <span className="hud-value">{particleCount}</span>
        </div>
        <div className="hud-item">
          <span className="hud-label">重力:</span>
          <span className="hud-value">{GRAVITY_LABELS[gravity]}</span>
        </div>
        <div className="hud-item">
          <span className="hud-label">风向:</span>
          <span className="hud-value">{WIND_LABELS[wind]}</span>
        </div>
        <div className="hud-item">
          <span className="hud-label">FPS:</span>
          <span className="hud-value hud-fps">{fps}</span>
        </div>
      </div>

      <div className={`hud-tip ${tipVisible ? 'visible' : ''}`}>{tipText}</div>

      <div className={vignetteClass} />
    </>
  )
}

export default UserControls
