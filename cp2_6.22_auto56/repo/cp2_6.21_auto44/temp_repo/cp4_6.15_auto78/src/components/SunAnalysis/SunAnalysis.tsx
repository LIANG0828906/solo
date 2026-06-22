import { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import { useSimStore, BuildingType } from '@/store/useSimStore'
import { calculateSolarPosition, radToDeg, SolarResult } from '@/utils/solarCalculator'
import './SunAnalysis.css'

interface BuildingProps {
  type: BuildingType
  sunDirection: THREE.Vector3
}

function BuildingMesh({ type, sunDirection }: BuildingProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [scaleY, setScaleY] = useState(0)
  const animRef = useRef({ target: 1, current: 0 })
  const prevType = useRef(type)

  useEffect(() => {
    if (prevType.current !== type) {
      animRef.current.target = 1
      animRef.current.current = 0
      setScaleY(0)
      prevType.current = type
    }
  }, [type])

  useFrame((_, delta) => {
    if (animRef.current.current < animRef.current.target) {
      animRef.current.current = Math.min(
        animRef.current.current + delta / 0.8,
        animRef.current.target,
      )
      const t = animRef.current.current
      const eased = 1 - Math.pow(1 - t, 3)
      setScaleY(eased)
    }
  })

  const buildingParts = useMemo(() => {
    switch (type) {
      case 'box':
        return [{ position: [0, 2, 0] as [number, number, number], size: [6, 4, 6] as [number, number, number] }]
      case 'lshape':
        return [
          { position: [-2, 2, -2] as [number, number, number], size: [4, 4, 8] as [number, number, number] },
          { position: [2, 2, 0] as [number, number, number], size: [4, 4, 4] as [number, number, number] },
        ]
      case 'courtyard':
        return [
          { position: [0, 2, -3] as [number, number, number], size: [8, 4, 2] as [number, number, number] },
          { position: [0, 2, 3] as [number, number, number], size: [8, 4, 2] as [number, number, number] },
          { position: [-3, 2, 0] as [number, number, number], size: [2, 4, 4] as [number, number, number] },
          { position: [3, 2, 0] as [number, number, number], size: [2, 4, 4] as [number, number, number] },
        ]
      default:
        return [{ position: [0, 2, 0] as [number, number, number], size: [6, 4, 6] as [number, number, number] }]
    }
  }, [type])

  const litColor = useMemo(() => new THREE.Color('#f0f0f0'), [])
  const darkColor = useMemo(() => {
    const c = new THREE.Color('#f0f0f0')
    c.multiplyScalar(0.7)
    return c
  }, [])

  const sunDirNormalized = useMemo(() => {
    return sunDirection.clone().normalize()
  }, [sunDirection])

  const partColors = useMemo(() => {
    return buildingParts.map(() => {
      const faceNormals: THREE.Vector3[] = [
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(-1, 0, 0),
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, -1, 0),
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 0, -1),
      ]

      let totalLit = 0
      let totalDark = 0

      faceNormals.forEach((normal) => {
        const dot = normal.dot(sunDirNormalized)
        if (dot > 0) {
          totalLit += dot
        } else {
          totalDark += 1
        }
      })

      const ratio = totalLit / (totalLit + totalDark)
      return darkColor.clone().lerp(litColor, Math.min(1, ratio * 1.5))
    })
  }, [buildingParts, sunDirNormalized, litColor, darkColor])

  return (
    <group ref={groupRef} scale={[1, scaleY, 1]} position={[0, 0, 0]}>
      {buildingParts.map((part, index) => (
        <mesh
          key={`${type}-${index}`}
          position={part.position}
          castShadow
          receiveShadow
        >
          <boxGeometry args={part.size} />
          <meshStandardMaterial
            color={partColors[index] || litColor}
            roughness={0.7}
            metalness={0.02}
          />
        </mesh>
      ))}
    </group>
  )
}

function GroundGrid({ gridOpacity }: { gridOpacity: number }) {
  const gridRef = useRef<THREE.GridHelper>(null)

  useEffect(() => {
    if (gridRef.current) {
      const mat = gridRef.current.material as THREE.Material
      if ('opacity' in mat) {
        mat.opacity = gridOpacity
        mat.transparent = true
        mat.needsUpdate = true
      }
    }
  }, [gridOpacity])

  return (
    <gridHelper
      ref={gridRef}
      args={[20, 20, '#5a6578', '#3a4558']}
      position={[0, 0.01, 0]}
    />
  )
}

function GroundPlane({ shadowStrength }: { shadowStrength: number }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#c8cad0" roughness={0.95} metalness={0} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <shadowMaterial transparent opacity={0.55 * shadowStrength} />
      </mesh>
    </group>
  )
}

function DirectionArrows() {
  const arrows = useMemo(() => {
    const dirs = [
      { label: 'N', pos: [0, 0.5, -9] as [number, number, number], rot: [0, 0, 0] as [number, number, number] },
      { label: 'S', pos: [0, 0.5, 9] as [number, number, number], rot: [0, Math.PI, 0] as [number, number, number] },
      { label: 'E', pos: [9, 0.5, 0] as [number, number, number], rot: [0, -Math.PI / 2, 0] as [number, number, number] },
      { label: 'W', pos: [-9, 0.5, 0] as [number, number, number], rot: [0, Math.PI / 2, 0] as [number, number, number] },
    ]
    return dirs
  }, [])

  return (
    <>
      {arrows.map((arrow) => (
        <group key={arrow.label} position={arrow.pos}>
          <mesh rotation={arrow.rot}>
            <coneGeometry args={[0.35, 0.9, 8]} />
            <meshBasicMaterial color="#6C8BFF" transparent opacity={0.7} />
          </mesh>
          <Html position={[0, 1.3, 0]} center distanceFactor={15}>
            <div style={{
              color: '#6C8BFF',
              fontSize: '14px',
              fontWeight: 700,
              textShadow: '0 1px 4px rgba(0,0,0,0.5)',
              userSelect: 'none',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}>
              {arrow.label}
            </div>
          </Html>
        </group>
      ))}
    </>
  )
}

interface SunLightProps {
  solarResult: SolarResult
}

function SunLight({ solarResult }: SunLightProps) {
  const directionalLightRef = useRef<THREE.DirectionalLight>(null)
  const elevationDeg = radToDeg(solarResult.elevation)

  const shadowStrength = elevationDeg > 30 ? 0.5 : 1.0
  const shadowSoftness = elevationDeg > 30 ? 8 : 3

  const lightColor = useMemo(() => {
    if (elevationDeg < 10) return new THREE.Color('#ff9955')
    if (elevationDeg < 25) return new THREE.Color('#ffddaa')
    if (elevationDeg < 50) return new THREE.Color('#fff5e6')
    return new THREE.Color('#ffffff')
  }, [elevationDeg])

  const lightIntensity = useMemo(() => {
    if (elevationDeg <= 0) return 0.2
    if (elevationDeg < 10) return 1.0 + (elevationDeg / 10) * 0.8
    if (elevationDeg < 30) return 1.8 + ((elevationDeg - 10) / 20) * 0.7
    return 2.5
  }, [elevationDeg])

  const ambientIntensity = useMemo(() => {
    if (elevationDeg <= 0) return 0.4
    if (elevationDeg < 15) return 0.5 + (elevationDeg / 15) * 0.15
    return 0.65
  }, [elevationDeg])

  const sunDir = solarResult.directionVector
  const lightDistance = 20

  const lightPos: [number, number, number] = useMemo(() => {
    const dir = new THREE.Vector3(sunDir.x, sunDir.y, sunDir.z).normalize()
    const y = Math.max(dir.y * lightDistance, 5)
    return [
      dir.x * lightDistance,
      y,
      dir.z * lightDistance,
    ]
  }, [sunDir.x, sunDir.y, sunDir.z])

  useEffect(() => {
    console.log('[SunLight] debug:', {
      elevationDeg,
      lightIntensity,
      ambientIntensity,
      shadowStrength,
      shadowSoftness,
      lightPos,
      directionVector: sunDir,
      lightColorHex: lightColor.getHexString(),
    })
  }, [elevationDeg, lightIntensity, ambientIntensity, shadowStrength, shadowSoftness, lightPos, sunDir, lightColor])

  return (
    <>
      <ambientLight intensity={ambientIntensity} color="#d8e0ee" />
      <directionalLight
        ref={directionalLightRef}
        position={lightPos}
        intensity={lightIntensity}
        color={lightColor}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-camera-near={0.5}
        shadow-camera-far={60}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
        shadow-radius={shadowSoftness}
      />
    </>
  )
}

function DynamicBackground({ solarResult }: { solarResult: SolarResult }) {
  const elevationDeg = radToDeg(solarResult.elevation)

  const colors = useMemo(() => {
    let topColor: THREE.Color
    let bottomColor: THREE.Color

    if (elevationDeg < 0) {
      topColor = new THREE.Color('#1a1a3a')
      bottomColor = new THREE.Color('#2a2a4a')
    } else if (elevationDeg < 10) {
      topColor = new THREE.Color('#ff7755')
      bottomColor = new THREE.Color('#ffaa77')
    } else if (elevationDeg < 25) {
      topColor = new THREE.Color('#ffbb88')
      bottomColor = new THREE.Color('#ffddbb')
    } else if (elevationDeg < 50) {
      topColor = new THREE.Color('#88bbee')
      bottomColor = new THREE.Color('#ccddee')
    } else {
      topColor = new THREE.Color('#aaddee')
      bottomColor = new THREE.Color('#e0f0ff')
    }
    return { topColor, bottomColor }
  }, [elevationDeg])

  useEffect(() => {
    console.log('[DynamicBackground] debug:', {
      elevationDeg,
      bgColor: colors.bottomColor.getStyle(),
    })
  }, [elevationDeg, colors])

  return (
    <>
      <color attach="background" args={[colors.bottomColor]} />
    </>
  )
}

interface SceneContentProps {
  solarResult: SolarResult
  selectedBuilding: BuildingType
  gridOpacity: number
}

function SceneContent({ solarResult, selectedBuilding, gridOpacity }: SceneContentProps) {
  const elevationDeg = radToDeg(solarResult.elevation)
  const shadowStrength = elevationDeg > 30 ? 0.5 : 1.0

  const sunDirection = useMemo(() => {
    return new THREE.Vector3(
      solarResult.directionVector.x,
      solarResult.directionVector.y,
      solarResult.directionVector.z,
    )
  }, [solarResult.directionVector.x, solarResult.directionVector.y, solarResult.directionVector.z])

  useEffect(() => {
    console.log('[SceneContent] debug mount - elevationDeg:', elevationDeg, 'shadowStrength:', shadowStrength, 'building:', selectedBuilding)
  }, [elevationDeg, shadowStrength, selectedBuilding])

  return (
    <>
      <DynamicBackground solarResult={solarResult} />
      <SunLight solarResult={solarResult} />
      <GroundPlane shadowStrength={shadowStrength} />
      <GroundGrid gridOpacity={gridOpacity} />
      <BuildingMesh type={selectedBuilding} sunDirection={sunDirection} />
      <DirectionArrows />
    </>
  )
}

function SceneWithControls() {
  const [gridOpacity, setGridOpacity] = useState(0.3)
  const isRotatingRef = useRef(false)
  const lastRotateTimeRef = useRef(0)
  const mountedLogRef = useRef(false)

  const { gl, camera, size: threeSize } = useThree()

  const dayOfYear = useSimStore((s) => s.dayOfYear)
  const timeHours = useSimStore((s) => s.timeHours)
  const latitude = useSimStore((s) => s.latitude)
  const longitude = useSimStore((s) => s.longitude)
  const selectedBuilding = useSimStore((s) => s.selectedBuilding)

  const solarResult = useMemo(
    () => calculateSolarPosition(dayOfYear, timeHours, latitude, longitude),
    [dayOfYear, timeHours, latitude, longitude],
  )

  useEffect(() => {
    if (!mountedLogRef.current) {
      console.log('[SceneWithControls] mounted - camera pos:', camera.position.toArray(), 'gl.domElement size:', gl.domElement.width, 'x', gl.domElement.height, 'threeSize:', threeSize)
      mountedLogRef.current = true
    }
  }, [camera, gl, threeSize])

  useFrame((_, delta) => {
    const now = Date.now()
    if (isRotatingRef.current) {
      setGridOpacity(0.1)
    } else if (now - lastRotateTimeRef.current > 150) {
      setGridOpacity((prev) => {
        const target = 0.3
        const step = delta * 2
        if (prev < target) {
          return Math.min(prev + step, target)
        }
        return prev
      })
    }
  })

  const handleStart = () => {
    isRotatingRef.current = true
    lastRotateTimeRef.current = Date.now()
  }

  const handleEnd = () => {
    isRotatingRef.current = false
    lastRotateTimeRef.current = Date.now()
  }

  const handleChange = () => {
    lastRotateTimeRef.current = Date.now()
  }

  return (
    <>
      <SceneContent
        solarResult={solarResult}
        selectedBuilding={selectedBuilding}
        gridOpacity={gridOpacity}
      />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={6}
        maxDistance={35}
        maxPolarAngle={Math.PI / 2 - 0.05}
        target={[0, 2, 0]}
        enableDamping
        dampingFactor={0.08}
        onStart={handleStart}
        onEnd={handleEnd}
        onChange={handleChange}
      />
    </>
  )
}

export function SunAnalysis() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState({ w: 0, h: 0 })

  console.log('[SunAnalysis] RENDER - dims:', dims)

  useEffect(() => {
    console.log('[SunAnalysis] useEffect mount')
    const measure = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth
        const h = containerRef.current.clientHeight
        console.log('[SunAnalysis] measure:', w, 'x', h)
        if (w > 0 && h > 0) {
          setDims({ w, h })
        }
      }
    }
    measure()
    const t1 = setTimeout(measure, 50)
    const t2 = setTimeout(measure, 200)
    const t3 = setTimeout(measure, 500)
    const ro = new ResizeObserver(measure)
    if (containerRef.current) ro.observe(containerRef.current)
    window.addEventListener('resize', measure)
    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3)
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="sun-analysis-container"
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      {dims.w > 0 && dims.h > 0 && (
        <Canvas
          shadows
          camera={{ position: [14, 10, 14], fov: 45, near: 0.1, far: 200 }}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance',
          }}
          dpr={[1, 2]}
          size={{ width: dims.w, height: dims.h }}
          onCreated={({ gl, camera }) => {
            console.log('[SunAnalysis] Canvas onCreated - size:', gl.domElement.width, 'x', gl.domElement.height, 'input dims:', dims)
            console.log('[SunAnalysis] camera pos:', camera.position.toArray())
          }}
        >
          <SceneWithControls />
        </Canvas>
      )}
    </div>
  )
}
