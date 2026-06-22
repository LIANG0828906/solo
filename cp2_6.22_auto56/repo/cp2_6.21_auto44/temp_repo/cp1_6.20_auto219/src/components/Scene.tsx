import { useRef, useMemo, useState, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Grid, Html } from '@react-three/drei'
import * as THREE from 'three'
import { useSceneStore, GeometryObject, GeometryType, MaterialType } from '@/store/SceneStore'

const MATERIAL_CONFIGS: Record<MaterialType, { color: string; metalness: number; roughness: number; transparent: boolean; opacity: number; envMapIntensity: number }> = {
  metal: { color: '#b0b0b0', metalness: 0.9, roughness: 0.15, transparent: false, opacity: 1, envMapIntensity: 1.5 },
  glass: { color: '#88ccff', metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.4, envMapIntensity: 2.0 },
  matte: { color: '#888888', metalness: 0.0, roughness: 0.8, transparent: false, opacity: 1, envMapIntensity: 0.3 },
}

function GeometryMesh({ geo, isSelected }: { geo: GeometryObject; isSelected: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { selectGeometry, updateGeometry } = useSceneStore()
  const [hovered, setHovered] = useState(false)
  const dragRef = useRef<{ isDragging: boolean; isRotating: boolean; start: THREE.Vector3 | null; startRotY: number }>({
    isDragging: false,
    isRotating: false,
    start: null,
    startRotY: 0,
  })
  const [scaleLabel, setScaleLabel] = useState<{ visible: boolean; value: string }>({ visible: false, value: '1.0x' })
  const velocityRef = useRef({ x: 0, z: 0 })

  const matConfig = useMemo(() => MATERIAL_CONFIGS[geo.material], [geo.material])

  const handlePointerDown = useCallback((e: THREE.Event) => {
    const event = e as unknown as { stopPropagation: () => void; shiftKey: boolean; point: THREE.Vector3; nativeEvent: MouseEvent }
    event.stopPropagation()
    selectGeometry(geo.id)

    if (event.nativeEvent?.shiftKey) {
      dragRef.current = { isDragging: false, isRotating: true, start: event.point.clone(), startRotY: geo.rotY }
    } else {
      dragRef.current = { isDragging: true, isRotating: false, start: event.point.clone(), startRotY: geo.rotY }
    }
  }, [geo.id, geo.rotY, selectGeometry])

  const handlePointerMove = useCallback((e: THREE.Event) => {
    const event = e as unknown as { stopPropagation: () => void; point: THREE.Vector3 }
    if (!dragRef.current.start) return
    event.stopPropagation()

    if (dragRef.current.isDragging) {
      const delta = event.point.clone().sub(dragRef.current.start)
      const newX = Math.round((geo.posX + delta.x) * 2) / 2
      const newZ = Math.round((geo.posZ + delta.z) * 2) / 2
      velocityRef.current = { x: delta.x * 0.1, z: delta.z * 0.1 }
      updateGeometry(geo.id, { posX: newX, posZ: newZ })
    } else if (dragRef.current.isRotating) {
      const delta = event.point.x - dragRef.current.start.x
      const newRotY = dragRef.current.startRotY + delta * 0.5
      updateGeometry(geo.id, { rotY: newRotY })
    }
  }, [geo.id, geo.posX, geo.posZ, updateGeometry])

  const handlePointerUp = useCallback(() => {
    dragRef.current = { isDragging: false, isRotating: false, start: null, startRotY: 0 }
  }, [])

  const handleWheel = useCallback((e: THREE.Event) => {
    const event = e as unknown as { stopPropagation: () => void; deltaY: number }
    event.stopPropagation()
    const scaleFactor = event.deltaY > 0 ? 0.95 : 1.05
    const newScale = Math.max(0.2, Math.min(5, geo.scale * scaleFactor))
    updateGeometry(geo.id, { scale: Math.round(newScale * 100) / 100 })
    setScaleLabel({ visible: true, value: `${newScale.toFixed(1)}x` })
    setTimeout(() => setScaleLabel((prev) => ({ ...prev, visible: false })), 1200)
  }, [geo.id, geo.scale, updateGeometry])

  useFrame((_, delta) => {
    if (!meshRef.current) return
    const currentMat = meshRef.current.material as THREE.MeshStandardMaterial
    if (currentMat.opacity !== undefined) {
      const targetOpacity = geo.opacity * (matConfig.transparent ? matConfig.opacity : 1)
      currentMat.opacity = THREE.MathUtils.lerp(currentMat.opacity, targetOpacity, delta * 4)
    }

    if (isSelected) {
      const pulse = Math.sin(Date.now() * 0.003) * 0.15 + 0.85
      meshRef.current.scale.setScalar(geo.scale * pulse)
    } else {
      meshRef.current.scale.lerp(new THREE.Vector3(geo.scale, geo.scale, geo.scale), delta * 8)
    }

    velocityRef.current.x *= 0.92
    velocityRef.current.z *= 0.92
  })

  const geometry = useMemo(() => {
    switch (geo.type) {
      case 'cube': return <boxGeometry args={[1, 1, 1]} />
      case 'sphere': return <sphereGeometry args={[0.5, 32, 32]} />
      case 'cone': return <coneGeometry args={[0.5, 1, 32]} />
      case 'torus': return <torusGeometry args={[0.4, 0.15, 16, 48]} />
    }
  }, [geo.type])

  return (
    <group position={[geo.posX, geo.posY, geo.posZ]} rotation={[geo.rotX, geo.rotY, geo.rotZ]}>
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerOver={() => { setHovered(true); document.body.style.cursor = 'grab' }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto' }}
        onWheel={handleWheel}
      >
        {geometry}
        <meshStandardMaterial
          color={matConfig.color}
          metalness={matConfig.metalness}
          roughness={matConfig.roughness}
          transparent={true}
          opacity={matConfig.transparent ? matConfig.opacity : geo.opacity}
          envMapIntensity={matConfig.envMapIntensity}
        />
      </mesh>

      {isSelected && (
        <mesh>
          <boxGeometry args={[1.05, 1.05, 1.05]} />
          <meshBasicMaterial color="#00bfff" wireframe transparent opacity={0.3} />
        </mesh>
      )}

      {isSelected && dragRef.current.isRotating && (
        <group>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.8, 0.01, 8, 64]} />
            <meshBasicMaterial color="#00bfff" transparent opacity={0.5} />
          </mesh>
        </group>
      )}

      {scaleLabel.visible && (
        <Html center position={[0, -0.7, 0]} style={{ pointerEvents: 'none' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: '#fff',
            background: 'rgba(0,0,0,0.7)',
            padding: '2px 8px',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
          }}>
            {scaleLabel.value}
          </div>
        </Html>
      )}
    </group>
  )
}

function Lights() {
  const { lightParams } = useSceneStore()
  const mainLightRef = useRef<THREE.DirectionalLight>(null)

  const mainLightPos = useMemo(() => {
    const angle = (lightParams.mainLightAngle * Math.PI) / 180
    const dist = 8
    return new THREE.Vector3(Math.cos(angle) * dist, 6, Math.sin(angle) * dist)
  }, [lightParams.mainLightAngle])

  useFrame(() => {
    if (mainLightRef.current) {
      mainLightRef.current.position.copy(mainLightPos)
    }
  })

  return (
    <>
      <ambientLight intensity={lightParams.ambientIntensity} color="#404060" />
      <directionalLight
        ref={mainLightRef}
        position={mainLightPos}
        intensity={lightParams.mainLightIntensity}
        color="#ffd700"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={30}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.001}
      />
      <directionalLight
        position={[-5, 4, -3]}
        intensity={lightParams.fillLightIntensity}
        color="#4169e1"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
    </>
  )
}

function FPSCounter() {
  const fpsRef = useRef<HTMLSpanElement>(null)
  const frames = useRef(0)
  const lastTime = useRef(performance.now())

  useFrame(() => {
    frames.current++
    const now = performance.now()
    if (now - lastTime.current >= 1000) {
      if (fpsRef.current) {
        fpsRef.current.textContent = `${frames.current} FPS`
      }
      frames.current = 0
      lastTime.current = now
    }
  })

  return (
    <Html fullscreen style={{ pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute',
        bottom: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        fontFamily: 'var(--font-mono)',
        fontSize: '12px',
        color: '#ffffff',
        opacity: 0.6,
      }}>
        <span ref={fpsRef}>0 FPS</span>
      </div>
    </Html>
  )
}

function SceneContent({ onPointerMissed }: { onPointerMissed: () => void }) {
  const { geometries, selectedId } = useSceneStore()

  return (
    <>
      <color attach="background" args={['#1a1a2e']} />
      <fog attach="fog" args={['#1a1a2e', 15, 35]} />

      <Lights />

      <Grid
        infiniteGrid
        cellSize={1}
        cellThickness={0.5}
        cellColor="#333333"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#444444"
        fadeDistance={25}
        fadeStrength={1}
        position={[0, 0, 0]}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <shadowMaterial transparent opacity={0.3} />
      </mesh>

      {geometries.map((geo) => (
        <GeometryMesh
          key={geo.id}
          geo={geo}
          isSelected={selectedId === geo.id}
        />
      ))}

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={2}
        maxDistance={25}
        maxPolarAngle={Math.PI / 2 - 0.05}
      />

      <FPSCounter />
    </>
  )
}

export default function Scene() {
  const { addGeometry } = useSceneStore()

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/geometry')) as { type: GeometryType; material: MaterialType }
      addGeometry(data.type, data.material)
    } catch { /* ignore invalid drop data */ }
  }, [addGeometry])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const handlePointerMissed = useCallback(() => {
    useSceneStore.getState().selectGeometry(null)
  }, [])

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      style={{ flex: 1, height: '100%', position: 'relative' }}
    >
      <Canvas
        shadows
        camera={{ position: [6, 5, 6], fov: 50, near: 0.1, far: 100 }}
        onPointerMissed={handlePointerMissed}
        style={{ width: '100%', height: '100%' }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
      >
        <SceneContent onPointerMissed={handlePointerMissed} />
      </Canvas>
    </div>
  )
}
