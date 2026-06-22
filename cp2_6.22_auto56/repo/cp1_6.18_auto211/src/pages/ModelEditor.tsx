import { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import { SceneManager } from '@/modules/scene/SceneManager'
import { ModelLoader } from '@/modules/scene/ModelLoader'
import DeformationEngine from '@/modules/editor/DeformationEngine'
import { ControlPointHandler } from '@/modules/editor/ControlPointHandler'
import { ShareManager } from '@/modules/share/ShareManager'
import { useEditorStore } from '@/store/useEditorStore'
import {
  Upload,
  RotateCcw,
  Download,
  Share2,
  Box,
  Waves,
  Droplets,
} from 'lucide-react'

const MAX_FILE_SIZE = 50 * 1024 * 1024

export default function ModelEditor() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneManagerRef = useRef<SceneManager | null>(null)
  const controlPointHandlerRef = useRef<ControlPointHandler | null>(null)
  const deformationEnginesRef = useRef<Map<string, DeformationEngine>>(new Map())
  const originalVerticesRef = useRef<Map<string, Float32Array>>(new Map())
  const fileInputRef = useRef<HTMLInputElement>(null)
  const animFrameRef = useRef<number>(0)
  const currentGroupRef = useRef<THREE.Group | null>(null)

  const {
    modelName,
    uploadTime,
    isLoading,
    loadProgress,
    subdivisionLevel,
    noiseIntensity,
    smoothness,
    isDragging,
    isReadOnly,
    showCopyToast,
    setModelInfo,
    setLoading,
    setLoadProgress,
    setSubdivisionLevel,
    setNoiseIntensity,
    setSmoothness,
    setReadOnly,
    setShowCopyToast,
    resetDeformation,
    undo,
    redo,
    pushHistory,
  } = useEditorStore()

  useEffect(() => {
    if (!containerRef.current) return
    const sm = new SceneManager(containerRef.current)
    sceneManagerRef.current = sm
    const cph = new ControlPointHandler(sm, containerRef.current)
    controlPointHandlerRef.current = cph

    if (isReadOnly) {
      cph.setEnabled(false)
    }

    const url = window.location.href
    const shareData = ShareManager.extractShareDataFromUrl(url)
    if (shareData) {
      setReadOnly(true)
      cph.setEnabled(false)
      loadFromShareData(shareData)
    }

    const handleResize = () => {
      if (!containerRef.current || !sm) return
      const w = containerRef.current.clientWidth
      const h = containerRef.current.clientHeight
      sm.resize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cph.dispose()
      sm.dispose()
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isReadOnly) return
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Z') {
        e.preventDefault()
        const entry = redo()
        if (entry) applyHistoryEntry(entry)
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        const entry = undo()
        if (entry) applyHistoryEntry(entry)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isReadOnly, undo, redo])

  useEffect(() => {
    if (isReadOnly || !currentGroupRef.current) return
    const timer = setTimeout(() => {
      applyDeformation()
    }, 16)
    return () => clearTimeout(timer)
  }, [subdivisionLevel, noiseIntensity, smoothness])

  const loadFromShareData = useCallback(
    (data: {
      modelName: string
      subdivisionLevel: number
      noiseIntensity: number
      smoothness: number
      vertexPositions: number[]
      originalVertices: number[]
    }) => {
      setModelInfo(data.modelName)
      setSubdivisionLevel(data.subdivisionLevel)
      setNoiseIntensity(data.noiseIntensity)
      setSmoothness(data.smoothness)
    },
    []
  )

  const applyDeformation = useCallback(() => {
    const sm = sceneManagerRef.current
    const group = currentGroupRef.current
    if (!sm || !group) return

    group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        const geometry = mesh.geometry
        const position = geometry.getAttribute('position') as THREE.BufferAttribute
        if (!position) return

        const origVerts = originalVerticesRef.current.get(mesh.uuid)
        if (!origVerts) return

        const indexAttr = geometry.getIndex()
        if (!indexAttr) return

        let engine = deformationEnginesRef.current.get(mesh.uuid)
        if (!engine) {
          engine = new DeformationEngine(
            origVerts,
            indexAttr.array as Uint16Array | Uint32Array
          )
          deformationEnginesRef.current.set(mesh.uuid, engine)
        }

        const cps = useEditorStore.getState().controlPoints
        const controlPointsForEngine = cps
          .map((cp) => {
            let closestIdx = 0
            let closestDist = Infinity
            const posArray = origVerts
            for (let i = 0; i < posArray.length / 3; i++) {
              const dx = posArray[i * 3] - cp.position[0]
              const dy = posArray[i * 3 + 1] - cp.position[1]
              const dz = posArray[i * 3 + 2] - cp.position[2]
              const dist = dx * dx + dy * dy + dz * dz
              if (dist < closestDist) {
                closestDist = dist
                closestIdx = i
              }
            }
            return {
              vertexIndex: closestIdx,
              displacement: cp.displacement,
              normal: cp.normal as [number, number, number],
            }
          })

        const result = engine.applyAll({
          noiseIntensity: noiseIntensity,
          smoothness: smoothness,
          controlPoints: controlPointsForEngine.length > 0 ? controlPointsForEngine : undefined,
        })

        for (let i = 0; i < result.length / 3; i++) {
          position.setXYZ(i, result[i * 3], result[i * 3 + 1], result[i * 3 + 2])
        }
        position.needsUpdate = true
        geometry.computeVertexNormals()
      }
    })
  }, [noiseIntensity, smoothness])

  const applyHistoryEntry = useCallback(
    (entry: { subdivisionLevel: number; noiseIntensity: number; smoothness: number }) => {
      setSubdivisionLevel(entry.subdivisionLevel)
      setNoiseIntensity(entry.noiseIntensity)
      setSmoothness(entry.smoothness)
      applyDeformation()
    },
    [applyDeformation]
  )

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      if (file.size > MAX_FILE_SIZE) {
        alert('文件大小超过50MB限制')
        return
      }

      setLoading(true)
      setLoadProgress(0)
      setModelInfo(file.name)

      try {
        const result = await ModelLoader.load(file, (progress) => {
          setLoadProgress(progress)
        })

        const sm = sceneManagerRef.current
        if (sm) {
          sm.setModel(result.group, result.boundingBox)
          currentGroupRef.current = result.group
          originalVerticesRef.current = result.originalVertices
          deformationEnginesRef.current.clear()
        }

        setLoading(false)
        setLoadProgress(100)
      } catch (error) {
        console.error('模型加载失败:', error)
        setLoading(false)
        alert('模型加载失败，请检查文件格式')
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    []
  )

  const handleExport = useCallback(async () => {
    const group = currentGroupRef.current
    if (!group) return

    const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js')
    const exporter = new GLTFExporter()
    exporter.parse(
      group,
      (result) => {
        const blob = new Blob(
          [JSON.stringify(result)],
          { type: 'application/json' }
        )
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${modelName || 'model'}.gltf`
        a.click()
        URL.revokeObjectURL(url)
      },
      (error) => {
        console.error('导出失败:', error)
      },
      { binary: false }
    )
  }, [modelName])

  const handleShare = useCallback(async () => {
    const group = currentGroupRef.current
    if (!group) return

    const vertexPositions: number[] = []
    const originalVerts: number[] = []

    group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        const position = mesh.geometry.getAttribute('position') as THREE.BufferAttribute
        if (position) {
          for (let i = 0; i < position.count * 3; i++) {
            vertexPositions.push(position.array[i])
          }
        }
        const orig = originalVerticesRef.current.get(mesh.uuid)
        if (orig) {
          for (let i = 0; i < orig.length; i++) {
            originalVerts.push(orig[i])
          }
        }
      }
    })

    const shareUrl = ShareManager.generateShareUrl({
      modelName,
      subdivisionLevel,
      noiseIntensity,
      smoothness,
      vertexPositions,
      originalVertices: originalVerts,
    })

    const success = await ShareManager.copyToClipboard(shareUrl)
    if (success) {
      setShowCopyToast(true)
      setTimeout(() => setShowCopyToast(false), 500)
    }
  }, [modelName, subdivisionLevel, noiseIntensity, smoothness])

  const handleReset = useCallback(() => {
    resetDeformation()
    deformationEnginesRef.current.forEach((engine) => engine.reset())
    const sm = sceneManagerRef.current
    const group = currentGroupRef.current
    if (sm && group) {
      group.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh
          const orig = originalVerticesRef.current.get(mesh.uuid)
          const position = mesh.geometry.getAttribute('position') as THREE.BufferAttribute
          if (orig && position) {
            for (let i = 0; i < orig.length / 3; i++) {
              position.setXYZ(i, orig[i * 3], orig[i * 3 + 1], orig[i * 3 + 2])
            }
            position.needsUpdate = true
            mesh.geometry.computeVertexNormals()
          }
        }
      })
    }
  }, [resetDeformation])

  return (
    <div className="flex flex-col md:flex-row w-full h-screen overflow-hidden bg-[#0B0F19]">
      <div className="relative flex-1 md:w-[75%] h-[60%] md:h-full" ref={containerRef}>
        {isLoading && (
          <div className="absolute top-0 left-0 right-0 z-10 h-1 bg-[#1A202C]">
            <div
              className="h-full bg-[#4FD1C5] transition-all duration-300 ease-out"
              style={{ width: `${loadProgress}%` }}
            />
          </div>
        )}
        {!currentGroupRef.current && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <Box className="w-16 h-16 mx-auto mb-4 text-[#4A5568]" />
              <p className="text-[#A0AEC0] text-lg">上传glTF模型开始预览</p>
            </div>
          </div>
        )}
        {showCopyToast && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 bg-[#48BB78] text-white px-4 py-2 rounded-lg text-sm font-medium animate-fade-in">
            链接已复制
          </div>
        )}
      </div>

      <div className="w-full md:w-[320px] md:min-w-[320px] h-[40%] md:h-full bg-[#1A202C] rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none overflow-y-auto border-t md:border-t-0 md:border-l border-[#2D3748]">
        <div className="p-5 space-y-4">
          <div className="backdrop-blur-[12px] bg-[rgba(26,32,44,0.8)] border border-[#2D3748] rounded-xl p-4">
            <h2 className="text-white text-lg font-bold truncate">
              {modelName || '未加载模型'}
            </h2>
            <p className="text-[#718096] text-xs mt-1">
              {uploadTime || '等待上传...'}
            </p>
          </div>

          {!isReadOnly && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[rgba(79,209,197,0.15)] border border-[#4FD1C5] text-[#4FD1C5] text-sm font-medium hover:bg-[rgba(79,209,197,0.25)] transition-all duration-200 ease-out disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              上传模型
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".gltf,.glb"
            className="hidden"
            onChange={handleFileUpload}
          />

          <div className="backdrop-blur-[12px] bg-[rgba(26,32,44,0.8)] border border-[#2D3748] rounded-xl p-4 space-y-3">
            <h3 className="text-[#A0AEC0] text-sm font-medium">顶点编辑</h3>
            <p className="text-[#A0AEC0] text-sm text-center py-4">
              点击模型表面开始编辑
            </p>
            {!isReadOnly && (
              <button
                onClick={handleReset}
                className="w-full py-2 rounded-lg bg-[#E53E3E] text-white text-sm font-medium hover:brightness-95 active:scale-[0.98] transition-all duration-200 ease-out"
              >
                <RotateCcw className="w-3.5 h-3.5 inline mr-1.5" />
                重置变形
              </button>
            )}
          </div>

          <div className="backdrop-blur-[12px] bg-[rgba(26,32,44,0.8)] border border-[#2D3748] rounded-xl p-4 space-y-4">
            <h3 className="text-[#A0AEC0] text-sm font-medium">参数调整</h3>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[#A0AEC0] text-sm flex items-center gap-1.5">
                  <Box className="w-3.5 h-3.5" /> 细分级别
                </label>
                <span className="text-[#A0AEC0] text-sm font-mono">{subdivisionLevel}</span>
              </div>
              <input
                type="range"
                min={1}
                max={4}
                step={1}
                value={subdivisionLevel}
                onChange={(e) => setSubdivisionLevel(Number(e.target.value))}
                disabled={isReadOnly}
                className="slider w-full"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[#A0AEC0] text-sm flex items-center gap-1.5">
                  <Waves className="w-3.5 h-3.5" /> 噪声强度
                </label>
                <span className="text-[#A0AEC0] text-sm font-mono">
                  {noiseIntensity.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={noiseIntensity}
                onChange={(e) => setNoiseIntensity(Number(e.target.value))}
                disabled={isReadOnly}
                className="slider w-full"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[#A0AEC0] text-sm flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5" /> 平滑度
                </label>
                <span className="text-[#A0AEC0] text-sm font-mono">
                  {smoothness.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={smoothness}
                onChange={(e) => setSmoothness(Number(e.target.value))}
                disabled={isReadOnly}
                className="slider w-full"
              />
            </div>
          </div>

          {!isReadOnly && (
            <div className="flex gap-4">
              <button
                onClick={handleExport}
                className="flex-1 py-2.5 rounded-lg bg-[#48BB78] text-white text-sm font-medium hover:brightness-110 active:scale-[0.95] transition-all duration-200 ease-out flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                导出
              </button>
              <button
                onClick={handleShare}
                className="flex-1 py-2.5 rounded-lg bg-[#3182CE] text-white text-sm font-medium hover:brightness-110 active:scale-[0.95] transition-all duration-200 ease-out flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-4 h-4" />
                分享
              </button>
            </div>
          )}

          {isReadOnly && (
            <div className="text-center py-3">
              <span className="text-[#718096] text-xs">只读模式 · 分享链接预览</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
