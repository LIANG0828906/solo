import { useState } from 'react'
import Canvas from './components/Canvas'
import NodeEditor from './components/NodeEditor'
import Toolbar from './components/Toolbar'
import StoryPreview from './components/StoryPreview'
import { useStoryStore } from './stores/storyStore'

function App() {
  const { selectedNodeId, scale } = useStoryStore()
  const [showPreview, setShowPreview] = useState(false)

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#0f172a',
        overflow: 'hidden',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <Toolbar onPreview={() => setShowPreview(true)} />

      <div
        style={{
          position: 'absolute',
          top: '56px',
          left: 0,
          right: selectedNodeId ? '400px' : 0,
          bottom: 0,
          transition: 'right 0.2s ease',
        }}
      >
        <Canvas />
      </div>

      {selectedNodeId && <NodeEditor />}

      {showPreview && <StoryPreview onClose={() => setShowPreview(false)} />}

      <div
        style={{
          position: 'fixed',
          bottom: '16px',
          left: '16px',
          color: '#64748b',
          fontSize: '12px',
          backgroundColor: 'rgba(30, 41, 59, 0.8)',
          padding: '8px 12px',
          borderRadius: '8px',
          pointerEvents: 'none',
          zIndex: 5,
        }}
      >
        缩放: {(scale * 100).toFixed(0)}% | 空格+拖拽平移 | 滚轮缩放 | 右键添加节点 | Ctrl+Z 撤销
      </div>
    </div>
  )
}

export default App
