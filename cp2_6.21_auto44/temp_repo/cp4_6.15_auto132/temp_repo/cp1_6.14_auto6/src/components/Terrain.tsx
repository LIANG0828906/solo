import { useRef, useMemo, useCallback } from 'react'
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useStore, MAX_FLAGS } from './useStore'
import { saveFlag } from './FlagManager'

const TERRAIN_SIZE = 20
const TERRAIN_SEGMENTS = 64

const terrainVertexShader = `
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying float vElevation;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    vElevation = position.y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const terrainFragmentShader = `
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying float vElevation;

  void main() {
    vec3 lowColor = vec3(0.118, 0.533, 0.898);
    vec3 midColor = vec3(0.831, 0.647, 0.455);
    vec3 highColor = vec3(0.96, 0.96, 0.92);

    float t = clamp((vElevation + 1.0) / 4.0, 0.0, 1.0);
    vec3 terrainColor;
    if (t < 0.5) {
      terrainColor = mix(lowColor, midColor, t * 2.0);
    } else {
      terrainColor = mix(midColor, highColor, (t - 0.5) * 2.0);
    }

    float contourInterval = 0.6;
    float contourWidth = 0.03;
    float contourLine = abs(fract(vElevation / contourInterval + 0.5) - 0.5);
    float contour = 1.0 - smoothstep(0.0, contourWidth, contourLine);
    terrainColor = mix(terrainColor, terrainColor * 0.55, contour * 0.45);

    vec3 lightDir = normalize(vec3(1.0, 2.0, 1.5));
    float diffuse = max(dot(vNormal, lightDir), 0.0) * 0.5 + 0.5;
    terrainColor *= diffuse;

    gl_FragColor = vec4(terrainColor, 1.0);
  }
`

function generateTerrainGeometry(): THREE.PlaneGeometry {
  const geometry = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_SEGMENTS, TERRAIN_SEGMENTS)
  geometry.rotateX(-Math.PI / 2)

  const posAttr = geometry.attributes.position
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i)
    const z = posAttr.getZ(i)
    const y =
      Math.sin(x * 0.5) * Math.cos(z * 0.4) * 1.5 +
      Math.sin(x * 0.3 + z * 0.6) * 0.8 +
      Math.cos(x * 0.8) * Math.sin(z * 0.7) * 0.5 +
      Math.sin(x * 1.2 + z * 0.3) * 0.3

    const lakeRadius = 3.0
    const dist = Math.sqrt(x * x + z * z)
    const lakeFactor = Math.max(0, 1 - dist / lakeRadius)
    const finalY = y * (1 - lakeFactor * 0.8) - lakeFactor * 0.5

    posAttr.setY(i, finalY)
  }

  geometry.computeVertexNormals()
  return geometry
}

function Flag({ position, color }: { position: [number, number, number]; color: string }) {
  const groupRef = useRef<THREE.Group>(null!)
  const glowRef = useRef<THREE.Mesh>(null!)
  const glowMatRef = useRef<THREE.MeshBasicMaterial>(null!)
  const flagStartY = position[1] + 3.5
  const animProgress = useRef(0)
  const springVelocity = useRef(0)
  const settled = useRef(false)
  const timeOffset = useRef(Math.random() * Math.PI * 2)

  useFrame((_, delta) => {
    if (!groupRef.current) return
    const clampedDelta = Math.min(delta, 0.05)

    if (!settled.current) {
      animProgress.current += clampedDelta * 2.5
      const stiffness = 120
      const damping = 12
      const displacement = groupRef.current.position.y - position[1]
      springVelocity.current += (-stiffness * displacement - damping * springVelocity.current) * clampedDelta
      groupRef.current.position.y += springVelocity.current * clampedDelta

      if (Math.abs(displacement) < 0.005 && Math.abs(springVelocity.current) < 0.01 && animProgress.current > 0.3) {
        settled.current = true
        groupRef.current.position.y = position[1]
      }
    }

    if (glowMatRef.current) {
      const time = performance.now() * 0.001 + timeOffset.current
      const pulse = Math.sin(time * 2.0) * 0.3 + 0.7
      glowMatRef.current.opacity = pulse * 0.35
      glowMatRef.current.emissiveIntensity = pulse * 1.2
    }

    if (glowRef.current) {
      const time = performance.now() * 0.001 + timeOffset.current
      const pulse = Math.sin(time * 2.0) * 0.15 + 1.0
      glowRef.current.scale.set(pulse, pulse, pulse)
    }
  })

  const poleHeight = 1.2
  const flagWidth = 0.5
  const flagHeight = 0.3

  return (
    <group ref={groupRef} position={[position[0], flagStartY, position[2]]}>
      <mesh position={[0, poleHeight / 2, 0]}>
        <cylinderGeometry args={[0.02, 0.02, poleHeight, 6]} />
        <meshStandardMaterial color="#5D4037" roughness={0.8} />
      </mesh>

      <mesh position={[flagWidth / 2, poleHeight - flagHeight / 2 + 0.02, 0]}>
        <planeGeometry args={[flagWidth, flagHeight]} />
        <meshStandardMaterial
          color={color}
          side={THREE.DoubleSide}
          emissive={color}
          emissiveIntensity={0.4}
          transparent
          opacity={0.95}
        />
      </mesh>

      <mesh ref={glowRef} position={[0, poleHeight * 0.7, 0]}>
        <sphereGeometry args={[0.35, 12, 12]} />
        <meshBasicMaterial
          ref={glowMatRef}
          color={color}
          transparent
          opacity={0.2}
          emissive={color}
          emissiveIntensity={0.5}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <pointLight
        position={[0, poleHeight * 0.7, 0]}
        color={color}
        intensity={0.5}
        distance={2}
        decay={2}
      />
    </group>
  )
}

export default function Terrain() {
  const { flags, visibleFlags, mode, selectedColor, addFlag } = useStore()
  const meshRef = useRef<THREE.Mesh>(null!)
  const terrainGeometry = useMemo(() => generateTerrainGeometry(), [])

  const handleClick = useCallback(
    async (event: ThreeEvent<MouseEvent>) => {
      if (mode !== 'place') return
      if (flags.length >= MAX_FLAGS) return

      event.stopPropagation()
      const point = event.point
      if (!point) return

      const newFlag = {
        id: '',
        x: point.x,
        y: point.y,
        z: point.z,
        color: selectedColor,
        timestamp: Date.now(),
      }

      const saved = await saveFlag(point.x, point.y, point.z, selectedColor)
      if (saved) {
        addFlag(saved)
      } else {
        newFlag.id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
        addFlag(newFlag)
      }
    },
    [mode, selectedColor, flags.length, addFlag]
  )

  const displayedFlags = mode === 'replay' ? visibleFlags : flags

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[8, 12, 6]}
        intensity={0.8}
        color="#fff5e6"
      />
      <directionalLight
        position={[-5, 8, -4]}
        intensity={0.3}
        color="#b3d9ff"
      />

      <mesh
        ref={meshRef}
        geometry={terrainGeometry}
        onClick={handleClick}
        rotation={[0, 0, 0]}
      >
        <shaderMaterial
          vertexShader={terrainVertexShader}
          fragmentShader={terrainFragmentShader}
          side={THREE.DoubleSide}
        />
      </mesh>

      {displayedFlags.map((flag) => (
        <Flag
          key={flag.id}
          position={[flag.x, flag.y, flag.z]}
          color={flag.color}
        />
      ))}

      <OrbitControls
        enableDamping
        dampingFactor={0.12}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={5}
        maxDistance={30}
        enabled={mode === 'place' || !useStore.getState().isReplaying}
      />
    </>
  )
}
