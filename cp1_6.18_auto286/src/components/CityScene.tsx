import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useAppStore } from '../store/appStore'
import { calculateShadowHeatmap, coverageToColor, type HeatmapCell } from '../utils/shadowAnalysis'

interface BuildingMeshProps {
  position: [number, number, number]
  size: [number, number, number]
  lightColor: string
}

function BuildingMesh({ position, size, lightColor }: BuildingMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const roofRef = useRef<THREE.Mesh>(null)
  const [width, height, depth] = size

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        position={[0, height / 2, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[width, height, depth]} />
        <meshPhongMaterial
          color="#B0BEC5"
          specular={lightColor}
          shininess={20}
        />
      </mesh>
      <mesh
        ref={roofRef}
        position={[0, height + 0.05, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[width * 0.9, 0.3, depth * 0.9]} />
        <meshPhongMaterial
          color="#78909C"
          specular={lightColor}
          shininess={20}
        />
      </mesh>
    </group>
  )
}

function GroundGrid() {
  const gridRef = useRef<THREE.GridHelper>(null)

  useEffect(() => {
    if (gridRef.current) {
      const mat = gridRef.current.material as THREE.Material
      mat.transparent = true
      mat.opacity = 0.3
    }
  }, [])

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#1a1a2e" transparent opacity={0.9} />
      </mesh>
      <gridHelper
        ref={gridRef}
        args={[60, 60, '#4a4a6a', '#3a3a5a']}
        position={[0, 0.01, 0]}
      />
    </group>
  )
}

function Starfield() {
  const starsRef = useRef<THREE.Points>(null)
  const count = 100

  const [positions, opacities, phases] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const opa = new Float32Array(count)
    const ph = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI * 0.5
      const r = 50 + Math.random() * 20
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.cos(phi) + 10
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
      opa[i] = 0.3 + Math.random() * 0.5
      ph[i] = Math.random() * Math.PI * 2
    }
    return [pos, opa, ph]
  }, [])

  useFrame(({ clock }) => {
    if (!starsRef.current) return
    const material = starsRef.current.material as THREE.PointsMaterial
    const elapsed = clock.getElapsedTime()
    const colors = starsRef.current.geometry.attributes.color as THREE.BufferAttribute
    for (let i = 0; i < count; i++) {
      const twinkle = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(elapsed * (0.5 + Math.random() * 0.5) + phases[i]))
      colors.setXYZ(i, twinkle, twinkle, twinkle)
    }
    colors.needsUpdate = true
    material.opacity = 0.6
  })

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const colors = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      colors[i * 3] = opacities[i]
      colors[i * 3 + 1] = opacities[i]
      colors[i * 3 + 2] = opacities[i]
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geo
  }, [positions, opacities])

  return (
    <points ref={starsRef} geometry={geometry}>
      <pointsMaterial
        size={0.5}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  )
}

function SkyDome() {
  return (
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[80, 32, 32]} />
      <shaderMaterial
        side={THREE.BackSide}
        uniforms={{
          topColor: { value: new THREE.Color('#1A237E') },
          bottomColor: { value: new THREE.Color('#FF8C00') }
        }}
        vertexShader={`
          varying vec3 vWorldPosition;
          void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 topColor;
          uniform vec3 bottomColor;
          varying vec3 vWorldPosition;
          void main() {
            float h = normalize(vWorldPosition).y;
            gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), 0.6), 0.0)), 1.0);
          }
        `}
      />
    </mesh>
  )
}

function AnimatedDirectionalLight() {
  const lightRef = useRef<THREE.DirectionalLight>(null)
  const targetPos = useRef(new THREE.Vector3())
  const currentPos = useRef(new THREE.Vector3())
  const targetIntensity = useRef(1)
  const currentIntensity = useRef(1)

  const { sunAltitude, sunAzimuth, lightColor, lightIntensity } = useAppStore()

  useEffect(() => {
    const altitudeRad = sunAltitude * Math.PI / 180
    const azimuthRad = sunAzimuth * Math.PI / 180
    const distance = 30
    targetPos.current.set(
      distance * Math.cos(altitudeRad) * Math.sin(azimuthRad),
      distance * Math.sin(altitudeRad),
      distance * Math.cos(altitudeRad) * Math.cos(azimuthRad)
    )
    targetIntensity.current = lightIntensity
  }, [sunAltitude, sunAzimuth, lightIntensity])

  useFrame(() => {
    if (!lightRef.current) return
    currentPos.current.lerp(targetPos.current, 0.08)
    currentIntensity.current += (targetIntensity.current - currentIntensity.current) * 0.08
    lightRef.current.position.copy(currentPos.current)
    lightRef.current.intensity = currentIntensity.current
    lightRef.current.target.position.set(0, 0, 0)
    lightRef.current.target.updateMatrixWorld()
  })

  return (
    <directionalLight
      ref={lightRef}
      color={lightColor}
      intensity={lightIntensity}
      castShadow
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-camera-near={0.5}
      shadow-camera-far={100}
      shadow-camera-left={-30}
      shadow-camera-right={30}
      shadow-camera-top={30}
      shadow-camera-bottom={-30}
      shadow-bias={-0.0005}
      shadow-radius={3}
    />
  )
}

function HeatmapOverlay({ cells }: { cells: HeatmapCell[] }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (!meshRef.current) return
    const mat = meshRef.current.material as THREE.MeshBasicMaterial
    if (mat.opacity < 0.7) {
      mat.opacity = Math.min(0.7, mat.opacity + delta * 2)
    }
  })

  return (
    <group>
      {cells.map((cell, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[cell.x + 0.5, 0.05, cell.z + 0.5]}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            color={coverageToColor(cell.coverage)}
            transparent
            opacity={0}
            ref={(el) => {
              if (el) {
                requestAnimationFrame(() => {
                  let op = 0
                  const animate = () => {
                    op = Math.min(0.6, op + 0.05)
                    el.opacity = op
                    if (op < 0.6) requestAnimationFrame(animate)
                  }
                  animate()
                })
              }
            }}
          />
        </mesh>
      ))}
    </group>
  )
}

function SceneContent() {
  const { buildings, lightColor, showHeatmap, season } = useAppStore()
  const [heatmapData, setHeatmapData] = useState<HeatmapCell[]>([])

  useEffect(() => {
    if (showHeatmap) {
      const data = calculateShadowHeatmap(buildings, season, 1, 10)
      setHeatmapData(data)
    } else {
      setHeatmapData([])
    }
  }, [showHeatmap, season, buildings])

  return (
    <>
      <ambientLight intensity={0.25} color="#505060" />
      <AnimatedDirectionalLight />
      <SkyDome />
      <Starfield />
      <GroundGrid />
      {buildings.map((b) => (
        <BuildingMesh
          key={b.id}
          position={b.position}
          size={b.size}
          lightColor={lightColor}
        />
      ))}
      {showHeatmap && heatmapData.length > 0 && (
        <HeatmapOverlay cells={heatmapData} />
      )}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={10}
        maxDistance={60}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 2, 0]}
      />
    </>
  )
}

export default function CityScene() {
  return (
    <Canvas
      shadows
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.0
      }}
      camera={{ position: [18, 16, 18], fov: 50 }}
      style={{ width: '100%', height: '100%' }}
      onCreated={({ gl }) => {
        gl.shadowMap.enabled = true
        gl.shadowMap.type = THREE.PCFSoftShadowMap
      }}
    >
      <SceneContent />
    </Canvas>
  )
}
