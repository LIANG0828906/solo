import React, { useState, useEffect, useCallback, useRef } from 'react'
import { TerrainRenderer } from './module-terrain/terrain-renderer'
import { ResourceUI } from './module-resource/resource-ui'
import { generateTerrainAsync } from './module-terrain/terrain-generator'
import { resourceManager } from './module-resource/resource-manager'
import { TerrainData, ResourcePoint, Building, BuildingType, ChunkCoord } from './types'
import { v4 as uuidv4 } from 'uuid'

const CHUNK_SIZE = 20
const TRANSITION_DURATION = 500

const App: React.FC = () => {
  const [chunkCoord, setChunkCoord] = useState<ChunkCoord>({ x: 0, z: 0 })
  const [prevChunkCoord, setPrevChunkCoord] = useState<ChunkCoord | null>(null)
  const [terrainData, setTerrainData] = useState<TerrainData | null>(null)
  const [prevTerrainData, setPrevTerrainData] = useState<TerrainData | null>(null)
  const [resourcePoints, setResourcePoints] = useState<ResourcePoint[]>([])
  const [buildings, setBuildings] = useState<Building[]>([])
  const [newBuildingIds, setNewBuildingIds] = useState<Set<string>>(new Set())
  const [transitionOpacity, setTransitionOpacity] = useState(1)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [chunkAnimKey, setChunkAnimKey] = useState(0)
  const keysPressed = useRef<Set<string>>(new Set())
  const canMove = useRef(true)

  const loadChunk = useCallback(async (x: number, z: number) => {
    try {
      const { terrain, resources } = await generateTerrainAsync(x, z, CHUNK_SIZE)
      setPrevTerrainData(terrainData)
      setTerrainData(terrain)
      setResourcePoints(resources)
      setPrevChunkCoord(chunkCoord)
      setChunkCoord({ x, z })

      setTransitionOpacity(0)
      setIsTransitioning(true)

      const startTime = performance.now()
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / TRANSITION_DURATION, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setTransitionOpacity(eased)

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          setIsTransitioning(false)
          setPrevTerrainData(null)
        }
      }
      requestAnimationFrame(animate)
    } catch (error) {
      console.error('Failed to load chunk:', error)
    }
  }, [chunkCoord, terrainData])

  const handleMove = useCallback((dx: number, dz: number) => {
    if (!canMove.current || isTransitioning) return
    canMove.current = false

    const newX = chunkCoord.x + dx
    const newZ = chunkCoord.z + dz

    setChunkAnimKey((prev) => prev + 1)
    loadChunk(newX, newZ)

    setTimeout(() => {
      canMove.current = true
    }, TRANSITION_DURATION + 50)
  }, [chunkCoord, isTransitioning, loadChunk])

  useEffect(() => {
    loadChunk(0, 0)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (keysPressed.current.has(key)) return
      keysPressed.current.add(key)

      switch (key) {
        case 'w':
          handleMove(0, -1)
          break
        case 's':
          handleMove(0, 1)
          break
        case 'a':
          handleMove(-1, 0)
          break
        case 'd':
          handleMove(1, 0)
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase())
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleMove])

  const handleCollectResource = useCallback((point: ResourcePoint) => {
    if (point.collected) return

    setResourcePoints((prev) =>
      prev.map((p) =>
        p.id === point.id ? { ...p, collected: true } : p
      )
    )

    resourceManager.collect(point.type, 1)
  }, [])

  const handleBuild = useCallback((type: BuildingType): boolean => {
    const events = resourceManager.build(type)
    if (!events) return false

    let centerHeight = 0
    if (terrainData && terrainData.heights) {
      const midIdx = Math.floor(terrainData.heights.length / 2)
      if (midIdx < terrainData.heights.length && midIdx < terrainData.heights[midIdx].length) {
        centerHeight = terrainData.heights[midIdx][midIdx]
      }
    }

    const newBuilding: Building = {
      id: uuidv4(),
      type,
      position: {
        x: 0,
        y: centerHeight,
        z: 0
      },
      chunkX: chunkCoord.x,
      chunkZ: chunkCoord.z
    }

    setBuildings((prev) => [...prev, newBuilding])
    setNewBuildingIds((prev) => new Set(prev).add(newBuilding.id))

    setTimeout(() => {
      setNewBuildingIds((prev) => {
        const next = new Set(prev)
        next.delete(newBuilding.id)
        return next
      })
    }, 2000)

    return true
  }, [terrainData, chunkCoord])

  const currentChunkBuildings = buildings.filter(
    (b) => b.chunkX === chunkCoord.x && b.chunkZ === chunkCoord.z
  )

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#1a1a2e' }}>
      <TerrainRenderer
        terrainData={terrainData}
        prevTerrainData={prevTerrainData}
        resourcePoints={resourcePoints}
        buildings={currentChunkBuildings}
        newBuildingIds={newBuildingIds}
        onCollectResource={handleCollectResource}
        transitionOpacity={transitionOpacity}
      />

      <ResourceUI
        onBuild={handleBuild}
        chunkAnimKey={chunkAnimKey}
      />

      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          zIndex: 100,
          padding: '12px 16px',
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          border: '1px solid #00d4ff',
          color: '#fff',
          fontSize: '14px',
          fontWeight: 500
        }}
      >
        <span style={{ color: '#00d4ff' }}>区块:</span> ({chunkCoord.x}, {chunkCoord.z})
        {isTransitioning && (
          <span style={{ marginLeft: '10px', color: '#888' }}>加载中...</span>
        )}
      </div>
    </div>
  )
}

export default App
