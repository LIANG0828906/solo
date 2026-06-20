import { useMemo } from 'react'
import { useStore } from '../store/useStore'
import * as THREE from 'three'

function Environment() {
  const { lightIntensity, humidity, soilType } = useStore()

  const { ambientColor, directionalColor, directionalIntensity, directionalPosition, fogDensity } = useMemo(() => {
    const lightNorm = lightIntensity / 100
    
    const warmColor = new THREE.Color(0xffd4a3)
    const coolColor = new THREE.Color(0xe8f4ff)
    const ambientColor = warmColor.clone().lerp(coolColor, lightNorm)
    
    const dirWarm = new THREE.Color(0xfff0d0)
    const dirCool = new THREE.Color(0xffffff)
    const directionalColor = dirWarm.clone().lerp(dirCool, lightNorm)
    
    const directionalIntensity = 0.5 + lightNorm * 1.5
    
    const sunAngle = Math.PI * 0.25 + (1 - lightNorm) * Math.PI * 0.3
    const directionalPosition = [
      Math.cos(sunAngle) * 30,
      Math.sin(sunAngle) * 30 + 10,
      10,
    ]
    
    const fogDensity = 0.01 + (humidity / 100) * 0.02
    
    return {
      ambientColor,
      directionalColor,
      directionalIntensity,
      directionalPosition,
      fogDensity,
    }
  }, [lightIntensity, humidity])

  const groundColor = useMemo(() => {
    switch (soilType) {
      case 'sand':
        return 0xd4b896
      case 'clay':
        return 0x6b4423
      case 'humus':
        return 0x3d2914
      default:
        return 0x5d4037
    }
  }, [soilType])

  return (
    <>
      <ambientLight color={ambientColor} intensity={0.4} />
      <directionalLight
        position={directionalPosition as [number, number, number]}
        color={directionalColor}
        intensity={directionalIntensity}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-camera-near={0.1}
        shadow-camera-far={100}
      />
      <fogExp2 attach="fog" color={0x87ceeb} density={fogDensity} />
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[15, 64]} />
        <meshStandardMaterial
          color={groundColor}
          roughness={0.9}
          metalness={0.05}
        />
      </mesh>
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[14.5, 15, 64]} />
        <meshBasicMaterial color={0x2d1810} transparent opacity={0.3} />
      </mesh>

      {humidity > 60 && (
        <>
          {[...Array(8)].map((_, i) => {
            const angle = (i / 8) * Math.PI * 2
            const radius = 8 + Math.random() * 5
            return (
              <mesh
                key={i}
                rotation={[-Math.PI / 2, 0, 0]}
                position={[
                  Math.cos(angle) * radius,
                  0.02,
                  Math.sin(angle) * radius,
                ]}
              >
                <circleGeometry args={[0.3 + Math.random() * 0.5, 16]} />
                <meshBasicMaterial
                  color={0x88ccff}
                  transparent
                  opacity={0.3 + (humidity - 60) / 100 * 0.3}
                />
              </mesh>
            )
          })}
        </>
      )}
    </>
  )
}

export default Environment
