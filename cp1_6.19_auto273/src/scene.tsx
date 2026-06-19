import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, ContactShadows, Html } from '@react-three/drei'
import * as THREE from 'three'
import {
  useJewelryStore,
  MetalType,
  GemType,
  LightEnvType,
  ViewType,
  METAL_COLORS,
  GEM_COLORS,
  Marker,
} from './store'

const VIEW_POSITIONS: Record<ViewType, [number, number, number]> = {
  front: [0, 0, 6],
  side45: [4.2, 3, 4.2],
  top: [0, 6, 0.1],
}

const VIEW_TARGETS: Record<ViewType, [number, number, number]> = {
  front: [0, 0, 0],
  side45: [0, 0, 0],
  top: [0, 0, 0],
}

function CameraAnimator() {
  const { camera } = useThree()
  const currentView = useJewelryStore((s) => s.currentView)
  const targetPos = useRef(new THREE.Vector3(...VIEW_POSITIONS.side45))
  const targetLook = useRef(new THREE.Vector3(...VIEW_TARGETS.side45))
  const animating = useRef(false)
  const animStart = useRef(0)
  const startPos = useRef(new THREE.Vector3())
  const startLook = useRef(new THREE.Vector3())
  const controlsRef = useRef<any>(null)

  useEffect(() => {
    targetPos.current.set(...VIEW_POSITIONS[currentView])
    targetLook.current.set(...VIEW_TARGETS[currentView])
    startPos.current.copy(camera.position)
    animStart.current = performance.now()
    animating.current = true
  }, [currentView, camera])

  useFrame(({ gl, camera }) => {
    if (animating.current) {
      const elapsed = (performance.now() - animStart.current) / 1000
      const duration = 0.8
      let t = Math.min(elapsed / duration, 1)
      t = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2

      camera.position.lerpVectors(startPos.current, targetPos.current, t)
      camera.lookAt(targetLook.current)

      if (t >= 1) {
        animating.current = false
        if (controlsRef.current) {
          controlsRef.current.target.copy(targetLook.current)
          controlsRef.current.update()
        }
      }
    }
  })

  return null
}

function LightingSetup() {
  const lightEnv = useJewelryStore((s) => s.lightEnv)
  const lightRefs = useRef<{
    spot1: THREE.SpotLight
    spot2: THREE.SpotLight
    spot3: THREE.SpotLight
    hemi: THREE.HemisphereLight
    stageSpot: THREE.SpotLight
    ambient: THREE.AmbientLight
  }>({} as any)

  const targetIntensities = useMemo(() => {
    switch (lightEnv) {
      case 'store':
        return { spot1: 4.0, spot2: 3.0, spot3: 3.0, hemi: 0, stageSpot: 0, ambient: 0.8 }
      case 'outdoor':
        return { spot1: 0, spot2: 0, spot3: 0, hemi: 2.0, stageSpot: 0, ambient: 1.0 }
      case 'stage':
        return { spot1: 0, spot2: 0, spot3: 0, hemi: 0, stageSpot: 6.0, ambient: 0.3 }
    }
  }, [lightEnv])

  const targetColors = useMemo(() => {
    switch (lightEnv) {
      case 'store':
        return {
          spots: new THREE.Color().setHSL(0.12, 0.5, 0.7),
          hemi: new THREE.Color(),
          stage: new THREE.Color(),
        }
      case 'outdoor':
        return {
          spots: new THREE.Color(),
          hemi: new THREE.Color().setHSL(0.12, 0.2, 0.85),
          stage: new THREE.Color(),
        }
      case 'stage':
        return {
          spots: new THREE.Color(),
          hemi: new THREE.Color(),
          stage: new THREE.Color().setHSL(0.1, 0.6, 0.8),
        }
    }
  }, [lightEnv])

  useFrame(() => {
    const refs = lightRefs.current
    const lerpFactor = 0.05
    if (refs.spot1) {
      refs.spot1.intensity += (targetIntensities.spot1 - refs.spot1.intensity) * lerpFactor
      refs.spot1.color.lerp(targetColors.spots, lerpFactor)
    }
    if (refs.spot2) {
      refs.spot2.intensity += (targetIntensities.spot2 - refs.spot2.intensity) * lerpFactor
      refs.spot2.color.lerp(targetColors.spots, lerpFactor)
    }
    if (refs.spot3) {
      refs.spot3.intensity += (targetIntensities.spot3 - refs.spot3.intensity) * lerpFactor
      refs.spot3.color.lerp(targetColors.spots, lerpFactor)
    }
    if (refs.hemi) {
      refs.hemi.intensity += (targetIntensities.hemi - refs.hemi.intensity) * lerpFactor
      refs.hemi.color.lerp(targetColors.hemi, lerpFactor)
    }
    if (refs.stageSpot) {
      refs.stageSpot.intensity += (targetIntensities.stageSpot - refs.stageSpot.intensity) * lerpFactor
      refs.stageSpot.color.lerp(targetColors.stage, lerpFactor)
    }
    if (refs.ambient) {
      refs.ambient.intensity += (targetIntensities.ambient - refs.ambient.intensity) * lerpFactor
    }
  })

  return (
    <>
      <ambientLight ref={(el) => (lightRefs.current.ambient = el!)} intensity={0.3} />
      <spotLight
        ref={(el) => (lightRefs.current.spot1 = el!)}
        position={[3, 5, 3]}
        angle={0.5}
        penumbra={0.8}
        intensity={2.5}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <spotLight
        ref={(el) => (lightRefs.current.spot2 = el!)}
        position={[-3, 4, 2]}
        angle={0.4}
        penumbra={0.9}
        intensity={2.0}
        castShadow
      />
      <spotLight
        ref={(el) => (lightRefs.current.spot3 = el!)}
        position={[0, 6, -4]}
        angle={0.4}
        penumbra={0.9}
        intensity={2.0}
        castShadow
      />
      <hemisphereLight
        ref={(el) => (lightRefs.current.hemi = el!)}
        args={[0xffffff, 0x444444, 0]}
      />
      <spotLight
        ref={(el) => (lightRefs.current.stageSpot = el!)}
        position={[0, 8, 0]}
        angle={(20 * Math.PI) / 180}
        penumbra={0.3}
        intensity={0}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
    </>
  )
}

function RingGeometry({ size }: { size: number }) {
  const ringTorus = useMemo(() => {
    const tubeRadius = 0.08 * size
    const radius = size / 2 - tubeRadius
    return new THREE.TorusGeometry(radius, tubeRadius, 32, 80)
  }, [size])

  return ringTorus
}

function GemGeometry({ size }: { size: number }) {
  const geometry = useMemo(() => {
    const geo = new THREE.OctahedronGeometry(size * 0.18, 2)
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i)
      if (y > 0) {
        pos.setY(i, y * 1.2)
      } else {
        pos.setY(i, y * 0.6)
      }
    }
    geo.computeVertexNormals()
    return geo
  }, [size])

  return geometry
}

function Prongs({ size, metal }: { size: number; metal: MetalType }) {
  const metalColor = METAL_COLORS[metal]
  const prongRadius = size * 0.018
  const prongHeight = size * 0.25
  const prongPositions = useMemo(() => {
    const r = size * 0.16
    return (
      [
        [0, r],
        [r, 0],
        [0, -r],
        [-r, 0],
        [r * 0.707, r * 0.707],
        [-r * 0.707, -r * 0.707],
      ] as [number, number][]
    ).map(([x, z]) => [x, size * 0.05, z] as [number, number, number])
  }, [size])

  return (
    <>
      {prongPositions.map((pos, i) => (
        <mesh key={i} position={pos} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[prongRadius, prongRadius * 0.8, prongHeight, 8]} />
          <meshStandardMaterial
            color={metalColor}
            metalness={0.95}
            roughness={0.15}
            envMapIntensity={1.5}
          />
        </mesh>
      ))}
    </>
  )
}

function Gem({ gem, size }: { gem: GemType; size: number }) {
  const geometry = GemGeometry({ size })
  const gemConfig = useMemo(() => {
    switch (gem) {
      case 'diamond':
        return { color: GEM_COLORS.diamond, opacity: 0.95, ior: 2.4, transmission: 0.6, roughness: 0.0 }
      case 'ruby':
        return { color: GEM_COLORS.ruby, opacity: 0.85, ior: 1.77, transmission: 0.3, roughness: 0.05 }
      case 'sapphire':
        return { color: GEM_COLORS.sapphire, opacity: 0.85, ior: 1.77, transmission: 0.3, roughness: 0.05 }
      case 'emerald':
        return { color: GEM_COLORS.emerald, opacity: 0.8, ior: 1.58, transmission: 0.4, roughness: 0.08 }
    }
  }, [gem])

  return (
    <mesh
      position={[0, size * 0.22, 0]}
      geometry={geometry}
      castShadow
    >
      <meshPhysicalMaterial
        color={gemConfig.color}
        metalness={0.1}
        roughness={gemConfig.roughness}
        transmission={gemConfig.transmission}
        thickness={size * 0.3}
        ior={gemConfig.ior}
        clearcoat={1.0}
        clearcoatRoughness={0}
        envMapIntensity={2.0}
        transparent
        opacity={gemConfig.opacity}
      />
    </mesh>
  )
}

function RingModel() {
  const metal = useJewelryStore((s) => s.metal)
  const gem = useJewelryStore((s) => s.gem)
  const size = useJewelryStore((s) => s.size)
  const addMarker = useJewelryStore((s) => s.addMarker)
  const showToast = useJewelryStore((s) => s.showToast)
  const groupRef = useRef<THREE.Group>(null)

  const metalColor = METAL_COLORS[metal]
  const ringGeometry = RingGeometry({ size })

  const handleClick = (e: any) => {
    e.stopPropagation()
    const point = e.point.clone()
    if (groupRef.current) {
      groupRef.current.worldToLocal(point)
    }
    addMarker([point.x, point.y, point.z], '')
    showToast('success', '标记已添加，请在右侧面板填写备注')
  }

  return (
    <group ref={groupRef} onClick={handleClick}>
      <mesh geometry={ringGeometry} castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial
          color={metalColor}
          metalness={0.98}
          roughness={0.12}
          envMapIntensity={1.8}
        />
      </mesh>
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[size * 0.2, size * 0.18, size * 0.08, 48]} />
        <meshStandardMaterial
          color={metalColor}
          metalness={0.98}
          roughness={0.12}
          envMapIntensity={1.8}
        />
      </mesh>
      <Prongs size={size} metal={metal} />
      <Gem gem={gem} size={size} />
    </group>
  )
}

function Markers() {
  const markers = useJewelryStore((s) => s.markers)
  const size = useJewelryStore((s) => s.size)
  const removeMarker = useJewelryStore((s) => s.removeMarker)
  const activeMarkerId = useJewelryStore((s) => {
    const last = markers[markers.length - 1]
    return last?.id || null
  })

  return (
    <>
      {markers.map((marker) => (
        <group key={marker.id} position={marker.position}>
          <mesh>
            <circleGeometry args={[0.1, 32]} />
            <meshBasicMaterial
              color="#0088FF"
              transparent
              opacity={0.5}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh position={[0, 0, 0.001]}>
            <ringGeometry args={[0.09, 0.1, 32]} />
            <meshBasicMaterial color="#0088FF" side={THREE.DoubleSide} />
          </mesh>
          {marker.note && (
            <Html position={[0, 0.15, 0]} center distanceFactor={10}>
              <div
                style={{
                  background: 'rgba(0,136,255,0.9)',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                }}
              >
                {marker.note}
              </div>
            </Html>
          )}
        </group>
      ))}
    </>
  )
}

function Ground() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <circleGeometry args={[10, 64]} />
        <meshStandardMaterial color="#2C2C2C" metalness={0.3} roughness={0.6} />
      </mesh>
      <ContactShadows
        position={[0, -0.49, 0]}
        opacity={0.5}
        scale={10}
        blur={2}
        far={4}
      />
    </>
  )
}

export function SceneContent() {
  const controlsRef = useRef<any>(null)

  return (
    <>
      <CameraAnimator />
      <LightingSetup />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={15}
        maxPolarAngle={Math.PI / 2 + 0.2}
      />
      <Ground />
      <RingModel />
      <Markers />
    </>
  )
}

function EnvironmentSetup() {
  const { scene, gl } = useThree()
  useEffect(() => {
    const pmremGenerator = new THREE.PMREMGenerator(gl)
    const envScene = new THREE.Scene()

    const gradientGeom = new THREE.SphereGeometry(50, 32, 32)
    const gradientMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        topColor: { value: new THREE.Color('#3a3a5c') },
        bottomColor: { value: new THREE.Color('#1a1a2e') },
        offset: { value: 33 },
        exponent: { value: 0.6 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
    })
    envScene.add(new THREE.Mesh(gradientGeom, gradientMat))

    const light1 = new THREE.PointLight(0xffffff, 10, 0)
    light1.position.set(5, 10, 5)
    envScene.add(light1)

    const light2 = new THREE.PointLight(0xfff0e0, 8, 0)
    light2.position.set(-5, 8, -3)
    envScene.add(light2)

    const light3 = new THREE.PointLight(0xe0e0ff, 5, 0)
    light3.position.set(0, 15, -8)
    envScene.add(light3)

    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2
      const radius = 30
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      const boxGeom = new THREE.BoxGeometry(6, 15 + Math.random() * 10, 3)
      const boxMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.6 + Math.random() * 0.1, 0.3, 0.2 + Math.random() * 0.2),
      })
      const box = new THREE.Mesh(boxGeom, boxMat)
      box.position.set(x, 10, z)
      envScene.add(box)
    }

    const envMap = pmremGenerator.fromScene(envScene).texture
    ;(scene as any).environment = envMap

    return () => {
      pmremGenerator.dispose()
      gradientGeom.dispose()
      gradientMat.dispose()
    }
  }, [scene])

  return null
}

export function ThreeScene() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [4.2, 3, 4.2], fov: 45 }}
      gl={{ antialias: true, alpha: false }}
      style={{ width: '100%', height: '100%' }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.2
        gl.outputColorSpace = THREE.SRGBColorSpace
        scene.background = new THREE.Color('#1A1A2E')
        gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      }}
    >
      <EnvironmentSetup />
      <SceneContent />
    </Canvas>
  )
}
