import { useRef, useEffect } from 'react'
import { Canvas, useThree, ThreeEvent } from '@react-three/fiber'
import { OrbitControls, TransformControls, Grid } from '@react-three/drei'
import * as THREE from 'three'
import { useEditorStore, GeometryItem, PointLightItem } from '@/store/editorStore'

const geometryConstructors: Record<string, THREE.BufferGeometry> = {}

function getGeometry(type: string): THREE.BufferGeometry {
  if (geometryConstructors[type]) return geometryConstructors[type]
  let geo: THREE.BufferGeometry
  switch (type) {
    case 'box':
      geo = new THREE.BoxGeometry(1, 1, 1)
      break
    case 'sphere':
      geo = new THREE.SphereGeometry(0.6, 48, 32)
      break
    case 'cylinder':
      geo = new THREE.CylinderGeometry(0.5, 0.5, 1.2, 48)
      break
    case 'torus':
      geo = new THREE.TorusGeometry(0.5, 0.2, 32, 64)
      break
    case 'cone':
      geo = new THREE.ConeGeometry(0.6, 1.2, 48)
      break
    default:
      geo = new THREE.BoxGeometry(1, 1, 1)
  }
  geometryConstructors[type] = geo
  return geo
}

function GeometryMesh({ item }: { item: GeometryItem }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const selectGeometry = useEditorStore((s) => s.selectGeometry)
  const selectedId = useEditorStore((s) => s.selectedId)
  const isSelected = selectedId === item.id

  const { material } = item
  const threeMaterial = useRef<THREE.Material | null>(null)

  if (!threeMaterial.current || threeMaterial.current.userData.type !== material.type) {
    switch (material.type) {
      case 'metal':
        threeMaterial.current = new THREE.MeshStandardMaterial({
          color: material.color,
          envMapIntensity: material.envIntensity,
          roughness: material.roughness ?? 0.3,
          metalness: material.metalness ?? 0.8,
        })
        break
      case 'glossy':
        threeMaterial.current = new THREE.MeshPhysicalMaterial({
          color: material.color,
          envMapIntensity: material.envIntensity,
          roughness: 1 - (material.specularSharpness ?? 0.5),
          clearcoat: material.specularIntensity ?? 1.0,
          clearcoatRoughness: 0.1,
        })
        break
      case 'transparent':
        threeMaterial.current = new THREE.MeshPhysicalMaterial({
          color: material.color,
          envMapIntensity: material.envIntensity,
          transparent: true,
          opacity: material.opacity ?? 0.7,
          transmission: 0.5,
          ior: material.ior ?? 1.5,
          roughness: 0.1,
          thickness: 0.5,
        })
        break
      default:
        threeMaterial.current = new THREE.MeshStandardMaterial({
          color: material.color,
          envMapIntensity: material.envIntensity,
          roughness: 0.7,
          metalness: 0,
        })
    }
    threeMaterial.current.userData.type = material.type
  }

  const mat = threeMaterial.current as THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial
  if ('color' in mat) mat.color.set(material.color)
  if ('envMapIntensity' in mat) mat.envMapIntensity = material.envIntensity
  if (material.type === 'metal' && mat instanceof THREE.MeshStandardMaterial) {
    mat.roughness = material.roughness ?? 0.3
    mat.metalness = material.metalness ?? 0.8
  }
  if (material.type === 'glossy' && mat instanceof THREE.MeshPhysicalMaterial) {
    mat.clearcoat = material.specularIntensity ?? 1.0
    mat.roughness = 1 - (material.specularSharpness ?? 0.5)
  }
  if (material.type === 'transparent' && mat instanceof THREE.MeshPhysicalMaterial) {
    mat.opacity = material.opacity ?? 0.7
    mat.ior = material.ior ?? 1.5
    mat.transparent = true
  }

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    selectGeometry(item.id)
  }

  return (
    <mesh
      ref={meshRef}
      position={item.position}
      rotation={[
        (item.rotation[0] * Math.PI) / 180,
        (item.rotation[1] * Math.PI) / 180,
        (item.rotation[2] * Math.PI) / 180,
      ]}
      scale={item.scale}
      geometry={getGeometry(item.type)}
      material={mat}
      castShadow
      receiveShadow
      onClick={handleClick}
      userData={{ id: item.id }}
    >
      {isSelected && (
        <lineSegments>
          <edgesGeometry args={[getGeometry(item.type)]} />
          <lineBasicMaterial color="#6c63ff" linewidth={2} />
        </lineSegments>
      )}
    </mesh>
  )
}

function PointLightNode({ light }: { light: PointLightItem }) {
  const updatePointLight = useEditorStore((s) => s.updatePointLight)
  const meshRef = useRef<THREE.Mesh>(null)
  const isDragging = useRef(false)
  const dragPlane = useRef(new THREE.Plane())
  const dragOffset = useRef(new THREE.Vector3())
  const { camera, gl, scene } = useThree()

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    isDragging.current = true
    meshRef.current?.setPointerCapture(e.pointerId)
    const intersectPoint = e.point.clone()
    const camPos = new THREE.Vector3()
    camera.getWorldPosition(camPos)
    const normal = camPos.sub(intersectPoint).normalize()
    dragPlane.current.setFromNormalAndCoplanarPoint(normal, intersectPoint)
    dragOffset.current.copy(intersectPoint).sub(new THREE.Vector3(...light.position))
  }

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!isDragging.current) return
    e.stopPropagation()
    const ndc = new THREE.Vector2(
      (e.clientX / gl.domElement.clientWidth) * 2 - 1,
      -(e.clientY / gl.domElement.clientHeight) * 2 + 1
    )
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(ndc, camera)
    const intersectPoint = new THREE.Vector3()
    raycaster.ray.intersectPlane(dragPlane.current, intersectPoint)
    if (intersectPoint) {
      const newPos = intersectPoint.sub(dragOffset.current)
      updatePointLight(light.id, {
        position: [
          Math.round(newPos.x * 100) / 100,
          Math.round(newPos.y * 100) / 100,
          Math.round(newPos.z * 100) / 100,
        ],
      })
    }
  }

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    isDragging.current = false
    meshRef.current?.releasePointerCapture(e.pointerId)
  }

  return (
    <group position={light.position}>
      <pointLight
        color={light.color}
        intensity={light.intensity}
        decay={light.decay}
        distance={30}
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
      />
      <mesh
        ref={meshRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <sphereGeometry args={[0.15, 24, 24]} />
        <meshBasicMaterial color={light.color} />
      </mesh>
    </group>
  )
}

function TransformController() {
  const selectedId = useEditorStore((s) => s.selectedId)
  const transformMode = useEditorStore((s) => s.transformMode)
  const geometryList = useEditorStore((s) => s.geometryList)
  const updateTransform = useEditorStore((s) => s.updateTransform)
  const transformRef = useRef<any>(null)
  const objectRef = useRef<THREE.Object3D | null>(null)
  const { scene } = useThree()

  const selected = geometryList.find((g) => g.id === selectedId)

  useEffect(() => {
    if (!transformRef.current) return
    const control = transformRef.current
    if (!selected) {
      if (objectRef.current) {
        control.detach()
        scene.remove(objectRef.current)
        objectRef.current = null
      }
      return
    }
    if (!objectRef.current) {
      objectRef.current = new THREE.Object3D()
      scene.add(objectRef.current)
    }
    objectRef.current.position.set(...selected.position)
    objectRef.current.rotation.set(
      (selected.rotation[0] * Math.PI) / 180,
      (selected.rotation[1] * Math.PI) / 180,
      (selected.rotation[2] * Math.PI) / 180
    )
    objectRef.current.scale.setScalar(selected.scale)
    control.attach(objectRef.current)

    const onChange = () => {
      if (!objectRef.current || !selected) return
      const pos = objectRef.current.position
      const rot = objectRef.current.rotation
      const scl = objectRef.current.scale.x
      updateTransform(selected.id, {
        position: [
          Math.round(pos.x * 100) / 100,
          Math.round(pos.y * 100) / 100,
          Math.round(pos.z * 100) / 100,
        ],
        rotation: [
          Math.round(((rot.x * 180) / Math.PI) * 100) / 100,
          Math.round(((rot.y * 180) / Math.PI) * 100) / 100,
          Math.round(((rot.z * 180) / Math.PI) * 100) / 100,
        ],
        scale: Math.round(scl * 100) / 100,
      })
    }
    control.addEventListener('objectChange', onChange)
    return () => control.removeEventListener('objectChange', onChange)
  }, [selected, updateTransform, scene])

  if (!selected) return null

  return (
    <TransformControls
      ref={transformRef}
      mode={transformMode}
      size={0.8}
      showX
      showY
      showZ
    />
  )
}

function SceneContent() {
  const geometryList = useEditorStore((s) => s.geometryList)
  const lightList = useEditorStore((s) => s.lightList)
  const ambientIntensity = useEditorStore((s) => s.ambientIntensity)
  const directionalIntensity = useEditorStore((s) => s.directionalIntensity)
  const directionalDirection = useEditorStore((s) => s.directionalDirection)
  const selectGeometry = useEditorStore((s) => s.selectGeometry)

  const handleSceneClick = () => {
    selectGeometry(null)
  }

  return (
    <>
      <ambientLight intensity={ambientIntensity} />
      <directionalLight
        position={directionalDirection}
        intensity={directionalIntensity}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
      />
      {lightList.map((light) => (
        <PointLightNode key={light.id} light={light} />
      ))}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        receiveShadow
        onClick={handleSceneClick}
      >
        <planeGeometry args={[50, 50]} />
        <shadowMaterial transparent opacity={0.4} />
      </mesh>
      <Grid
        position={[0, 0, 0]}
        args={[30, 30]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#2a2a4a"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#3a3a5a"
        fadeDistance={30}
        fadeStrength={1}
        followCamera={false}
      />
      {geometryList.map((item) => (
        <GeometryMesh key={item.id} item={item} />
      ))}
      <TransformController />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={2}
        maxDistance={40}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN,
        }}
      />
    </>
  )
}

const SceneCanvas = () => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 220,
        right: 280,
        bottom: 0,
      }}
    >
      <Canvas
        shadows
        dpr={Math.min(window.devicePixelRatio, 2)}
        camera={{ position: [8, 6, 12], fov: 50 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true
          gl.shadowMap.type = THREE.PCFSoftShadowMap
          gl.setClearColor('#16213e', 0)
        }}
      >
        <SceneContent />
      </Canvas>
    </div>
  )
}

export default SceneCanvas
