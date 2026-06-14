import { useRef, useEffect, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { useStore } from '@/store/useStore'

const MOVE_SPEED = 25
const DAMPING = 0.92
const ROTATION_SPEED = 0.003
const BOUNDS = { min: -200, max: 200, minY: -120, maxY: -5 }

interface KeyState {
  w: boolean
  a: boolean
  s: boolean
  d: boolean
  q: boolean
  e: boolean
}

export default function ObservationChamber() {
  const { camera, gl } = useThree()
  const setChamberPosition = useStore((s) => s.actions.setChamberPosition)
  const setChamberVelocity = useStore((s) => s.actions.setChamberVelocity)
  const setChamberRotation = useStore((s) => s.actions.setChamberRotation)
  const setDepth = useStore((s) => s.actions.setDepth)

  const velocity = useRef(new Vector3(0, 0, 0))
  const keys = useRef<KeyState>({ w: false, a: false, s: false, d: false, q: false, e: false })
  const isDragging = useRef(false)
  const lastMousePos = useRef({ x: 0, y: 0 })
  const euler = useRef({ x: 0, y: 0 })
  const position = useRef(new Vector3(0, -20, 0))

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const key = e.key.toLowerCase()
    if (key in keys.current) {
      keys.current[key as keyof KeyState] = true
    }
  }, [])

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const key = e.key.toLowerCase()
    if (key in keys.current) {
      keys.current[key as keyof KeyState] = false
    }
  }, [])

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (e.button === 0) {
      isDragging.current = true
      lastMousePos.current = { x: e.clientX, y: e.clientY }
    }
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return
    const dx = e.clientX - lastMousePos.current.x
    const dy = e.clientY - lastMousePos.current.y
    euler.current.y -= dx * ROTATION_SPEED
    euler.current.x -= dy * ROTATION_SPEED
    euler.current.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, euler.current.x))
    lastMousePos.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
  }, [])

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    velocity.current.y -= e.deltaY * 0.002
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    const canvas = gl.domElement
    canvas.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      canvas.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('wheel', handleWheel)
    }
  }, [handleKeyDown, handleKeyUp, handleMouseDown, handleMouseMove, handleMouseUp, handleWheel, gl])

  useFrame((_, delta) => {
    const forward = new Vector3(
      -Math.sin(euler.current.y) * Math.cos(euler.current.x),
      Math.sin(euler.current.x),
      -Math.cos(euler.current.y) * Math.cos(euler.current.x)
    )
    const right = new Vector3().crossVectors(forward, new Vector3(0, 1, 0)).normalize()

    const moveDir = new Vector3(0, 0, 0)
    if (keys.current.w) moveDir.add(forward)
    if (keys.current.s) moveDir.sub(forward)
    if (keys.current.d) moveDir.add(right)
    if (keys.current.a) moveDir.sub(right)
    if (keys.current.e) moveDir.y += 1
    if (keys.current.q) moveDir.y -= 1

    if (moveDir.length() > 0) moveDir.normalize()

    velocity.current.addScaledVector(moveDir, MOVE_SPEED * delta)
    velocity.current.multiplyScalar(DAMPING)

    position.current.addScaledVector(velocity.current, delta)
    position.current.x = Math.max(BOUNDS.min, Math.min(BOUNDS.max, position.current.x))
    position.current.y = Math.max(BOUNDS.minY, Math.min(BOUNDS.maxY, position.current.y))
    position.current.z = Math.max(BOUNDS.min, Math.min(BOUNDS.max, position.current.z))

    const lookTarget = position.current.clone().add(forward)

    camera.position.copy(position.current)
    camera.lookAt(lookTarget)

    const depth = Math.max(0, -position.current.y)
    setDepth(depth)
    setChamberPosition([position.current.x, position.current.y, position.current.z])
    setChamberVelocity([velocity.current.x, velocity.current.y, velocity.current.z])
    setChamberRotation([euler.current.x, euler.current.y])
  })

  return (
    <mesh position={position.current}>
      <sphereGeometry args={[3, 48, 48]} />
      <meshPhysicalMaterial
        transparent
        opacity={0.08}
        transmission={0.95}
        thickness={0.5}
        roughness={0.1}
        metalness={0.1}
        color="#88ddff"
        emissive="#113355"
        emissiveIntensity={0.3}
      />
      <mesh>
        <sphereGeometry args={[3.02, 48, 48]} />
        <meshBasicMaterial
          color="#4dd0e1"
          wireframe
          transparent
          opacity={0.1}
        />
      </mesh>
    </mesh>
  )
}
