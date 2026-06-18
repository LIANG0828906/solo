import React from 'react'
import { SceneRenderer } from '@/modules/rendering/SceneRenderer'
import { StoryPanel } from '@/modules/rendering/StoryPanel'
import { GameHUD } from '@/modules/ui/GameHUD'

const App: React.FC = () => {
  return (
    <div className="w-full h-full relative overflow-hidden">
      <SceneRenderer />
      <GameHUD />
      <StoryPanel />

      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-30 pointer-events-none">
        <div
          className="px-6 py-3 rounded-full text-sm"
          style={{
            background: 'rgba(10, 10, 30, 0.7)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            color: '#888888'
          }}
        >
          拖拽恒星连接 • 鼠标滚轮缩放 • 右键旋转视角
        </div>
      </div>

      <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-30 pointer-events-none">
        <h1
          className="text-3xl font-bold tracking-widest"
          style={{
            color: 'transparent',
            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            textShadow: '0 0 40px rgba(255, 215, 0, 0.3)'
          }}
        >
          星轨编织者
        </h1>
      </div>
    </div>
  )
}

export default App
