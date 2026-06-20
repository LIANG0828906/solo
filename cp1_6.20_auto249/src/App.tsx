import React, { useState, useRef, useCallback } from 'react'
import Flower, { FlowerRef } from './Flower'
import ControlPanel from './ControlPanel'
import { FlowerParams, GrowthStage } from './utils/flowerUtils'
import { generateCapture } from './Capture'
import './App.css'

const defaultParams: FlowerParams = {
  petalCount: 8,
  petalHue: 330,
  flowerDiameter: 80,
  stemBend: 0,
}

const App: React.FC = () => {
  const [params, setParams] = useState<FlowerParams>(defaultParams)
  const [growthStage, setGrowthStage] = useState<GrowthStage>('seed')
  const flowerRef = useRef<FlowerRef>(null)

  const handlePlant = useCallback(() => {
    setGrowthStage('sprouting')
    
    setTimeout(() => {
      setGrowthStage('growing')
    }, 1200)

    setTimeout(() => {
      setGrowthStage('bloomed')
    }, 2500)
  }, [])

  const handleParamsChange = useCallback((newParams: FlowerParams) => {
    setParams(newParams)
  }, [])

  const handleSave = useCallback(async () => {
    const canvas = flowerRef.current?.getCanvas()
    if (!canvas) return

    await generateCapture(canvas, params)
  }, [params])

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">🌸 数字花朵培育日记</h1>
        <p className="app-subtitle">培育你的专属数字花朵</p>
      </header>

      <main className="main-content">
        <div className="workbench">
          <Flower
            ref={flowerRef}
            params={params}
            growthStage={growthStage}
          />
          
          <div className="hint-text">
            {growthStage === 'seed' && '🌱 点击播种按钮开始培育'}
            {growthStage === 'sprouting' && '🌿 种子正在发芽...'}
            {growthStage === 'growing' && '🌺 花朵正在生长...'}
            {growthStage === 'bloomed' && '✨ 拖动旋转视角，调节参数打造你的花朵'}
          </div>
        </div>

        <ControlPanel
          params={params}
          onParamsChange={handleParamsChange}
          onPlant={handlePlant}
          onSave={handleSave}
          isPlanted={growthStage !== 'seed'}
          isBloomed={growthStage === 'bloomed'}
        />
      </main>

      <footer className="app-footer">
        <p>用鼠标拖动旋转视角 · 滚轮缩放 · 调节参数创造独一无二的花朵</p>
      </footer>
    </div>
  )
}

export default App
