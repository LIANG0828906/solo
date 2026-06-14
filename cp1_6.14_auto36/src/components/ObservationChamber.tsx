import { useRef, useEffect, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '@/store/useStore'

const MOVE_ACCEL = 60
const DAMPING = 0.92
const MOUSE_SENSITIVITY = 0.0025
const ROTATION_DAMPING = 0.9
const BOUNDS = { min: -200, max: 200, minY: -120, maxY: -5 }
const MAX_SPEED = 40

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

  const velocity = useRef(new THREE.Vector3(0, 0, 0))
  const keys = useRef<KeyState>({ w: false, a: false, s: false, d: false, q: false, e: false })
  const isDragging = useRef(false)
  const lastMousePos = useRef({ x: 0, y: 0 })
  const angularVelocity = useRef({ x: 0, y: 0 })
  const euler = useRef({ x: 0, y: 0 })
  const position = useRef(new THREE.Vector3(0, -20, 0))
  const targetLook = useRef(new THREE.Vector3(0, -20, -1))
  const up = useRef(new THREE.Vector3(0, 1, 0))

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

    angularVelocity.current.y = -dx * MOUSE_SENSITIVITY
    angularVelocity.current.x = -dy * MOUSE_SENSITIVITY

    euler.current.y += angularVelocity.current.y
    euler.current.x += angularVelocity.current.x
    euler.current.x = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, euler.current.x))

    lastMousePos.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
  }, [])

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    velocity.current.y -= e.deltaY * 0.003
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    const canvas = gl.domElement
    canvas.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    canvas.style.touchAction = 'none'
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
    angularVelocity.current.x *= ROTATION_DAMPING
    angularVelocity.current.y *= ROTATION_DAMPING

    if (!isDragging.current && (Math.abs(angularVelocity.current.x) > 0.0001 || Math.abs(angularVelocity.current.y) > 0.0001)) {
      euler.current.y += angularVelocity.current.y
      euler.current.x += angularVelocity.current.x
      euler.current.x = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, euler.current.x))
    }

    const sinY = Math.sin(euler.current.y)
    const cosY = Math.cos(euler.current.y)
    const sinX = Math.sin(euler.current.x)
    const cosX = Math.cos(euler.current.x)

    const forward = new THREE.Vector3(-sinY * cosX, sinX, -cosY * cosX)
    const right = new THREE.Vector3(cosY, 0, -sinY)
    const worldUp = new THREE.Vector3(0, 1, 0)

    const moveDir = new THREE.Vector3(0, 0, 0)
    if (keys.current.w) moveDir.add(forward)
    if (keys.current.s) moveDir.sub(forward)
    if (keys.current.d) moveDir.add(right)
    if (keys.current.a) moveDir.sub(right)
    if (keys.current.e) moveDir.add(worldUp)
    if (keys.current.q) moveDir.sub(worldUp)

    if (moveDir.lengthSq() > 0.0001) {
      moveDir.normalize()
      velocity.current.addScaledVector(moveDir, MOVE_ACCEL * delta)
    }

    const speed = velocity.current.length()
    if (speed > MAX_SPEED) {
      velocity.current.multiplyScalar(MAX_SPEED / speed)
    }

    velocity.current.multiplyScalar(DAMPING)

    position.current.addScaledVector(velocity.current, delta)
    position.current.x = Math.max(BOUNDS.min, Math.min(BOUNDS.max, position.current.x))
    position.current.y = Math.max(BOUNDS.minY, Math.min(BOUNDS.maxY, position.current.y))
    position.current.z = Math.max(BOUNDS.min, Math.min(BOUNDS.max, position.current.z))

    targetLook.current.copy(position.current).add(forward)

    camera.position.lerp(position.current, 0.15)
    camera.up.copy(up.current)
    camera.lookAt(targetLook.current)

    const depth = Math.max(0, -position.current.y)
    setDepth(depth)
    setChamberPosition([position.current.x, position.current.y, position.current.z])
    setChamberVelocity([velocity.current.x, velocity.current.y, velocity.current.z])
    setChamberRotation([euler.current.x, euler.current.y])
  })

  return (
    <mesh position={position.current} raycast={() => null}>
      <sphereGeometry args={[3, 48, 48]} />
      <meshPhysicalMaterial
        transparent
        opacity={0.06}
        transmission={0.97}
        thickness={0.5}
        roughness={0.05}
        metalness={0.05}
        color="#88ddff"
        emissive="#113355"
        emissiveIntensity={0.2}
      />
      <mesh raycast={() => null}>
        <sphereGeometry args={[3.02, 48, 48]} />
        <meshBasicMaterial
          color="#4dd0e1"
          wireframe
          transparent
          opacity={0.08}
        />
      </mesh>
    </mesh>
  )
}
