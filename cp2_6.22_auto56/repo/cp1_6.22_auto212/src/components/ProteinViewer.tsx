import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Float } from '@react-three/drei'
import { EffectComposer, SSAO } from '@react-three/postprocessing'
import * as THREE from 'three'
import type { PDBData, AminoAcid, RenderStyle } from '@/types'
import { getResidueColor } from '@/services/pdbParser'
import { useStore } from '@/store/useStore'

interface ResidueTubeProps {
  residue: AminoAcid
  nextResidue?: AminoAcid
  isSelected: boolean
  showSideChains: boolean
  renderStyle: RenderStyle
}

function ResidueTube({ residue, nextResidue, isSelected, showSideChains, renderStyle }: ResidueTubeProps) {
  const color = getResidueColor(residue.secondaryStructure)
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (isSelected && glowRef.current) {
      const t = state.clock.elapsedTime
      const scale = 1 + Math.sin(t * (Math.PI * 2 / 1.5)) * 0.2
      glowRef.current.scale.setScalar(1.5 * scale)
      const material = glowRef.current.material as THREE.MeshBasicMaterial
      material.opacity = 0.4 + Math.sin(t * (Math.PI * 2 / 1.5)) * 0.3
    }
  })

  const backboneGeometry = useMemo(() => {
    if (!nextResidue) {
      return new THREE.SphereGeometry(0.4, 16, 16)
    }
    const start = new THREE.Vector3(residue.position.x, residue.position.y, residue.position.z)
    const end = new THREE.Vector3(nextResidue.position.x, nextResidue.position.y, nextResidue.position.z)
    const dir = new THREE.Vector3().subVectors(end, start)
    const len = dir.length()
    const geometry = new THREE.CylinderGeometry(0.3, 0.3, len, 12)
    geometry.translate(0, len / 2, 0)
    geometry.rotateX(Math.PI / 2)
    return geometry
  }, [residue, nextResidue])

  const backbonePosition = useMemo(() => {
    if (!nextResidue) {
      return [residue.position.x, residue.position.y, residue.position.z]
    }
    const start = new THREE.Vector3(residue.position.x, residue.position.y, residue.position.z)
    const end = new THREE.Vector3(nextResidue.position.x, nextResidue.position.y, nextResidue.position.z)
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
    const dir = new THREE.Vector3().subVectors(end, start).normalize()
    const quaternion = new THREE.Quaternion()
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
    return [mid, quaternion] as const
  }, [residue, nextResidue])

  const wireframe = renderStyle === 'wireframe'

  const sideChainLines = useMemo(() => {
    if (!showSideChains) return null
    const scAtoms = residue.atoms.filter((a) => a.isSideChain)
    return scAtoms.map((atom, idx) => {
      const start = new THREE.Vector3(residue.position.x, residue.position.y, residue.position.z)
      const end = new THREE.Vector3(atom.position.x, atom.position.y, atom.position.z)
      const dir = new THREE.Vector3().subVectors(end, start)
      const len = dir.length()
      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
      const quaternion = new THREE.Quaternion()
      quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
      return (
        <group key={`sc-${residue.id}-${idx}`} position={mid} quaternion={quaternion}>
          <mesh>
            <cylinderGeometry args={[0.08, 0.08, len, 6]} />
            <meshStandardMaterial color={color} wireframe={wireframe} transparent opacity={0.9} />
          </mesh>
          <mesh position={[0, len / 2, 0]}>
            <sphereGeometry args={[0.18, 8, 8]} />
            <meshStandardMaterial color="#E2E8F0" wireframe={wireframe} />
          </mesh>
        </group>
      )
    })
  }, [residue, showSideChains, wireframe, color])

  if (renderStyle === 'ballstick') {
    return (
      <group>
        <mesh position={[residue.position.x, residue.position.y, residue.position.z]}>
          <sphereGeometry args={[0.35, 12, 12]} />
          <meshStandardMaterial color={color} />
        </mesh>
        {sideChainLines}
        {isSelected && (
          <Float speed={2} rotationIntensity={0} floatIntensity={0}>
            <mesh
              ref={glowRef}
              position={[residue.position.x, residue.position.y, residue.position.z]}
            >
              <sphereGeometry args={[0.35, 16, 16]} />
              <meshBasicMaterial color="#FFFFFF" transparent opacity={0.6} />
            </mesh>
          </Float>
        )}
      </group>
    )
  }

  return (
    <group>
      {nextResidue ? (
        <group position={backbonePosition[0] as any} quaternion={backbonePosition[1] as any}>
          <mesh ref={meshRef}>
            <primitive object={backboneGeometry} attach="geometry" />
            <meshStandardMaterial color={color} wireframe={wireframe} />
          </mesh>
        </group>
      ) : (
        <mesh position={[residue.position.x, residue.position.y, residue.position.z]}>
          <primitive object={backboneGeometry} attach="geometry" />
          <meshStandardMaterial color={color} wireframe={wireframe} />
        </mesh>
      )}

      {renderStyle === 'cartoon' && residue.secondaryStructure === 'helix' && (
        <mesh position={[residue.position.x, residue.position.y, residue.position.z]}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshStandardMaterial color={color} wireframe={wireframe} transparent opacity={0.7} />
        </mesh>
      )}

      {renderStyle === 'cartoon' && residue.secondaryStructure === 'sheet' && (
        <mesh position={[residue.position.x, residue.position.y, residue.position.z]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[1.0, 0.2, 1.0]} />
          <meshStandardMaterial color={color} wireframe={wireframe} />
        </mesh>
      )}

      {sideChainLines}

      {isSelected && (
        <Float speed={2} rotationIntensity={0} floatIntensity={0}>
          <mesh
            ref={glowRef}
            position={[residue.position.x, residue.position.y, residue.position.z]}
          >
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshBasicMaterial color="#FFFFFF" transparent opacity={0.6} />
          </mesh>
        </Float>
      )}
    </group>
  )
}

interface CameraObserverProps {
  pdbData: PDBData
}

function CameraObserver({ pdbData }: CameraObserverProps) {
  const { camera } = useThree()
  const setFacingResidueRange = useStore((s) => s.setFacingResidueRange)
  const lastUpdateRef = useRef(0)

  useFrame(() => {
    const now = performance.now()
    if (now - lastUpdateRef.current < 100) return
    lastUpdateRef.current = now

    const cameraDir = new THREE.Vector3()
    camera.getWorldDirection(cameraDir)
    cameraDir.negate()

    let minDot = 1
    let maxDot = -1
    let startIdx = 0
    let endIdx = 0

    const dots: { idx: number; dot: number }[] = pdbData.sequence.map((res, idx) => {
      const resPos = new THREE.Vector3(res.position.x, res.position.y, res.position.z)
      const toRes = new THREE.Vector3().subVectors(resPos, camera.position).normalize()
      const dot = cameraDir.dot(toRes)
      return { idx, dot }
    })

    dots.sort((a, b) => b.dot - a.dot)
    const topCount = Math.max(5, Math.floor(dots.length * 0.15))
    const topIndices = dots.slice(0, topCount).map((d) => d.idx).sort((a, b) => a - b)

    if (topIndices.length > 0) {
      const start = Math.max(0, topIndices[0] - 2)
      const end = Math.min(pdbData.sequence.length - 1, topIndices[topIndices.length - 1] + 2)
      setFacingResidueRange({ start, end })
    }
  })

  return null
}

interface SceneContentProps {
  pdbData: PDBData
  selectedResidueId: number | null
  renderStyle: RenderStyle
  showSideChains: boolean
  ssaoIntensity: number
}

function SceneContent({ pdbData, selectedResidueId, renderStyle, showSideChains, ssaoIntensity }: SceneContentProps) {
  const groupRef = useRef<THREE.Group>(null)

  return (
    <>
      <CameraObserver pdbData={pdbData} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <directionalLight position={[-10, -10, -5]} intensity={0.4} />
      <pointLight position={[0, 20, 0]} intensity={0.5} />

      <group ref={groupRef} position={[-pdbData.boundingBox.center.x, -pdbData.boundingBox.center.y, -pdbData.boundingBox.center.z]}>
        {pdbData.sequence.map((residue, idx) => (
          <ResidueTube
            key={residue.id}
            residue={residue}
            nextResidue={idx < pdbData.sequence.length - 1 ? pdbData.sequence[idx + 1] : undefined}
            isSelected={selectedResidueId === residue.id}
            showSideChains={showSideChains}
            renderStyle={renderStyle}
          />
        ))}
      </group>

      <EffectComposer multisampling={8}>
        <SSAO
          intensity={ssaoIntensity / 100}
          luminanceInfluence={0.5}
          radius={20}
          scale={0.5}
          bias={0.025}
          worldDistanceThreshold={10}
          worldDistanceFalloff={5}
          worldProximityThreshold={0.5}
          worldProximityFalloff={0.1}
        />
      </EffectComposer>
    </>
  )
}

interface ProteinViewerProps {
  onBackgroundClick: () => void
}

export function ProteinViewer({ onBackgroundClick }: ProteinViewerProps) {
  const pdbData = useStore((s) => s.pdbData)
  const selectedResidueId = useStore((s) => s.selectedResidueId)
  const renderStyle = useStore((s) => s.renderStyle)
  const showSideChains = useStore((s) => s.showSideChains)
  const ssaoIntensity = useStore((s) => s.ssaoIntensity)
  const backgroundColor = useStore((s) => s.backgroundColor)

  if (!pdbData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#CBD5E1' }}>
        加载蛋白质结构中...
      </div>
    )
  }

  return (
    <Canvas
      shadows
      camera={{ position: [0, 0, 50], fov: 50 }}
      onPointerMissed={onBackgroundClick}
      gl={{ antialias: true, alpha: false }}
      style={{ background: backgroundColor }}
    >
      <color attach="background" args={[backgroundColor]} />
      <SceneContent
        pdbData={pdbData}
        selectedResidueId={selectedResidueId}
        renderStyle={renderStyle}
        showSideChains={showSideChains}
        ssaoIntensity={ssaoIntensity}
      />
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={10}
        maxDistance={150}
      />
    </Canvas>
  )
}
