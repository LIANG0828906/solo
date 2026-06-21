import { useRef, useMemo, useEffect, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import { getStrata, getFaults, queryGeologyByPosition, type GeologyPoint } from '@/data/geologyData'
import {
  createRaycaster,
  updateRaycaster,
  getFirstIntersection,
  computeMousePosition,
} from '@/utils/raycasterHelper'

interface HighlightPointProps {
  position: [number, number, number]
}

function HighlightPoint({ position }: HighlightPointProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.2
      meshRef.current.scale.setScalar(scale)
    }
    if (glowRef.current) {
      const material = glowRef.current.material as THREE.MeshBasicMaterial
      material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.1
    }
  })

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <pointLight color="#ffffff" intensity={1.5} distance={5} />
    </group>
  )
}

interface StratumLabelProps {
  position: [number, number, number]
  text: string
  color: string
}

function StratumLabel({ position, text, color }: StratumLabelProps) {
  return (
    <Html
      position={position}
      center
      style={{
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          padding: '6px 12px',
          borderRadius: '8px',
          backgroundColor: 'rgba(10, 14, 39, 0.8)',
          backdropFilter: 'blur(8px)',
          color: '#ffffff',
          fontSize: '12px',
          whiteSpace: 'nowrap',
          border: `1px solid ${color}40`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, marginRight: '6px', verticalAlign: 'middle' }} />
        {text}
      </div>
    </Html>
  )
}

interface GeologyModelProps {
  onPointSelected: (point: GeologyPoint | null) => void
  highlightPosition: [number, number, number] | null
  cameraTarget: {
    position: [number, number, number]
    target: [number, number, number]
  } | null
}

function GeologyModel({ onPointSelected, highlightPosition, cameraTarget }: GeologyModelProps) {
  const meshGroupRef = useRef<THREE.Group>(null)
  const { camera, gl, scene } = useThree()
  const controlsRef = useRef<any>(null)
  const raycaster = useMemo(() => createRaycaster(), [])
  const isAnimating = useRef(false)

  const strata = useMemo(() => getStrata(), [])
  const faults = useMemo(() => getFaults(), [])

  const meshes = useMemo(() => {
    const result: THREE.Mesh[] = []
    strata.forEach((stratum) => {
      const geometry = new THREE.BoxGeometry(...stratum.size)
      const material = new THREE.MeshStandardMaterial({
        color: stratum.color,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
        roughness: 0.8,
        metalness: 0.1,
      })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(...stratum.position)
      mesh.userData = { stratumId: stratum.id }
      result.push(mesh)
    })
    return result
  }, [strata])

  useEffect(() => {
    if (!meshGroupRef.current) return
    meshes.forEach((mesh) => {
      meshGroupRef.current?.add(mesh)
    })
    return () => {
      meshes.forEach((mesh) => {
        meshGroupRef.current?.remove(mesh)
        mesh.geometry.dispose()
        ;(mesh.material as THREE.Material).dispose()
      })
    }
  }, [meshes])

  const handlePointerDown = useCallback(
    (event: PointerEvent) => {
      if (isAnimating.current) return

      const mouse = computeMousePosition(event, gl.domElement)
      updateRaycaster(raycaster, mouse, camera)

      const intersection = getFirstIntersection(raycaster, meshes, false)
      if (intersection && intersection.point) {
        const geologyPoint = queryGeologyByPosition({
          x: intersection.point.x,
          y: intersection.point.y,
          z: intersection.point.z,
        })
        onPointSelected(geologyPoint)
      }
    },
    [camera, gl.domElement, meshes, onPointSelected, raycaster]
  )

  useEffect(() => {
    const canvas = gl.domElement
    canvas.addEventListener('pointerdown', handlePointerDown)
    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [gl.domElement, handlePointerDown])

  useEffect(() => {
    if (!cameraTarget || !controlsRef.current) return

    isAnimating.current = true
    const { position, target } = cameraTarget

    const startPos = camera.position.clone()
    const startTarget = controlsRef.current.target.clone()
    const endPos = new THREE.Vector3(...position)
    const endTarget = new THREE.Vector3(...target)

    const duration = 600
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      const t = progress
      const ease = t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2

      camera.position.lerpVectors(startPos, endPos, ease)
      controlsRef.current.target.lerpVectors(startTarget, endTarget, ease)
      controlsRef.current.update()

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        isAnimating.current = false
      }
    }

    requestAnimationFrame(animate)
  }, [cameraTarget, camera])

  return (
    <group ref={meshGroupRef}>
      {strata.map((stratum) => (
        <StratumLabel
          key={`label-${stratum.id}`}
          position={[stratum.position[0] + 6, stratum.position[1], stratum.position[2]] as [number, number, number]}
          text={stratum.name}
          color={stratum.color}
        />
      ))}

      {faults.map((fault) => (
        <line key={fault.id}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={fault.points.length}
              array={new Float32Array(fault.points.flat())}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color={fault.color} linewidth={3} />
        </line>
      ))}

      {highlightPosition && (
        <HighlightPoint position={highlightPosition} />
      )}

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.3}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={8}
        maxDistance={50}
        maxPolarAngle={Math.PI / 2 + 0.2}
      />
    </group>
  )
}

interface GeologyScene3DProps {
  onPointSelected: (point: GeologyPoint | null) => void
  highlightPosition: [number, number, number] | null
  cameraTarget: {
    position: [number, number, number]
    target: [number, number, number]
  } | null
}

export default function GeologyScene3D({
  onPointSelected,
  highlightPosition,
  cameraTarget,
}: GeologyScene3DProps) {
  return (
    <Canvas
      camera={{ position: [15, 10, 15], fov: 60 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: '#0A0E27' }}
      dpr={[1, 2]}
    >
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-10, 5, -10]} intensity={0.3} />

      <gridHelper args={[30, 30, '#2A2E5E', '#1A1E3E']} position={[0, -5, 0]} />

      <GeologyModel
        onPointSelected={onPointSelected}
        highlightPosition={highlightPosition}
        cameraTarget={cameraTarget}
      />
    </Canvas>
  )
}
