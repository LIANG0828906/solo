import React, { useRef, useState, useCallback, useEffect, memo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { TransformControls, Html, Edges } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'
import { useSceneStore } from '@/store/sceneStore'
import { toGeometryParams } from '@/utils/blockBuilder'

interface BuildingBlockProps {
  blockId: string
}

const BuildingBlock: React.FC<BuildingBlockProps> = ({ blockId }) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const transformRef = useRef<any>(null)
  const [hovered, setHovered] = useState(false)

  const block = useSceneStore((s) => s.blocks.find((b) => b.id === blockId))
  const selectedBlockId = useSceneStore((s) => s.selectedBlockId)
  const selectBlock = useSceneStore((s) => s.selectBlock)
  const updateBlock = useSceneStore((s) => s.updateBlock)

  const isSelected = selectedBlockId === blockId
  const params = block ? toGeometryParams(block) : null

  const handleClick = useCallback(
    (e: any) => {
      e.stopPropagation()
      selectBlock(blockId)
    },
    [blockId, selectBlock]
  )

  const handlePointerOver = useCallback(() => setHovered(true), [])
  const handlePointerOut = useCallback(() => setHovered(false), [])

  useEffect(() => {
    if (!transformRef.current) return
    const controls = transformRef.current
    const setGizmoOpacity = (opacity: number) => {
      const gizmo = controls.children.find(
        (c: any) => c.type === 'TransformControlsPlane'
      )?.parent
      if (!gizmo) {
        controls.traverse((child: any) => {
          if (child.isMesh && child.material) {
            child.material.transparent = true
            child.material.opacity = opacity
            child.material.depthWrite = opacity >= 1.0
          }
        })
        return
      }
      gizmo.traverse((child: any) => {
        if (child.isMesh && child.material) {
          child.material.transparent = true
          child.material.opacity = opacity
          child.material.depthWrite = opacity >= 1.0
        }
      })
    }
    setGizmoOpacity(0.6)

    const onDraggingChanged = (event: any) => {
      if (!event.value) {
        setGizmoOpacity(0.6)
        if (meshRef.current && block) {
          const pos = meshRef.current.parent!.position
          updateBlock(blockId, {
            position: {
              x: parseFloat(pos.x.toFixed(2)),
              y: parseFloat((pos.y - block.dimensions.height / 2).toFixed(2)),
              z: parseFloat(pos.z.toFixed(2)),
            },
          })
        }
      } else {
        setGizmoOpacity(1.0)
      }
    }

    controls.addEventListener('dragging-changed', onDraggingChanged)
    return () => {
      controls.removeEventListener('dragging-changed', onDraggingChanged)
    }
  }, [isSelected, blockId, block, updateBlock])

  useFrame(() => {
    if (!transformRef.current || !isSelected) return
    const controls = transformRef.current as any
    const isHoveringAxis = controls.axis !== null && controls.axis !== undefined
    if (isHoveringAxis) {
      controls.traverse((child: any) => {
        if (child.isMesh && child.material) {
          child.material.opacity = 1.0
          child.material.depthWrite = true
        }
      })
    }
  })

  useEffect(() => {
    if (!groupRef.current || !block) return
    const target = new THREE.Vector3(params!.posX, params!.posY, params!.posZ)
    const current = groupRef.current.position.clone()
    if (current.distanceTo(target) > 0.01) {
      gsap.to(groupRef.current.position, {
        x: target.x,
        y: target.y,
        z: target.z,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    }
  }, [params?.posX, params?.posY, params?.posZ])

  useEffect(() => {
    if (!meshRef.current || !block) return
    const targetScale = new THREE.Vector3(
      params!.width,
      params!.height,
      params!.depth
    )
    const current = meshRef.current.scale.clone()
    if (current.distanceTo(targetScale) > 0.01) {
      gsap.to(meshRef.current.scale, {
        x: targetScale.x,
        y: targetScale.y,
        z: targetScale.z,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    }
  }, [params?.width, params?.height, params?.depth])

  if (!block || !params) return null

  const edgeColor = isSelected ? '#00d4ff' : '#ffffff'

  return (
    <group ref={groupRef} position={[params.posX, params.posY, params.posZ]}>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        scale={[params.width, params.height, params.depth]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={params.color}
          transparent
          opacity={params.opacity}
          roughness={0.4}
          metalness={0.1}
        />
        <Edges
          color={edgeColor}
          linewidth={isSelected ? 2 : 1}
          threshold={15}
        />
      </mesh>

      {isSelected && (
        <>
          <pointLight
            color="#00d4ff"
            intensity={0.6}
            distance={5}
            position={[0, params.height / 2 + 0.5, 0]}
          />
          <TransformControls
            ref={transformRef}
            mode="translate"
            translationSnap={0.1}
            onMouseDown={() => {
              if (transformRef.current) {
                transformRef.current.traverse((child: any) => {
                  if (child.isMesh && child.material) {
                    child.material.opacity = 1.0
                    child.material.depthWrite = true
                  }
                })
              }
            }}
          />
        </>
      )}

      {(isSelected || hovered) && (
        <Html
          position={[0, params.height / 2 + 0.8, 0]}
          center
          distanceFactor={8}
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              color: '#fff',
              fontSize: '16px',
              fontFamily: 'system-ui, sans-serif',
              textShadow: '1px 1px 3px rgba(0,0,0,0.9), -1px -1px 3px rgba(0,0,0,0.9)',
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}
          >
            {block.name} · H{block.dimensions.height.toFixed(1)}
          </div>
        </Html>
      )}
    </group>
  )
}

export default memo(BuildingBlock)
