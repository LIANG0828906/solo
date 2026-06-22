import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Edges } from '@react-three/drei'
import * as THREE from 'three'
import { GeometryItemData, useSceneStore } from '../store/sceneStore'

interface GeometryItemProps {
  data: GeometryItemData
  useLOD?: boolean
}

const degToRad = (d: number) => (d * Math.PI) / 180

const getComplementaryColor = (hex: string): string => {
  const color = new THREE.Color(hex)
  const hsl = { h: 0, s: 0, l: 0 }
  color.getHSL(hsl)
  hsl.h = (hsl.h + 0.5) % 1
  const complement = new THREE.Color().setHSL(hsl.h, hsl.s, hsl.l)
  return '#' + complement.getHexString()
}

const getGeometryByType = (type: string, useLOD: boolean) => {
  const hi = { w: 64, h: 32 }
  const lo = { w: 16, h: 8 }
  const res = useLOD ? lo : hi

  switch (type) {
    case 'box':
      return <boxGeometry args={[1, 1, 1]} />
    case 'sphere':
      return <sphereGeometry args={[0.5, res.w, res.h]} />
    case 'cylinder':
      return <cylinderGeometry args={[0.5, 0.5, 1, useLOD ? 16 : 64]} />
    case 'torus':
      return <torusGeometry args={[0.5, 0.18, useLOD ? 12 : 24, useLOD ? 32 : 100]} />
    case 'cone':
      return <coneGeometry args={[0.5, 1, useLOD ? 16 : 64]} />
    default:
      return <boxGeometry args={[1, 1, 1]} />
  }
}

export const GeometryItem = ({ data, useLOD = false }: GeometryItemProps) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const [animScale, setAnimScale] = useState(data.visible ? (data.animateIn ? 0 : 1) : 1)
  const [opacity, setOpacity] = useState(data.visible ? (data.animateIn ? 0 : 1) : 1)

  const { selectedId, selectGeometry } = useSceneStore()
  const isSelected = selectedId === data.id

  const complementaryColor = useMemo(
    () => getComplementaryColor(data.material.color),
    [data.material.color]
  )

  useFrame((state, delta) => {
    if (data.animateIn) {
      const target = 1
      const speed = 8
      setAnimScale((s) => THREE.MathUtils.lerp(s, target, Math.min(1, delta * speed)))
      setOpacity((o) => THREE.MathUtils.lerp(o, target, Math.min(1, delta * speed)))
    } else if (!data.visible) {
      const target = 0
      const speed = 12
      setAnimScale((s) => THREE.MathUtils.lerp(s, target, Math.min(1, delta * speed)))
      setOpacity((o) => THREE.MathUtils.lerp(o, target, Math.min(1, delta * speed)))
    }
  })

  const displayScale = useMemo(() => {
    return [
      data.scale.x * animScale,
      data.scale.y * animScale,
      data.scale.z * animScale,
    ] as [number, number, number]
  }, [data.scale.x, data.scale.y, data.scale.z, animScale])

  return (
    <group
      position={[data.position.x, data.position.y, data.position.z]}
      rotation={[
        degToRad(data.rotation.x),
        degToRad(data.rotation.y),
        degToRad(data.rotation.z),
      ]}
      scale={displayScale}
    >
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation()
          selectGeometry(data.id)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'default'
        }}
      >
        {getGeometryByType(data.type, useLOD)}
        <meshStandardMaterial
          color={data.material.color}
          roughness={data.material.roughness}
          metalness={data.material.metalness}
          transparent
          opacity={opacity}
          emissive={hovered || isSelected ? complementaryColor : '#000000'}
          emissiveIntensity={hovered ? 0.15 : isSelected ? 0.1 : 0}
        />
        {(hovered || isSelected) && (
          <Edges color={complementaryColor} threshold={15} scale={1.001} />
        )}
      </mesh>

      {(hovered || isSelected) && (
        <Html
          position={[0, data.scale.y * 0.6 + 0.3, 0]}
          center
          distanceFactor={8}
          zIndexRange={[100, 0]}
        >
          <div
            style={{
              background: 'rgba(0,0,0,0.75)',
              color: '#fff',
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '11px',
              whiteSpace: 'nowrap',
              border: `1px solid ${complementaryColor}`,
              boxShadow: `0 0 8px ${complementaryColor}55`,
              pointerEvents: 'none',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            {data.name}
          </div>
        </Html>
      )}
    </group>
  )
}
