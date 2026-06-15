import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import {
  createScene,
  initCameraState,
  updateCamera,
  handleCameraInput,
  handleWASDPan,
  resizeRenderer,
  updatePlantMeshes,
  playSeedPlantingAnimation,
  clearPlantMeshes,
  setSoilSectionView,
  updateLighting,
  createSupportTrellis,
  spawnWiltingParticles,
  takePhoto,
  disposeScene,
  type SceneState,
  type CameraState
} from './sceneManager'
import {
  generatePlant,
  updateGrowth,
  type SpeciesType,
  type EnvironmentParams,
  type PlantData
} from './plantEngine'
import './styles.css'

const SPECIES_OPTIONS: { type: SpeciesType; name: string; icon: string }[] = [
  { type: 'sunflower', name: '向日葵', icon: '🌻' },
  { type: 'vine', name: '藤蔓', icon: '🌿' },
  { type: 'cactus', name: '仙人掌', icon: '🌵' }
]

export default function App() {
  const sceneContainerRef = useRef<HTMLDivElement>(null)
  const sceneStateRef = useRef<SceneState | null>(null)
  const cameraStateRef = useRef<CameraState>(initCameraState())
  const plantDataRef = useRef<PlantData | null>(null)
  const animationFrameRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const pressedKeysRef = useRef<Set<string>>(new Set())
  const isDraggingRef = useRef(false)
  const lastMouseRef = useRef({ x: 0, y: 0 })

  const [species, setSpecies] = useState<SpeciesType>('sunflower')
  const [light, setLight] = useState(75)
  const [water, setWater] = useState(60)
  const [fertility, setFertility] = useState(70)
  const [isPlanted, setIsPlanted] = useState(false)
  const [isGrowing, setIsGrowing] = useState(true)
  const [growthSpeed, setGrowthSpeed] = useState(1)
  const [showSectionView, setShowSectionView] = useState(false)
  const [showSnapshotModal, setShowSnapshotModal] = useState(false)
  const [snapshotImage, setSnapshotImage] = useState<string | null>(null)
  const [nodeCount, setNodeCount] = useState(0)
  const [growthProgress, setGrowthProgress] = useState(0)
  const [isWilting, setIsWilting] = useState(false)
  const [isAnimatingSpeciesChange, setIsAnimatingSpeciesChange] = useState(false)

  const params: EnvironmentParams = { light, water, fertility }

  const isPlantedRef = useRef(isPlanted)
  const isGrowingRef = useRef(isGrowing)
  const isWiltingRef = useRef(isWilting)
  const growthSpeedRef = useRef(growthSpeed)
  const paramsRef = useRef(params)
  const speciesRef = useRef(species)
  const handleTakePhotoRef = useRef<() => void>(() => {})

  useEffect(() => { isPlantedRef.current = isPlanted }, [isPlanted])
  useEffect(() => { isGrowingRef.current = isGrowing }, [isGrowing])
  useEffect(() => { isWiltingRef.current = isWilting }, [isWilting])
  useEffect(() => { growthSpeedRef.current = growthSpeed }, [growthSpeed])
  useEffect(() => { paramsRef.current = params }, [light, water, fertility])
  useEffect(() => { speciesRef.current = species }, [species])

  const getStatus = useCallback(() => {
    if (isWilting) return 'wilting'
    if (!isPlanted) return 'idle'
    if (!isGrowing) return 'paused'
    return 'growing'
  }, [isWilting, isPlanted, isGrowing])

  const getStatusText = useCallback(() => {
    const status = getStatus()
    switch (status) {
      case 'growing': return '生长中'
      case 'paused': return '已暂停'
      case 'wilting': return '枯萎中'
      default: return '等待播种'
    }
  }, [getStatus])

  const initPlant = useCallback((sp: SpeciesType, pr: EnvironmentParams) => {
    const plant = generatePlant(sp, pr)
    plantDataRef.current = plant
    setNodeCount(plant.totalNodeCount)
    setGrowthProgress(0)

    if (sceneStateRef.current) {
      createSupportTrellis(sceneStateRef.current, sp)
    }
  }, [])

  const handleSoilClick = useCallback(() => {
    if (isPlanted || isWilting || isAnimatingSpeciesChange) return
    if (!sceneStateRef.current) return

    playSeedPlantingAnimation(sceneStateRef.current, () => {
      setIsPlanted(true)
      initPlant(species, params)
    })
  }, [isPlanted, isWilting, isAnimatingSpeciesChange, species, params, initPlant])

  const handleReset = useCallback(() => {
    if (!sceneStateRef.current) return
    if (!isPlanted && !isWilting) return

    setIsWilting(true)
    setIsAnimatingSpeciesChange(true)

    if (plantDataRef.current) {
      plantDataRef.current.isWilting = true
      spawnWiltingParticles(sceneStateRef.current, sceneStateRef.current.plantGroup)
    }

    setTimeout(() => {
      clearPlantMeshes(sceneStateRef.current!)
      plantDataRef.current = null
      setIsPlanted(false)
      setIsWilting(false)
      setIsGrowing(true)
      setGrowthSpeed(1)
      setGrowthProgress(0)
      setNodeCount(0)
      setIsAnimatingSpeciesChange(false)
      setShowSectionView(false)
      setSoilSectionView(sceneStateRef.current!, false)
    }, 1800)
  }, [isPlanted, isWilting])

  const handleSpeciesChange = useCallback((newSpecies: SpeciesType) => {
    if (newSpecies === species) return
    if (isAnimatingSpeciesChange) return

    setSpecies(newSpecies)

    if (!isPlanted) {
      return
    }

    setIsAnimatingSpeciesChange(true)
    setIsWilting(true)

    if (plantDataRef.current) {
      plantDataRef.current.isWilting = true
    }

    if (sceneStateRef.current) {
      spawnWiltingParticles(sceneStateRef.current, sceneStateRef.current.plantGroup)
    }

    setTimeout(() => {
      if (sceneStateRef.current) {
        clearPlantMeshes(sceneStateRef.current)
      }
      setIsWilting(false)
      initPlant(newSpecies, params)
      setIsAnimatingSpeciesChange(false)
    }, 1500)
  }, [species, isPlanted, isAnimatingSpeciesChange, params, initPlant])

  const handleTakePhoto = useCallback(() => {
    if (!sceneStateRef.current || !isPlanted) return

    const state = sceneStateRef.current
    const canvas = state.renderer.domElement
    
    state.renderer.render(state.scene, state.camera)
    const dataUrl = canvas.toDataURL('image/png')
    setSnapshotImage(dataUrl)
    setShowSnapshotModal(true)
  }, [isPlanted])

  const handleSavePhoto = useCallback(() => {
    if (!sceneStateRef.current) return
    takePhoto(sceneStateRef.current)
    setShowSnapshotModal(false)
  }, [])

  useEffect(() => {
    if (!sceneContainerRef.current) return

    const sceneState = createScene(sceneContainerRef.current)
    sceneStateRef.current = sceneState
    updateLighting(sceneState, params)

    const handleResize = () => {
      if (!sceneContainerRef.current || !sceneStateRef.current) return
      resizeRenderer(
        sceneStateRef.current,
        sceneContainerRef.current.clientWidth,
        sceneContainerRef.current.clientHeight
      )
    }
    window.addEventListener('resize', handleResize)

    const handleKeyDown = (e: KeyboardEvent) => {
      pressedKeysRef.current.add(e.key)

      if (e.key === ' ' && isPlanted && !e.repeat) {
        e.preventDefault()
        handleTakePhoto()
      }
      if ((e.key === 'p' || e.key === 'P') && isPlanted && !e.repeat) {
        setIsGrowing(prev => !prev)
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      pressedKeysRef.current.delete(e.key)
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    const container = sceneContainerRef.current

    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true
      lastMouseRef.current = { x: e.clientX, y: e.clientY }
    }
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return
      const dx = e.clientX - lastMouseRef.current.x
      const dy = e.clientY - lastMouseRef.current.y
      lastMouseRef.current = { x: e.clientX, y: e.clientY }

      if (e.buttons === 1) {
        handleCameraInput(cameraStateRef.current, { rotateDelta: { x: dx, y: dy } })
      } else if (e.buttons === 2) {
        handleCameraInput(cameraStateRef.current, { panDelta: { x: dx, y: dy } })
      }
    }
    const handleMouseUp = () => {
      isDraggingRef.current = false
    }
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      handleCameraInput(cameraStateRef.current, { zoomDelta: e.deltaY })
    }
    const handleContextMenu = (e: Event) => {
      e.preventDefault()
    }

    container.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    container.addEventListener('wheel', handleWheel, { passive: false })
    container.addEventListener('contextmenu', handleContextMenu)

    let touchStartX = 0
    let touchStartY = 0
    let initialPinchDist = 0

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX
        touchStartY = e.touches[0].clientY
      } else if (e.touches.length === 2) {
        const dx = e.touches[1].clientX - e.touches[0].clientX
        const dy = e.touches[1].clientY - e.touches[0].clientY
        initialPinchDist = Math.sqrt(dx * dx + dy * dy)
      }
    }
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      if (e.touches.length === 1) {
        const dx = e.touches[0].clientX - touchStartX
        const dy = e.touches[0].clientY - touchStartY
        touchStartX = e.touches[0].clientX
        touchStartY = e.touches[0].clientY
        handleCameraInput(cameraStateRef.current, { rotateDelta: { x: dx, y: dy } })
      } else if (e.touches.length === 2) {
        const dx = e.touches[1].clientX - e.touches[0].clientX
        const dy = e.touches[1].clientY - e.touches[0].clientY
        const dist = Math.sqrt(dx * dx + dy * dy)
        const delta = initialPinchDist - dist
        initialPinchDist = dist
        handleCameraInput(cameraStateRef.current, { zoomDelta: delta * 2 })
      }
    }
    container.addEventListener('touchstart', handleTouchStart, { passive: false })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })

    const animate = (time: number) => {
      if (!sceneStateRef.current) {
        animationFrameRef.current = requestAnimationFrame(animate)
        return
      }

      const deltaTime = Math.min((time - lastTimeRef.current) / 1000, 0.1)
      lastTimeRef.current = time

      handleWASDPan(cameraStateRef.current, pressedKeysRef.current, deltaTime)
      updateCamera(sceneStateRef.current, cameraStateRef.current, deltaTime)

      if (plantDataRef.current && isPlanted) {
        const shouldAdvance = isGrowing && !isWilting
        const currentPhase = plantDataRef.current.phase
        const newPhase = shouldAdvance 
          ? currentPhase + deltaTime * growthSpeed * 12
          : currentPhase

        plantDataRef.current = updateGrowth(
          plantDataRef.current,
          newPhase,
          growthSpeed,
          params
        )

        updatePlantMeshes(sceneStateRef.current, plantDataRef.current)

        const avgProgress = Array.from(plantDataRef.current.nodes.values())
          .reduce((sum, n) => sum + n.growthProgress, 0) / plantDataRef.current.nodes.size
        setGrowthProgress(Math.round(avgProgress * 100))
      }

      sceneStateRef.current.renderer.render(
        sceneStateRef.current.scene,
        sceneStateRef.current.camera
      )

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationFrameRef.current)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      container.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      container.removeEventListener('wheel', handleWheel)
      container.removeEventListener('contextmenu', handleContextMenu)
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)

      if (sceneStateRef.current) {
        disposeScene(sceneStateRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (sceneStateRef.current) {
      updateLighting(sceneStateRef.current, params)
    }
  }, [light, water])

  useEffect(() => {
    if (sceneStateRef.current) {
      setSoilSectionView(sceneStateRef.current, showSectionView)
    }
  }, [showSectionView])

  const status = getStatus()

  return (
    <div className="app-container">
      <div className="scene-container" ref={sceneContainerRef}>
        <div className="status-badge">
          <span className={`status-dot ${status}`}></span>
          <span>{getStatusText()}</span>
          {isPlanted && !isWilting && (
            <span style={{ opacity: 0.6, marginLeft: 4 }}>· {growthProgress}%</span>
          )}
        </div>

        {!isPlanted && !isWilting && (
          <>
            <div
              className={`soil-click-zone ${isPlanted ? 'has-seed' : ''}`}
              onClick={handleSoilClick}
            />
            <div className="soil-click-hint">
              👆 点击土壤开始播种
            </div>
          </>
        )}
      </div>

      <div className="panel-container">
        <div className="glass-panel">
          <div className="panel-title">
            <div className="panel-title-icon">🌱</div>
            植物生长模拟器
          </div>

          <div className="panel-section">
            <div className="panel-section-title">物种选择</div>
            <div className="species-selector">
              {SPECIES_OPTIONS.map((opt) => (
                <div
                  key={opt.type}
                  className={`species-card ${species === opt.type ? 'active' : ''}`}
                  onClick={() => handleSpeciesChange(opt.type)}
                >
                  <div className="species-thumbnail">{opt.icon}</div>
                  <div className="species-name">{opt.name}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-section">
            <div className="panel-section-title">环境参数</div>
            <div className="slider-group">
              <div className="slider-item">
                <div className="slider-header">
                  <div className="slider-label">
                    <span className="slider-icon">☀️</span>
                    光照强度
                  </div>
                  <div className="slider-value">{light}%</div>
                </div>
                <div className="slider-track">
                  <div className="slider-fill light" style={{ width: `${light}%` }} />
                  <input
                    type="range"
                    className="slider-input"
                    min="0"
                    max="100"
                    value={light}
                    onChange={(e) => setLight(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="slider-item">
                <div className="slider-header">
                  <div className="slider-label">
                    <span className="slider-icon">💧</span>
                    水分供应
                  </div>
                  <div className="slider-value">{water}%</div>
                </div>
                <div className="slider-track">
                  <div className="slider-fill water" style={{ width: `${water}%` }} />
                  <input
                    type="range"
                    className="slider-input"
                    min="0"
                    max="100"
                    value={water}
                    onChange={(e) => setWater(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="slider-item">
                <div className="slider-header">
                  <div className="slider-label">
                    <span className="slider-icon">🌾</span>
                    土壤肥沃度
                  </div>
                  <div className="slider-value">{fertility}%</div>
                </div>
                <div className="slider-track">
                  <div className="slider-fill fertility" style={{ width: `${fertility}%` }} />
                  <input
                    type="range"
                    className="slider-input"
                    min="0"
                    max="100"
                    value={fertility}
                    onChange={(e) => setFertility(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="panel-section">
            <div className="panel-section-title">生长控制</div>
            <div className="button-group-3">
              <button
                className={`btn btn-play`}
                onClick={() => setIsGrowing((prev) => !prev)}
                disabled={!isPlanted || isWilting}
              >
                {isGrowing ? '⏸ 暂停' : '▶ 继续'}
              </button>
              <button
                className={`btn btn-speed ${growthSpeed > 1 ? 'active' : ''}`}
                onClick={() => setGrowthSpeed((prev) => (prev === 1 ? 2 : prev === 2 ? 4 : 1))}
                disabled={!isPlanted || isWilting}
              >
                {growthSpeed === 1 ? '⏩ 1×' : growthSpeed === 2 ? '⏩ 2×' : '⏩ 4×'}
              </button>
              <button
                className={`btn btn-section-view ${showSectionView ? 'active' : ''}`}
                onClick={() => setShowSectionView((prev) => !prev)}
                disabled={!isPlanted}
              >
                📋 剖面
              </button>
            </div>
          </div>

          <div className="panel-section">
            <div className="button-group">
              <button
                className="btn btn-photo"
                onClick={handleTakePhoto}
                disabled={!isPlanted || isWilting}
              >
                📷 快照
              </button>
              <button
                className="btn btn-reset"
                onClick={handleReset}
                disabled={(!isPlanted && !isWilting) || isAnimatingSpeciesChange}
              >
                🔄 重置
              </button>
            </div>
          </div>

          <div className="panel-section">
            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-label">节点数量</div>
                <div className="stat-value">{nodeCount}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">生长进度</div>
                <div className="stat-value">{growthProgress}%</div>
              </div>
            </div>
          </div>

          <div className="keyboard-hints">
            <div className="hint-row">
              <div>
                <span className="key-cap">W</span>
                <span className="key-cap">A</span>
                <span className="key-cap">S</span>
                <span className="key-cap">D</span>
              </div>
              <span className="hint-text">平移视角</span>
            </div>
            <div className="hint-row">
              <span className="key-cap">拖拽</span>
              <span className="hint-text">旋转视角</span>
            </div>
            <div className="hint-row">
              <span className="key-cap">滚轮</span>
              <span className="hint-text">缩放场景</span>
            </div>
            <div className="hint-row">
              <span className="key-cap">空格</span>
              <span className="hint-text">拍摄快照</span>
            </div>
            <div className="hint-row">
              <span className="key-cap">P</span>
              <span className="hint-text">暂停/继续</span>
            </div>
          </div>
        </div>
      </div>

      {showSnapshotModal && (
        <div
          className="snapshot-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSnapshotModal(false)
            }
          }}
        >
          <div className="snapshot-modal">
            <div className="snapshot-modal-title">
              📸 植物快照
            </div>
            {snapshotImage && (
              <div className="snapshot-preview-container">
                <img src={snapshotImage} alt="Plant snapshot" />
              </div>
            )}
            <div className="snapshot-modal-actions">
              <button
                className="btn btn-photo"
                onClick={handleSavePhoto}
              >
                💾 保存PNG
              </button>
              <button
                className="btn btn-reset"
                style={{ gridColumn: 'span 1' }}
                onClick={() => setShowSnapshotModal(false)}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
