import { useMemo } from 'react'
import * as THREE from 'three'
import { PlantParams, SoilType } from '../store/useStore'

interface PlantProps {
  plant: PlantParams
  growthProgress: number
  lightIntensity: number
  humidity: number
  soilType: SoilType
}

interface SegmentData {
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
}

interface LeafData {
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
  color: THREE.Color
}

interface RootData {
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
}

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function generateBranch(
  startPos: THREE.Vector3,
  direction: THREE.Vector3,
  length: number,
  thickness: number,
  depth: number,
  maxDepth: number,
  seed: number,
  growthProgress: number,
  humidity: number,
  soilType: SoilType,
  leafColor: THREE.Color,
  segments: SegmentData[],
  leaves: LeafData[]
) {
  if (depth > maxDepth || growthProgress < 0.05) return

  const depthDelay = depth * 0.1
  const branchProgress = Math.max(0, Math.min(1, (growthProgress - depthDelay) * (maxDepth + 1)))
  if (branchProgress <= 0) return

  const actualLength = length * branchProgress
  const actualThickness = thickness * branchProgress

  const endPos = startPos.clone().add(direction.clone().multiplyScalar(actualLength))
  const midPos = startPos.clone().add(endPos).multiplyScalar(0.5)

  const quaternion = new THREE.Quaternion()
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize())
  const euler = new THREE.Euler().setFromQuaternion(quaternion)

  segments.push({
    position: [midPos.x, midPos.y, midPos.z],
    rotation: [euler.x, euler.y, euler.z],
    scale: [actualThickness, actualLength / 2, actualThickness],
  })

  if (depth === maxDepth && branchProgress > 0.3) {
    const leafCount = Math.floor(3 + seededRandom(seed + depth * 100) * 5)
    for (let i = 0; i < leafCount; i++) {
      const leafAngle = (i / leafCount) * Math.PI * 2 + seededRandom(seed + i * 7) * 0.5
      const leafSize = 0.3 + seededRandom(seed + i * 13) * 0.3

      let leafScale = 1
      if (soilType === 'clay') leafScale = 0.7
      if (soilType === 'humus') leafScale = 1.3

      const leafColorVar = leafColor.clone()
      leafColorVar.offsetHSL(
        seededRandom(seed + i * 23) * 0.1 - 0.05,
        0,
        seededRandom(seed + i * 29) * 0.1 - 0.05
      )

      const tangent = new THREE.Vector3(
        Math.sin(leafAngle),
        0,
        Math.cos(leafAngle)
      ).applyQuaternion(quaternion)

      const leafPos = endPos.clone().add(tangent.multiplyScalar(0.2))
      leafPos.y += (seededRandom(seed + i * 17) - 0.5) * 0.2

      const leafRotX = Math.PI / 3 + (seededRandom(seed + i * 31) - 0.5) * 0.5
      const leafRotY = leafAngle + euler.y
      const leafRotZ = (seededRandom(seed + i * 37) - 0.5) * 0.3

      leaves.push({
        position: [leafPos.x, leafPos.y, leafPos.z],
        rotation: [leafRotX, leafRotY, leafRotZ],
        scale: leafSize * leafScale * Math.min(1, (branchProgress - 0.3) * 2.5),
        color: leafColorVar,
      })
    }
  }

  if (depth < maxDepth && branchProgress > 0.4) {
    const humidityFactor = 1 - Math.abs(humidity - 50) / 50
    const branchCount = Math.floor(2 + humidityFactor * 2 + seededRandom(seed + depth * 50) * 2)

    for (let i = 0; i < branchCount; i++) {
      const branchSeed = seed + depth * 1000 + i * 100

      const startRatio = 0.4 + seededRandom(branchSeed + 3) * 0.4
      const branchStart = startPos.clone().add(
        direction.clone().multiplyScalar(actualLength * startRatio)
      )

      const spreadAngle = 0.5 + seededRandom(branchSeed + 1) * 0.5
      const rotAngle = (i / branchCount) * Math.PI * 2 + seededRandom(branchSeed + 2) * 0.5

      const tangentAxis = new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion).normalize()
      const bitangentAxis = new THREE.Vector3(0, 0, 1).applyQuaternion(quaternion).normalize()

      const branchDir = direction.clone()
      const rotationQuat = new THREE.Quaternion()
      rotationQuat.setFromAxisAngle(tangentAxis, Math.cos(rotAngle) * spreadAngle)
      branchDir.applyQuaternion(rotationQuat)
      rotationQuat.setFromAxisAngle(bitangentAxis, Math.sin(rotAngle) * spreadAngle)
      branchDir.applyQuaternion(rotationQuat)
      branchDir.normalize()

      const newLength = length * (0.5 + seededRandom(branchSeed + 4) * 0.3)
      const newThickness = thickness * 0.6

      generateBranch(
        branchStart,
        branchDir,
        newLength,
        newThickness,
        depth + 1,
        maxDepth,
        branchSeed,
        growthProgress,
        humidity,
        soilType,
        leafColor,
        segments,
        leaves
      )
    }
  }
}

function Plant({ plant, growthProgress, lightIntensity, humidity, soilType }: PlantProps) {
  const { segments, leaves, roots } = useMemo(() => {
    const segments: SegmentData[] = []
    const leaves: LeafData[] = []
    const roots: RootData[] = []

    if (growthProgress <= 0.02) {
      return { segments, leaves, roots }
    }

    const lightNorm = lightIntensity / 100
    const humidityFactor = 1 + (humidity - 50) / 100 * 0.2

    let baseHeight = plant.baseHeight
    let baseThickness = 0.3
    let maxDepth = 3

    if (soilType === 'sand') {
      maxDepth = 2
      baseThickness *= 0.8
    } else if (soilType === 'clay') {
      maxDepth = 3
    } else if (soilType === 'humus') {
      maxDepth = 4
      baseHeight *= 1.2
      baseThickness *= 1.1
    }

    const actualThickness = baseThickness * humidityFactor

    const leafG = 0.4 + lightNorm * 0.4
    const leafR = 0.3 + (1 - lightNorm) * 0.3
    const leafB = 0.08
    const leafColor = new THREE.Color(leafR, leafG, leafB)

    if (soilType === 'sand' && growthProgress > 0.3) {
      const rootCount = 5 + Math.floor(seededRandom(plant.seed) * 3)
      for (let i = 0; i < rootCount; i++) {
        const angle = (i / rootCount) * Math.PI * 2
        const rootLength = 0.5 + seededRandom(plant.seed + i * 11) * 0.8
        const rootThickness = 0.08 + seededRandom(plant.seed + i * 13) * 0.05

        roots.push({
          position: [
            Math.sin(angle) * rootLength * 0.3,
            -rootLength * 0.4,
            Math.cos(angle) * rootLength * 0.3,
          ],
          rotation: [Math.PI / 3, angle, 0],
          scale: [
            rootThickness * Math.min(1, (growthProgress - 0.3) * 2),
            rootLength * 0.5 * Math.min(1, (growthProgress - 0.3) * 2),
            rootThickness * Math.min(1, (growthProgress - 0.3) * 2),
          ],
        })
      }
    }

    const startPos = new THREE.Vector3(0, 0, 0)
    const upDir = new THREE.Vector3(0, 1, 0)

    generateBranch(
      startPos,
      upDir,
      baseHeight,
      actualThickness,
      0,
      maxDepth,
      plant.seed,
      growthProgress,
      humidity,
      soilType,
      leafColor,
      segments,
      leaves
    )

    return { segments, leaves, roots }
  }, [plant, growthProgress, lightIntensity, humidity, soilType])

  const trunkColor = useMemo(() => {
    const lightNorm = lightIntensity / 100
    const r = 0.3 + (1 - lightNorm) * 0.1
    const g = 0.2 + (1 - lightNorm) * 0.05
    const b = 0.1
    return `rgb(${Math.floor(r * 255)}, ${Math.floor(g * 255)}, ${Math.floor(b * 255)})`
  }, [lightIntensity])

  if (growthProgress <= 0.02) {
    return (
      <mesh position={[plant.x, 0.3, plant.z]} castShadow>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#228b22" />
      </mesh>
    )
  }

  return (
    <group position={[plant.x, 0, plant.z]}>
      {roots.map((root, i) => (
        <mesh
          key={`root-${i}`}
          position={root.position}
          rotation={root.rotation as [number, number, number]}
          scale={root.scale}
          castShadow
        >
          <cylinderGeometry args={[1, 0.7, 1, 6]} />
          <meshStandardMaterial color={trunkColor} roughness={0.9} />
        </mesh>
      ))}

      {segments.map((seg, i) => (
        <mesh
          key={`seg-${i}`}
          position={seg.position}
          rotation={seg.rotation as [number, number, number]}
          scale={seg.scale}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[1, 0.8, 1, 8]} />
          <meshStandardMaterial color={trunkColor} roughness={0.85} />
        </mesh>
      ))}

      {leaves.map((leaf, i) => (
        <mesh
          key={`leaf-${i}`}
          position={leaf.position}
          rotation={leaf.rotation as [number, number, number]}
          scale={[leaf.scale, leaf.scale, leaf.scale]}
        >
          <planeGeometry args={[1, 1]} />
          <meshStandardMaterial
            color={`rgb(${Math.floor(leaf.color.r * 255)}, ${Math.floor(leaf.color.g * 255)}, ${Math.floor(leaf.color.b * 255)})`}
            side={THREE.DoubleSide}
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}
    </group>
  )
}

export default Plant
