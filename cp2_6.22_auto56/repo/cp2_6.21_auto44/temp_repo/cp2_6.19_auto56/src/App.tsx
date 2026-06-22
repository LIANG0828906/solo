import React, { useState, useEffect, useRef, useCallback } from 'react'
import { sceneManager } from './modules/scene/SceneManager'
import { pdbLoader } from './modules/loader/PdbLoader'
import UIControls from './modules/ui/UIControls'
import Tooltip from './modules/ui/Tooltip'
import type { Residue, Measurement, ModelMode, ResidueLabel, Atom, StructureData } from './types'

const App: React.FC = () => {
  const sceneContainerRef = useRef<HTMLDivElement>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  const [structureData, setStructureData] = useState<StructureData | null>(null)
  const [modelMode, setModelMode] = useState<ModelMode>('ballstick')
  const [selectedResidue, setSelectedResidue] = useState<Residue | null>(null)
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [labels, setLabels] = useState<ResidueLabel[]>([])

  const [loading, setLoading] = useState(false)
  const [loadProgress, setLoadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const [hoverAtom, setHoverAtom] = useState<Atom | null>(null)
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null)

  const [labelPositions, setLabelPositions] = useState<{ id: number; x: number; y: number; text: string }[]>([])
  const [measurementLabelPositions, setMeasurementLabelPositions] = useState<{ id: string; x: number; y: number; distance: number }[]>([])

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  const [isMeasuringMode, setIsMeasuringMode] = useState(false)
  const [measuringAtom, setMeasuringAtom] = useState<Atom | null>(null)

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (sceneContainerRef.current && !isInitialized) {
      sceneManager.init(sceneContainerRef.current, {
        onResidueSelect: (residue) => {
          setSelectedResidue(residue)
        },
        onHover: (atom, position) => {
          setHoverAtom(atom)
          setHoverPosition(position)
        },
        onLabelPositionUpdate: (positions) => {
          setLabelPositions(positions)
        },
        onMeasurementLabelUpdate: (positions) => {
          setMeasurementLabelPositions(positions)
        },
        onMeasurementAdded: () => {
          setMeasurements(sceneManager.getMeasurements())
        },
        onMeasuringAtomChange: (atom) => {
          setMeasuringAtom(atom)
        }
      })
      setIsInitialized(true)
    }

    return () => {
      if (isInitialized) {
        sceneManager.dispose()
      }
    }
  }, [isInitialized])

  const readFileWithProgress = (file: File, onProgress: (progress: number) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(e.loaded / e.total)
        }
      }

      reader.onload = () => {
        onProgress(1)
        resolve(reader.result as string)
      }

      reader.onerror = () => {
        reject(new Error('文件读取失败'))
      }

      reader.readAsText(file)
    })
  }

  const handleFileLoad = useCallback(async (file: File) => {
    setLoading(true)
    setLoadProgress(0)
    setError(null)

    try {
      const text = await readFileWithProgress(file, (progress) => {
        setLoadProgress(progress * 0.5)
      })

      const validation = pdbLoader.validate(text)
      if (!validation.valid) {
        throw new Error(validation.error || 'PDB文件格式错误，请检查文件内容')
      }

      setLoadProgress(60)

      const result = pdbLoader.parse(text)

      if (!result.success || !result.data) {
        throw new Error(result.error || 'PDB文件解析失败')
      }

      setLoadProgress(100)

      setStructureData(result.data)
      sceneManager.loadStructure(result.data)
      setSelectedResidue(null)
      setMeasurements([])
      setLabels([])
      setIsMeasuringMode(false)

      setTimeout(() => {
        setLoading(false)
      }, 300)

    } catch (err) {
      setError(err instanceof Error ? err.message : '文件加载失败')
      setLoading(false)
    }
  }, [])

  const handleModeChange = useCallback((mode: ModelMode) => {
    setModelMode(mode)
    sceneManager.toggleModelMode(mode)
  }, [])

  const handleAddLabel = useCallback((text: string) => {
    if (selectedResidue) {
      sceneManager.addLabel(selectedResidue.id, text)
      setLabels(sceneManager.getLabels())
    }
  }, [selectedResidue])

  const handleRemoveLabel = useCallback((residueId: number) => {
    sceneManager.removeLabel(residueId)
    setLabels(sceneManager.getLabels())
  }, [])

  const handleToggleMeasurementMode = useCallback(() => {
    sceneManager.toggleMeasurementMode()
    setIsMeasuringMode(sceneManager.getMeasuringMode())
  }, [])

  const handleRemoveMeasurement = useCallback((id: string) => {
    sceneManager.removeMeasurement(id)
    setMeasurements(sceneManager.getMeasurements())
  }, [])

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev)
  }, [])

  useEffect(() => {
    if (structureData) {
      setMeasurements(sceneManager.getMeasurements())
    }
  }, [structureData])

  useEffect(() => {
    if (isMobile && isInitialized) {
      const timer = setTimeout(() => {
        window.dispatchEvent(new Event('resize'))
      }, 400)
      return () => clearTimeout(timer)
    }
  }, [sidebarOpen, isMobile, isInitialized])

  return (
    <div className="app-container">
      <div
        className="scene-container"
        ref={sceneContainerRef}
        style={isMobile ? { height: sidebarOpen ? '50vh' : '100vh' } : undefined}
      >
        <canvas className="scene-canvas" />

        {loading && (
          <div className="loading-progress">
            <div
              className="loading-progress-bar"
              style={{ width: `${loadProgress}%` }}
            />
          </div>
        )}

        {error && (
          <div className="warning-toast">
            {error}
          </div>
        )}

        <Tooltip atom={hoverAtom} position={hoverPosition} />

        {labelPositions.map((label) => (
          <div
            key={`label-${label.id}`}
            className="label-annotation"
            style={{
              left: label.x,
              top: label.y
            }}
          >
            {label.text}
          </div>
        ))}

        {measurementLabelPositions.map((m) => (
          <div
            key={`meas-${m.id}`}
            className="measurement-distance-label"
            style={{
              left: m.x,
              top: m.y
            }}
          >
            {m.distance.toFixed(2)} Å
          </div>
        ))}

        {isMobile && (
          <button className="mobile-menu-btn" onClick={handleToggleSidebar}>
            ☰
          </button>
        )}
      </div>

      {(!isMobile || sidebarOpen) && (
        <UIControls
          modelMode={modelMode}
          selectedResidue={selectedResidue}
          measurements={measurements}
          labels={labels}
          isMeasuringMode={isMeasuringMode}
          measuringAtom={measuringAtom}
          isMobile={isMobile}
          sidebarOpen={sidebarOpen}
          onFileLoad={handleFileLoad}
          onModeChange={handleModeChange}
          onAddLabel={handleAddLabel}
          onRemoveLabel={handleRemoveLabel}
          onToggleMeasurementMode={handleToggleMeasurementMode}
          onRemoveMeasurement={handleRemoveMeasurement}
          onToggleSidebar={handleToggleSidebar}
        />
      )}
    </div>
  )
}

export default App
