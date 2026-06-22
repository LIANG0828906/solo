import { useState, useCallback, useRef } from 'react'
import EditorCanvas from './components/EditorCanvas'
import ToolPanel from './components/ToolPanel'
import { useHistory } from './hooks/useHistory'
import { useToast } from './hooks/useToast'
import { saveLevel, loadLevel } from './api'
import type { ToolType, Viewport, LevelData, Tile, Enemy } from './types'

export default function App() {
  const history = useHistory()
  const { showToast, ToastContainer } = useToast()

  const [currentTool, setCurrentTool] = useState<ToolType>('ground')
  const [viewport, setViewport] = useState<Viewport>({
    offsetX: 100,
    offsetY: 100,
    scale: 1.0
  })
  const viewportRef = useRef(viewport)

  const handleViewportChange = useCallback((newViewport: Viewport) => {
    viewportRef.current = newViewport
    setViewport(newViewport)
  }, [])

  const handleTilesChange = useCallback((newTiles: Tile[]) => {
    history.setTiles(newTiles)
  }, [history])

  const handleEnemiesChange = useCallback((newEnemies: Enemy[]) => {
    history.setEnemies(newEnemies)
  }, [history])

  const handleSave = useCallback(async () => {
    const levelData: LevelData = {
      tiles: history.tiles,
      enemies: history.enemies,
      viewport: viewportRef.current,
      timestamp: Date.now()
    }

    const result = await saveLevel(levelData)

    if (result.success) {
      showToast(result.message || '保存成功', 'success')
      history.clearHistory()
      return true
    } else {
      showToast(result.message || '保存失败', 'error')
      return false
    }
  }, [history, showToast])

  const handleLoad = useCallback(async (file: File) => {
    try {
      const text = await file.text()
      const data = JSON.parse(text) as LevelData

      if (data.tiles && Array.isArray(data.tiles) &&
          data.enemies && Array.isArray(data.enemies)) {
        history.setTilesAndEnemies(data.tiles, data.enemies)

        if (data.viewport) {
          viewportRef.current = data.viewport
          setViewport(data.viewport)
        }

        history.clearHistory()
        showToast(`加载成功: ${file.name}`, 'success')
      } else {
        showToast('文件格式不正确', 'error')
      }
    } catch (error) {
      showToast('文件读取失败', 'error')
    }
  }, [history, showToast])

  const handleToolChange = useCallback((tool: ToolType) => {
    setCurrentTool(tool)
  }, [])

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      <ToolPanel
        currentTool={currentTool}
        onToolChange={handleToolChange}
        onUndo={history.undo}
        onRedo={history.redo}
        onSave={handleSave}
        onLoad={handleLoad}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
      />
      <EditorCanvas
        tiles={history.tiles}
        enemies={history.enemies}
        viewport={viewport}
        onViewportChange={handleViewportChange}
        onTilesChange={handleTilesChange}
        onEnemiesChange={handleEnemiesChange}
        onPushHistory={history.pushAction}
        currentTool={currentTool}
      />
      <ToastContainer />
    </div>
  )
}
