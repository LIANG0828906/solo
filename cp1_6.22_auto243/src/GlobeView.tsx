import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { City, Album } from './App'

interface GlobeViewProps {
  cities: City[]
  albums: Album[]
  selectedCityId: string | null
  onCityClick: (cityId: string) => void
  viewportWidth: number
  containerRef: React.RefObject<HTMLDivElement>
}

function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  )
}

interface EarthProps {
  radius: number
}

function Earth({ radius }: EarthProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const gridRef = useRef<THREE.LineSegments>(null)

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * ((2 * Math.PI) / 60)
    }
    if (gridRef.current) {
      gridRef.current.rotation.y += delta * ((2 * Math.PI) / 60)
    }
  })

  const gridGeometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(radius + 0.5, 48, 32)
    const edges = new THREE.EdgesGeometry(geo)
    return edges
  }, [radius])

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial
          color="#1a3a5c"
          roughness={0.8}
          metalness={0.1}
          emissive="#0a1530"
          emissiveIntensity={0.3}
        />
      </mesh>
      <lineSegments ref={gridRef} geometry={gridGeometry}>
        <lineBasicMaterial color="#4a6fa5" transparent opacity={0.25} />
      </lineSegments>
    </group>
  )
}

interface CityMarkerProps {
  city: City
  earthRadius: number
  hoverHeight: number
  isSelected: boolean
  onClick: () => void
}

function CityMarker({ city, earthRadius, hoverHeight, isSelected, onClick }: CityMarkerProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const position = useMemo(() => {
    const basePos = latLngToVector3(city.lat, city.lng, earthRadius + hoverHeight)
    return basePos
  }, [city.lat, city.lng, earthRadius, hoverHeight])

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.getElapsedTime()
      const pulse = 1 + Math.sin(t * Math.PI) * 0.15
      meshRef.current.scale.setScalar(isSelected ? 1.5 * pulse : pulse)
    }
  })

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      <sphereGeometry args={[0.06 * earthRadius, 16, 16]} />
      <meshBasicMaterial color={isSelected ? '#FF9F6B' : '#FF6B35'} transparent opacity={0.95} />
      <pointLight color="#FF6B35" intensity={isSelected ? 2 : 1} distance={2 * earthRadius} />
    </mesh>
  )
}

interface AlbumOrbitalProps {
  albums: Album[]
  orbitRadius: number
  period: number
  earthRadius: number
}

function AlbumOrbitals({ albums, orbitRadius, period, earthRadius }: AlbumOrbitalProps) {
  const unreleasedAlbums = albums.filter((a) => a.isUnreleased)
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * ((2 * Math.PI) / period)
    }
  })

  return (
    <group ref={groupRef}>
      {unreleasedAlbums.map((album, index) => {
        const angle = (index / Math.max(unreleasedAlbums.length, 1)) * 2 * Math.PI
        const x = orbitRadius * Math.cos(angle)
        const z = orbitRadius * Math.sin(angle)
        const y = Math.sin(angle * 2) * (orbitRadius * 0.3)
        return (
          <mesh key={album.id} position={[x, y, z]}>
            <sphereGeometry args={[0.04 * earthRadius, 12, 12]} />
            <meshBasicMaterial color="#00D4AA" />
            <pointLight color="#00D4AA" intensity={1.5} distance={orbitRadius} />
          </mesh>
        )
      })}
    </group>
  )
}

interface SceneProps {
  cities: City[]
  albums: Album[]
  selectedCityId: string | null
  onCityClick: (cityId: string) => void
  earthRadius: number
}

function Scene({ cities, albums, selectedCityId, onCityClick, earthRadius }: SceneProps) {
  const hoverHeight = 0.075 * earthRadius
  const orbitRadius = 1.5 * earthRadius

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 3, 5]} intensity={0.8} color="#ffffff" />
      <pointLight position={[-5, -3, -5]} intensity={0.3} color="#6366f1" />

      <Earth radius={earthRadius} />

      {cities.map((city) => (
        <CityMarker
          key={city.id}
          city={city}
          earthRadius={earthRadius}
          hoverHeight={hoverHeight}
          isSelected={selectedCityId === city.id}
          onClick={() => onCityClick(city.id)}
        />
      ))}

      <AlbumOrbital albums={albums} orbitRadius={orbitRadius} period={15} earthRadius={earthRadius} />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
        minDistance={earthRadius * 1.5}
        maxDistance={earthRadius * 5}
        enablePan={false}
      />
    </>
  )
}

function GlobeView({ cities, albums, selectedCityId, onCityClick, viewportWidth, containerRef }: GlobeViewProps) {
  const earthRadius = viewportWidth < 768 ? 1.2 : 2.0
  const cameraPosition = viewportWidth < 768 ? [0, 0, 5] : [0, 0, 6]

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
      }}
    >
      <Canvas
        camera={{ position: cameraPosition, fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
        style={{ width: '100%', height: '100%' }}
      >
        <Scene
          cities={cities}
          albums={albums}
          selectedCityId={selectedCityId}
          onCityClick={onCityClick}
          earthRadius={earthRadius}
        />
      </Canvas>
    </div>
  )
}

export default GlobeView
