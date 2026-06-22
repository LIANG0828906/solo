import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GlacierTerrain } from './GlacierTerrain'
import { MeltwaterParticle } from './MeltwaterParticle'
import { ClimateDataModel } from './ClimateDataModel'
import type { DataPoint } from './ClimateDataModel'
import { lerp } from './utils'

type ViewMode = 'top' | 'side' | 'free'

const ClimateExplorer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const glacierTerrainRef = useRef<GlacierTerrain | null>(null)
  const meltwaterRef = useRef<MeltwaterParticle | null>(null)
  const dataModelRef = useRef<ClimateDataModel | null>(null)
  const oceanMeshRef = useRef<THREE.Mesh | null>(null)
  const animationIdRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const lastSampleTimeRef = useRef<number>(0)
  const lastLakeTimeRef = useRef<number>(0)

  const [temperature, setTemperature] = useState(-2)
  const [seaLevel, setSeaLevel] = useState(1)
  const [viewMode, setViewMode] = useState<ViewMode>('top')
  const [comparisonYear, setComparisonYear] = useState<number | null>(null)
  const [stats, setStats] = useState({
    area: 8900,
    volume: 2150,
    seaLevelContribution: 1.05,
  })
  const [isMobile, setIsMobile] = useState(false)
  const [statsCollapsed, setStatsCollapsed] = useState(false)

  const areaChartRef = useRef<HTMLCanvasElement>(null)
  const volumeChartRef = useRef<HTMLCanvasElement>(null)
  const seaLevelChartRef = useRef<HTMLCanvasElement>(null)

  const availableYears = [1990, 2000, 2010, 2020]

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const drawTrendChart = useCallback(
    (canvas: HTMLCanvasElement, data: DataPoint[], color: string) => {
      const ctx = canvas.getContext('2d')
      if (!ctx || data.length < 2) return

      const width = canvas.width
      const height = canvas.height

      ctx.clearRect(0, 0, width, height)

      const values = data.map((d) => d.value)
      const minVal = Math.min(...values)
      const maxVal = Math.max(...values)
      const range = maxVal - minVal || 1

      ctx.beginPath()
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'

      data.forEach((point, index) => {
        const x = (index / (data.length - 1)) * width
        const y = height - ((point.value - minVal) / range) * (height - 4) - 2

        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      ctx.stroke()

      const gradient = ctx.createLinearGradient(0, 0, 0, height)
      gradient.addColorStop(0, color + '40')
      gradient.addColorStop(1, color + '00')

      ctx.lineTo(width, height)
      ctx.lineTo(0, height)
      ctx.closePath()
      ctx.fillStyle = gradient
      ctx.fill()
    },
    []
  )

  const updateCharts = useCallback(() => {
    if (!dataModelRef.current) return

    const model = dataModelRef.current
    const areaTrend = model.getAreaTrend(comparisonYear ?? undefined)
    const volumeTrend = model.getVolumeTrend(comparisonYear ?? undefined)
    const seaLevelTrend = model.getSeaLevelTrend(comparisonYear ?? undefined)

    if (areaChartRef.current) {
      drawTrendChart(areaChartRef.current, areaTrend, '#68D391')
    }
    if (volumeChartRef.current) {
      drawTrendChart(volumeChartRef.current, volumeTrend, '#63B3ED')
    }
    if (seaLevelChartRef.current) {
      drawTrendChart(seaLevelChartRef.current, seaLevelTrend, '#F6AD55')
    }
  }, [comparisonYear, drawTrendChart])

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x87ceeb)
    scene.fog = new THREE.Fog(0x87ceeb, 50, 150)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.set(0, 30, 30)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    })
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    )
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    rendererRef.current = renderer

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.rotateSpeed = 0.005
    controls.minDistance = 5
    controls.maxDistance = 50
    controls.enablePan = true
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    }
    controls.target.set(0, 0, 0)
    controlsRef.current = controls

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x3a5f3a, 0.5)
    scene.add(hemisphereLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(20, 40, 20)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    directionalLight.shadow.camera.near = 0.5
    directionalLight.shadow.camera.far = 100
    directionalLight.shadow.camera.left = -50
    directionalLight.shadow.camera.right = 50
    directionalLight.shadow.camera.top = 50
    directionalLight.shadow.camera.bottom = -50
    scene.add(directionalLight)

    const groundGeometry = new THREE.PlaneGeometry(100, 100, 1, 1)
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a5568,
      roughness: 0.9,
      metalness: 0.1,
    })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.01
    ground.receiveShadow = true
    scene.add(ground)

    const gridHelper = new THREE.GridHelper(100, 50, 0x2d3748, 0x1a202c)
    gridHelper.position.y = 0.001
    scene.add(gridHelper)

    const oceanGeometry = new THREE.PlaneGeometry(100, 60, 50, 30)
    const oceanMaterial = new THREE.MeshStandardMaterial({
      color: 0x006994,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      roughness: 0.1,
      metalness: 0.3,
    })
    const ocean = new THREE.Mesh(oceanGeometry, oceanMaterial)
    ocean.rotation.x = -Math.PI / 2
    ocean.position.set(0, 0.1, 20)
    ocean.receiveShadow = true
    scene.add(ocean)
    oceanMeshRef.current = ocean

    const glacierTerrain = new GlacierTerrain(scene, {
      width: 40,
      depth: 40,
      segments: 80,
      maxHeight: 12,
    })
    glacierTerrain.generateTerrain(-2)
    glacierTerrainRef.current = glacierTerrain

    const meltwater = new MeltwaterParticle(scene)
    meltwaterRef.current = meltwater

    const dataModel = new ClimateDataModel()
    dataModelRef.current = dataModel

    dataModel.sampleData()
    setStats({
      area: dataModel.getGlacierArea(),
      volume: dataModel.getGlacierVolume(),
      seaLevelContribution: dataModel.getSeaLevelContribution(),
    })

    const animate = (time: number) => {
      animationIdRef.current = requestAnimationFrame(animate)

      const deltaTime = Math.min((time - lastTimeRef.current) / 1000, 0.1)
      lastTimeRef.current = time

      if (oceanMeshRef.current) {
        const positions = oceanMeshRef.current.geometry.attributes.position
          .array as Float32Array
        for (let i = 0; i < positions.length; i += 3) {
          const x = positions[i]
          const z = positions[i + 2]
          positions[i + 1] =
            0.1 +
            Math.sin(x * 0.2 + time * 0.001) * 0.05 +
            Math.cos(z * 0.15 + time * 0.0015) * 0.03
        }
        oceanMeshRef.current.geometry.attributes.position.needsUpdate = true
        oceanMeshRef.current.position.y = lerp(
          oceanMeshRef.current.position.y,
          0.1 + seaLevel * 0.5,
          deltaTime * 2
        )
      }

      if (glacierTerrainRef.current) {
        glacierTerrainRef.current.updateMelting(temperature, deltaTime)
        glacierTerrainRef.current.updateSeaLevelSubmergence(
          0.1 + seaLevel * 0.5,
          deltaTime
        )

        if (temperature > 0 && time - lastLakeTimeRef.current > 2000) {
          lastLakeTimeRef.current = time
          const surfacePoints =
            glacierTerrainRef.current.getGlacierSurfacePoints()
          if (surfacePoints.length > 0) {
            const randomPoint =
              surfacePoints[Math.floor(Math.random() * surfacePoints.length)]
            meltwaterRef.current?.createMeltwaterLake(
              randomPoint.x,
              randomPoint.z,
              randomPoint.y,
              temperature
            )
          }
        }
      }

      if (meltwaterRef.current) {
        meltwaterRef.current.update(deltaTime)
      }

      if (time - lastSampleTimeRef.current > 2000) {
        lastSampleTimeRef.current = time
        if (dataModelRef.current) {
          dataModelRef.current.sampleData()
          setStats({
            area: dataModelRef.current.getGlacierArea(),
            volume: dataModelRef.current.getGlacierVolume(),
            seaLevelContribution:
              dataModelRef.current.getSeaLevelContribution(),
          })
          updateCharts()
        }
      }

      controls.update()
      renderer.render(scene, camera)
    }

    animate(0)

    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return
      const width = containerRef.current.clientWidth
      const height = containerRef.current.clientHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationIdRef.current)
      glacierTerrainRef.current?.dispose()
      meltwaterRef.current?.dispose()
      renderer.dispose()
    }
  }, [])

  useEffect(() => {
    if (!glacierTerrainRef.current || !dataModelRef.current) return

    dataModelRef.current.setTemperature(temperature)
    dataModelRef.current.setSeaLevel(seaLevel)

    if (comparisonYear !== null) {
      const historicalState =
        dataModelRef.current.getHistoricalState(comparisonYear)
      if (historicalState) {
        glacierTerrainRef.current.generateTerrain(temperature, historicalState)
        glacierTerrainRef.current.showHistoricalBoundary(
          comparisonYear,
          historicalState
        )
      }
    } else {
      glacierTerrainRef.current.generateTerrain(temperature)
      glacierTerrainRef.current.hideHistoricalBoundary()
    }

    lastLakeTimeRef.current = 0
  }, [temperature, seaLevel, comparisonYear])

  useEffect(() => {
    updateCharts()
  }, [stats, updateCharts])

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode)
    if (!cameraRef.current || !controlsRef.current) return

    const camera = cameraRef.current
    const controls = controlsRef.current

    switch (mode) {
      case 'top':
        camera.position.set(0, 40, 0.01)
        controls.target.set(0, 0, 0)
        break
      case 'side':
        camera.position.set(40, 15, 0)
        controls.target.set(0, 2, 0)
        break
      case 'free':
        camera.position.set(20, 20, 20)
        controls.target.set(0, 0, 0)
        break
    }
    controls.update()
  }

  const handleTemperatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTemperature(parseFloat(e.target.value))
  }

  const handleSeaLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSeaLevel(parseFloat(e.target.value))
  }

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setComparisonYear(value ? parseInt(value) : null)
  }

  const sliderStyle: React.CSSProperties = {
    width: '100%',
    height: '6px',
    borderRadius: '3px',
    outline: 'none',
    WebkitAppearance: 'none',
    appearance: 'none',
    cursor: 'pointer',
    transition: 'transform 0.3s ease',
  }

  const getSliderThumbStyle = (color: string): React.CSSProperties => ({
    WebkitAppearance: 'none',
    appearance: 'none',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    background: color,
    cursor: 'pointer',
    boxShadow: `0 2px 6px ${color}66`,
    transition: 'transform 0.3s ease',
  })

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(to bottom, #87CEEB 0%, #FFFFFF 100%)',
      }}
    >
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: isMobile ? 0 : '340px',
          bottom: isMobile ? '200px' : '120px',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
          }}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: isMobile ? '120px' : '140px',
          left: '20px',
          display: 'flex',
          gap: '12px',
          zIndex: 10,
        }}
      >
        {(['top', 'side', 'free'] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => handleViewChange(mode)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: viewMode === mode ? '3px solid #63B3ED' : 'none',
              background: '#4A5568',
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 600,
              transition: 'all 0.3s ease',
              transform: viewMode === mode ? 'scale(1.05)' : 'scale(1)',
              boxShadow:
                viewMode === mode
                  ? '0 0 15px rgba(99, 179, 237, 0.5)'
                  : '0 2px 8px rgba(0,0,0,0.3)',
            }}
            onMouseEnter={(e) => {
              if (viewMode !== mode) {
                e.currentTarget.style.transform = 'scale(1.05)'
              }
            }}
            onMouseLeave={(e) => {
              if (viewMode !== mode) {
                e.currentTarget.style.transform = 'scale(1)'
              }
            }}
            title={mode === 'top' ? '俯视' : mode === 'side' ? '侧视' : '自由视角'}
          >
            {mode === 'top' ? '↑' : mode === 'side' ? '→' : '◎'}
          </button>
        ))}
      </div>

      <div
        style={{
          position: 'absolute',
          ...(isMobile
            ? {
                bottom: '100px',
                left: '20px',
                right: '20px',
                width: 'auto',
                display: 'flex',
                gap: '20px',
                flexWrap: 'wrap',
              }
            : {
                top: '20px',
                right: '20px',
                width: '320px',
              }),
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderRadius: '16px',
          padding: '20px',
          zIndex: 10,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}
      >
        <h2
          style={{
            margin: '0 0 20px 0',
            fontSize: '18px',
            fontWeight: 700,
            color: '#1A202C',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          气候控制面板
        </h2>

        <div style={{ marginBottom: '20px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <label
              style={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#A0AEC0',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              温度变化
            </label>
            <span
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#FF6B6B',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {temperature > 0 ? '+' : ''}
              {temperature.toFixed(1)}°C
            </span>
          </div>
          <input
            type="range"
            min="-10"
            max="10"
            step="0.1"
            value={temperature}
            onChange={handleTemperatureChange}
            style={{
              ...sliderStyle,
              background: `linear-gradient(to right, #4A90D9 0%, #4A90D9 ${
                ((temperature + 10) / 20) * 100
              }%, #CBD5E0 ${((temperature + 10) / 20) * 100}%, #CBD5E0 100%)`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
          />
          <style>{`
            input[type="range"]::-webkit-slider-thumb {
              ${Object.entries(getSliderThumbStyle('#FF6B6B'))
                .map(([k, v]) => `${k}: ${v};`)
                .join('\n')}
            }
            input[type="range"]::-moz-range-thumb {
              ${Object.entries(getSliderThumbStyle('#FF6B6B'))
                .map(([k, v]) => `${k}: ${v};`)
                .join('\n')}
            }
          `}</style>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '4px',
              fontSize: '11px',
              color: '#A0AEC0',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <span>-10°C</span>
            <span>10°C</span>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <label
              style={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#A0AEC0',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              海平面上升
            </label>
            <span
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#48C774',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {seaLevel.toFixed(1)} m
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="5"
            step="0.1"
            value={seaLevel}
            onChange={handleSeaLevelChange}
            style={{
              ...sliderStyle,
              background: `linear-gradient(to right, #4A90D9 0%, #4A90D9 ${
                (seaLevel / 5) * 100
              }%, #CBD5E0 ${(seaLevel / 5) * 100}%, #CBD5E0 100%)`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
          />
          <style>{`
            input[type="range"]::-webkit-slider-thumb {
              ${Object.entries(getSliderThumbStyle('#48C774'))
                .map(([k, v]) => `${k}: ${v};`)
                .join('\n')}
            }
            input[type="range"]::-moz-range-thumb {
              ${Object.entries(getSliderThumbStyle('#48C774'))
                .map(([k, v]) => `${k}: ${v};`)
                .join('\n')}
            }
          `}</style>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '4px',
              fontSize: '11px',
              color: '#A0AEC0',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <span>0m</span>
            <span>5m</span>
          </div>
        </div>

        <div>
          <label
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: '#A0AEC0',
              marginBottom: '8px',
              display: 'block',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            对比年份
          </label>
          <select
            value={comparisonYear ?? ''}
            onChange={handleYearChange}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              color: '#1A202C',
              fontSize: '14px',
              fontFamily: "'Inter', sans-serif",
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              outline: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#4A90D9'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#E2E8F0'
            }}
          >
            <option value="">不对比</option>
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}年
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: isMobile ? 0 : '320px',
          height: isMobile ? '100px' : '100px',
          background: '#1A202C',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          gap: '20px',
          zIndex: 10,
          overflowX: 'auto',
          ...(isMobile && statsCollapsed
            ? { height: '40px', padding: '8px 12px' }
            : {}),
        }}
      >
        {isMobile && (
          <button
            onClick={() => setStatsCollapsed(!statsCollapsed)}
            style={{
              position: 'absolute',
              top: '-20px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#1A202C',
              border: 'none',
              color: '#A0AEC0',
              padding: '4px 16px',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            {statsCollapsed ? '展开统计 ▲' : '收起统计 ▼'}
          </button>
        )}

        {(!isMobile || !statsCollapsed) && (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                minWidth: '280px',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '16px',
                    color: '#FFFFFF',
                    fontFamily: "'Inter', sans-serif",
                    marginBottom: '2px',
                  }}
                >
                  冰川面积
                </div>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#68D391',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {stats.area.toLocaleString()}
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 400,
                      color: '#A0AEC0',
                      marginLeft: '4px',
                    }}
                  >
                    km²
                  </span>
                </div>
              </div>
              <canvas
                ref={areaChartRef}
                width={150}
                height={40}
                style={{
                  background: 'transparent',
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                minWidth: '280px',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '16px',
                    color: '#FFFFFF',
                    fontFamily: "'Inter', sans-serif",
                    marginBottom: '2px',
                  }}
                >
                  冰川体积
                </div>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#63B3ED',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {stats.volume.toLocaleString()}
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 400,
                      color: '#A0AEC0',
                      marginLeft: '4px',
                    }}
                  >
                    km³
                  </span>
                </div>
              </div>
              <canvas
                ref={volumeChartRef}
                width={150}
                height={40}
                style={{
                  background: 'transparent',
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                minWidth: '280px',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '16px',
                    color: '#FFFFFF',
                    fontFamily: "'Inter', sans-serif",
                    marginBottom: '2px',
                  }}
                >
                  海平面贡献
                </div>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#F6AD55',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {stats.seaLevelContribution.toFixed(2)}
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 400,
                      color: '#A0AEC0',
                      marginLeft: '4px',
                    }}
                  >
                    mm
                  </span>
                </div>
              </div>
              <canvas
                ref={seaLevelChartRef}
                width={150}
                height={40}
                style={{
                  background: 'transparent',
                }}
              />
            </div>
          </>
        )}
      </div>

      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 10,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: 700,
            color: '#FFFFFF',
            fontFamily: "'Inter', sans-serif",
            textShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          Glacier Climate Explorer
        </h1>
        <p
          style={{
            margin: '8px 0 0 0',
            fontSize: '14px',
            color: 'rgba(255,255,255,0.8)',
            fontFamily: "'Inter', sans-serif",
            textShadow: '0 1px 4px rgba(0,0,0,0.3)',
          }}
        >
          拖动滑块探索气候变化对冰川的影响
        </p>
      </div>
    </div>
  )
}

export default ClimateExplorer
