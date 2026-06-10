import React, { useMemo } from 'react'
import * as THREE from 'three'
import { SCENE_CONFIG } from '../utils/constants'

export const Workbench: React.FC = () => {
  const { WORKBENCH } = SCENE_CONFIG

  const brassMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#b5a642',
      metalness: 0.9,
      roughness: 0.2
    })
  }, [])

  const cornerSize = 3
  const halfWidth = WORKBENCH.width / 2
  const halfDepth = WORKBENCH.depth / 2
  const tableY = -WORKBENCH.height / 2

  const cornerPositions = [
    [halfWidth - cornerSize / 2, tableY, halfDepth - cornerSize / 2],
    [-halfWidth + cornerSize / 2, tableY, halfDepth - cornerSize / 2],
    [halfWidth - cornerSize / 2, tableY, -halfDepth + cornerSize / 2],
    [-halfWidth + cornerSize / 2, tableY, -halfDepth + cornerSize / 2]
  ] as [number, number, number][]

  return (
    <group position={[0, -5, 0]}>
      <mesh
        receiveShadow
        position={[0, 0, 0]}
      >
        <boxGeometry args={[WORKBENCH.width, WORKBENCH.height, WORKBENCH.depth]} />
        <meshStandardMaterial
          color={WORKBENCH.color}
          roughness={0.85}
          metalness={0.1}
        />
      </mesh>

      {cornerPositions.map((pos, i) => (
        <mesh
          key={i}
          position={pos}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[cornerSize, WORKBENCH.height + 1, cornerSize]} />
          <primitive object={brassMaterial} attach="material" />
        </mesh>
      ))}

      <mesh
        position={[0, -WORKBENCH.height - 0.5, 0]}
        rotation={[0, 0, 0]}
      >
        <boxGeometry args={[12, 8, 0.5]} />
        <meshStandardMaterial
          color="#8b6914"
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      <mesh
        position={[0, -WORKBENCH.height - 0.2, 0]}
        rotation={[0, Math.PI / 4, 0]}
      >
        <boxGeometry args={[10, 0.3, 6]} />
        <meshStandardMaterial
          color="#6b5010"
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      <group position={[0, -WORKBENCH.height - 0.5, 0]}>
        <mesh position={[0, 0, 0.3]}>
          <planeGeometry args={[8, 4]} />
          <meshStandardMaterial
            color="#4a3520"
            roughness={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {[
        [halfWidth - 6, -WORKBENCH.height - 15, 0],
        [-halfWidth + 6, -WORKBENCH.height - 15, 0],
        [0, -WORKBENCH.height - 15, halfDepth - 6],
        [0, -WORKBENCH.height - 15, -halfDepth + 6]
      ].map((pos, i) => (
        <mesh key={`leg-${i}`} position={pos as [number, number, number]}>
          <boxGeometry args={[4, 26, 4]} />
          <meshStandardMaterial
            color={WORKBENCH.color}
            roughness={0.85}
            metalness={0.1}
          />
        </mesh>
      ))}
    </group>
  )
}
