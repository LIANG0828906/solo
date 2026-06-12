import React, { useMemo, useRef, useState } from 'react'
import { useInteriorStore } from '../../store/useInteriorStore'
import {
  getMaterialsByCategory,
  STYLE_PRESETS,
  findMaterialById,
} from '../material/MaterialLibrary'
import type { AreaId, MaterialPreset } from '../../types'

interface UIManagerProps {
  sceneRef: React.MutableRefObject<{
    applyStyle: (id: any) => void
    setAreaMaterial: (a: AreaId, mid: string) => void
    animateCameraTo: (v: any) => void
    resetCamera: () => void
    rotateCamera: (d: number) => void
    setFloorTextureImage: (url: string) => void
    clearFloorTexture: () => void
  } | null>
}

const AREA_LABEL: Record<AreaId, string> = {
  floor: '地板',
  wall_north: '北墙',
  wall_south: '南墙',
  wall_east: '东墙',
  wall_west: '西墙',
}

export function UIManager({ sceneRef }: UIManagerProps) {
  const selectedStyle = useInteriorStore((s) => s.selectedStyle)
  const selectedArea = useInteriorStore((s) => s.selectedArea)
  const fps = useInteriorStore((s) => s.fps)
  const history = useInteriorStore((s) => s.history)
  const materialAssignments = useInteriorStore((s) => s.materialAssignments)
  const currentView = useInteriorStore((s) => s.currentView)
  const setStyle = useInteriorStore((s) => s.setStyle)
  const setSelectedArea = useInteriorStore((s) => s.setSelectedArea)
  const replaceMaterial = useInteriorStore((s) => s.replaceMaterial)
  const undo = useInteriorStore((s) => s.undo)
  const setFloorTexture = useInteriorStore((s) => s.setFloorTexture)
  const setCurrentView = useInteriorStore((s) => s.setCurrentView)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  const selectedMaterials = useMemo(() => {
    return Object.keys(materialAssignments).filter((k) =>
      ['floor', 'wall_north', 'wall_south', 'wall_east', 'wall_west'].includes(k),
    ).length
  }, [materialAssignments])

  const currentStyleName = STYLE_PRESETS.find((s) => s.id === selectedStyle)?.name ?? '现代风格'

  const handleStyleClick = (id: any) => {
    setStyle(id)
    sceneRef.current?.applyStyle(id)
  }

  const handleMaterialPick = (mat: MaterialPreset) => {
    if (!selectedArea) return
    replaceMaterial(selectedArea, mat.id)
    sceneRef.current?.setAreaMaterial(selectedArea, mat.id)
  }

  const handleUndo = () => {
    undo()
    const step = history[history.length - 1]
    if (step) {
      sceneRef.current?.setAreaMaterial(step.area, step.prevMaterialId)
    }
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const url = reader.result as string
      setFloorTexture(url)
      sceneRef.current?.setFloorTextureImage(url)
    }
    reader.readAsDataURL(file)
  }

  const handleRotateLeft = () => sceneRef.current?.rotateCamera(-15)
  const handleRotateRight = () => sceneRef.current?.rotateCamera(15)
  const handleReset = () => {
    sceneRef.current?.resetCamera()
    setCurrentView('top')
  }
  const handleToggleView = () => {
    const next = currentView === 'top' ? 'firstPerson' : 'top'
    sceneRef.current?.animateCameraTo(next)
    setCurrentView(next)
  }

  const category =
    selectedArea === 'floor' ? 'floor' : selectedArea?.startsWith('wall_') ? 'wall' : 'wall'
  const availableMaterials = getMaterialsByCategory(category).slice(0, 8)

  return (
    <>
      <aside
        className="panel-left absolute top-0 left-0 bottom-12 z-10 p-4 flex flex-col gap-4 pointer-events-none"
        style={{ pointerEvents: 'none' }}
      >
        <div className="glass-panel rounded-xl p-4 pointer-events-auto fade-in">
          <h2 className="text-lg font-semibold mb-3 text-[#2c3e50]">装修风格</h2>
          <div className="flex flex-col gap-3">
            {STYLE_PRESETS.map((style) => {
              const active = style.id === selectedStyle
              const floorColor = findMaterialById(style.materials.floor)?.color ?? '#ddd'
              const wallColor = findMaterialById(style.materials.walls.north)?.color ?? '#fff'
              const sofaColor = findMaterialById(style.materials.sofa)?.color ?? '#aaa'
              return (
                <button
                  key={style.id}
                  onClick={() => handleStyleClick(style.id)}
                  className={`style-card text-left rounded-xl overflow-hidden border transition-all ${
                    active
                      ? 'border-[#2c3e50] ring-2 ring-[#2c3e50]/30'
                      : 'border-white/50'
                  }`}
                >
                  <div
                    className="h-20 w-full relative"
                    style={{
                      background: `linear-gradient(135deg, ${floorColor} 0%, ${wallColor} 55%, ${sofaColor} 100%)`,
                    }}
                  >
                    <div className="absolute bottom-1 right-2 text-[10px] text-black/60 bg-white/60 px-1.5 py-0.5 rounded">
                      {active ? '已选' : '点击'}
                    </div>
                  </div>
                  <div className="p-2 bg-white/60 backdrop-blur-sm">
                    <div className="font-semibold text-sm text-[#2c3e50]">{style.name}</div>
                    <div className="text-[11px] text-[#2c3e50]/70">{style.description}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="glass-panel rounded-xl p-4 pointer-events-auto fade-in">
          <h2 className="text-lg font-semibold mb-3 text-[#2c3e50]">平面图上传</h2>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={handleUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2 px-3 rounded-lg bg-[#2c3e50] text-white text-sm hover:bg-[#34495e] transition"
          >
            <i className="fa-solid fa-upload mr-2" />
            上传房间平面图 (jpg/png)
          </button>
          <button
            onClick={() => {
              setFloorTexture(null)
              sceneRef.current?.clearFloorTexture()
            }}
            className="w-full mt-2 py-1.5 px-3 rounded-lg border border-[#2c3e50]/30 text-[#2c3e50] text-xs hover:bg-[#2c3e50]/10 transition"
          >
            清除自定义纹理
          </button>
        </div>
      </aside>

      <aside className="panel-right absolute top-0 right-0 bottom-12 z-10 p-4 pointer-events-none">
        <div className="glass-panel rounded-xl p-4 pointer-events-auto fade-in">
          <h2 className="text-lg font-semibold mb-3 text-[#2c3e50]">视角控制</h2>
          <div className="flex flex-col gap-4 items-center">
            <div className="flex gap-3">
              <button className="view-btn" onClick={handleRotateLeft} title="向左旋转15°">
                <i className="fa-solid fa-rotate-left" />
              </button>
              <button className="view-btn" onClick={handleRotateRight} title="向右旋转15°">
                <i className="fa-solid fa-rotate-right" />
              </button>
            </div>
            <button className="view-btn" onClick={handleReset} title="复位初始视角">
              <i className="fa-solid fa-house" />
            </button>
            <button
              className="view-btn"
              onClick={handleToggleView}
              title={currentView === 'top' ? '进入室内第一人称' : '回到俯视视角'}
            >
              <i
                className={`fa-solid ${
                  currentView === 'top' ? 'fa-person-walking' : 'fa-arrow-up-wide-short'
                }`}
              />
            </button>
            <div className="text-xs text-[#2c3e50]/70 mt-2 text-center leading-relaxed">
              当前视图
              <br />
              <strong className="text-[#2c3e50]">
                {currentView === 'top' ? '俯视 (45°)' : '室内第一人称'}
              </strong>
            </div>
          </div>
        </div>
      </aside>

      {selectedArea && (
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 z-10 glass-panel rounded-xl px-4 py-2 text-sm fade-in pointer-events-auto cursor-pointer hover:bg-white/40"
          onClick={() => setPanelOpen((v) => !v)}
        >
          <i className="fa-solid fa-layer-group mr-2 text-[#2c3e50]" />
          已选中：<strong className="text-[#2c3e50]">{AREA_LABEL[selectedArea]}</strong>
          <span className="ml-2 text-xs text-[#2c3e50]/70">（点击打开/关闭材质面板）</span>
        </div>
      )}

      {selectedArea && panelOpen && (
        <div
          className="absolute left-1/2 top-20 -translate-x-1/2 z-20 dark-glass-panel rounded-2xl p-5 w-[520px] fade-in pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-white">
              <div className="text-lg font-semibold">替换 {AREA_LABEL[selectedArea]} 材质</div>
              <div className="text-xs text-white/60 mt-1">从以下 8 种材质中选择</div>
            </div>
            <div className="flex gap-2">
              <button
                disabled={history.length === 0}
                onClick={handleUndo}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm transition"
                title={`撤销 (剩余${5 - history.length}步)`}
              >
                <i className="fa-solid fa-rotate-left mr-1.5" />
                撤销 ({history.length}/5)
              </button>
              <button
                onClick={() => {
                  setPanelOpen(false)
                  setSelectedArea(null)
                }}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {availableMaterials.map((mat) => {
              const current = materialAssignments[selectedArea]
              const selected = current === mat.id
              return (
                <button
                  key={mat.id}
                  onClick={() => handleMaterialPick(mat)}
                  className={`material-card text-left border border-white/10 ${
                    selected ? 'selected' : ''
                  }`}
                >
                  <div
                    className="h-20 w-full"
                    style={{ backgroundColor: mat.color }}
                  />
                  <div className="p-2 bg-black/40">
                    <div className="text-xs text-white font-medium truncate">{mat.name}</div>
                    <div className="text-[10px] text-white/60 mt-0.5">
                      R{mat.roughness.toFixed(2)} · M{mat.metalness.toFixed(2)}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <footer className={`status-bar absolute bottom-0 left-0 right-0 z-10 ${fps < 20 ? 'warn' : ''}`}>
        <div className="flex items-center gap-2 text-sm">
          <i className={`fa-solid ${fps < 20 ? 'fa-triangle-exclamation text-red-200' : 'fa-gauge-high'}`} />
          <span>FPS:</span>
          <span className="font-mono font-semibold min-w-[40px]">{fps}</span>
          {fps < 20 && <span className="text-xs text-red-200 ml-2">帧率较低</span>}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <i className="fa-solid fa-palette" />
          <span>已选材质：</span>
          <span className="font-mono font-semibold">{selectedMaterials}</span>
          <span className="text-white/50">/ 5</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <i className="fa-solid fa-house-chimney" />
          <span>当前风格：</span>
          <span className="font-semibold">{currentStyleName}</span>
        </div>
      </footer>
    </>
  )
}
