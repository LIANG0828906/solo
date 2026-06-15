import { useRef, useEffect, useState, useCallback } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { useStore } from '@/store/useStore'
import { useInteractionLog } from '@/hooks/useInteractionLog'
import { Node } from '@/components/Node'
import { Connection } from '@/components/Connection'
import { Shockwave } from '@/components/Shockwave'
import { Starfield } from '@/components/Starfield'
import { playCreateSound } from '@/utils/audio'
import './App.css'

function CameraController() {
  const { camera } = useThree()
  const controlsRef = useRef<any>(null)

  useEffect(() => {
    const handleReset = () => {
      if (controlsRef.current) {
        controlsRef.current.reset()
      }
    }
    window.addEventListener('reset-camera', handleReset)
    return () => window.removeEventListener('reset-camera', handleReset)
  }, [])

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 15]} fov={60} />
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={50}
        enablePan={true}
        panSpeed={0.5}
      />
    </>
  )
}

function Scene({ onLog }: { onLog: (nodeId: string, type: 'click' | 'connect' | 'create') => void }) {
  const nodes = useStore((state) => state.nodes)
  const connections = useStore((state) => state.connections)
  const shockwaves = useStore((state) => state.shockwaves)
  const energyFlow = useStore((state) => state.energyFlow)
  const isPlacingNode = useStore((state) => state.isPlacingNode)
  const setIsPlacingNode = useStore((state) => state.setIsPlacingNode)
  const addNode = useStore((state) => state.addNode)
  const setConnectingFrom = useStore((state) => state.setConnectingFrom)
  const setSelectedNode = useStore((state) => state.setSelectedNode)

  const { raycaster, pointer, camera } = useThree()
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0))

  const handleSceneClick = useCallback(() => {
    if (isPlacingNode) {
      raycaster.setFromCamera(pointer, camera)
      const intersectPoint = new THREE.Vector3()
      raycaster.ray.intersectPlane(plane.current, intersectPoint)
      if (intersectPoint) {
        addNode([intersectPoint.x, intersectPoint.y, intersectPoint.z])
        setIsPlacingNode(false)
        playCreateSound()
        const newNode = nodes[nodes.length - 1]
        if (newNode) {
          onLog(newNode.id, 'create')
        }
      }
    } else {
      setConnectingFrom(null)
      setSelectedNode(null)
    }
    document.body.style.cursor = 'auto'
  }, [isPlacingNode, raycaster, pointer, camera, addNode, setIsPlacingNode, setConnectingFrom, setSelectedNode, nodes, onLog])

  useFrame(() => {
    const normal = new THREE.Vector3()
    camera.getWorldDirection(normal)
    plane.current.setFromNormalAndCoplanarPoint(
      normal,
      new THREE.Vector3(0, 0, 0)
    )
  })

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#ff4500" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b0000" />

      <Starfield />

      <mesh onClick={handleSceneClick} visible={false}>
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {connections.map((connection) => (
        <Connection
          key={connection.id}
          connection={connection}
          nodes={nodes}
          energyFlow={energyFlow}
        />
      ))}

      {nodes.map((node) => (
        <Node key={node.id} node={node} onLog={onLog} />
      ))}

      {shockwaves.map((shockwave) => (
        <Shockwave key={shockwave.id} shockwave={shockwave} />
      ))}

      <EffectComposer>
        <Bloom
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          height={300}
          intensity={1.5}
        />
        <Vignette eskil={false} offset={0.1} darkness={0.8} />
      </EffectComposer>
    </>
  )
}

function ControlPanel({ 
  isPlacingNode, 
  setIsPlacingNode, 
  energyFlow, 
  setEnergyFlow,
  resetView,
  clearAll,
  nodeCount,
  maxNodes
}: {
  isPlacingNode: boolean
  setIsPlacingNode: (value: boolean) => void
  energyFlow: number
  setEnergyFlow: (value: number) => void
  resetView: () => void
  clearAll: () => void
  nodeCount: number
  maxNodes: number
}) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  return (
    <div className="control-panel">
      <h2 className="panel-title">星髓脉动</h2>
      <p className="panel-subtitle">STAR CORE PULSE</p>
      
      <div className="panel-section">
        <button
          className={`btn btn-primary ${isPlacingNode ? 'active' : ''}`}
          onClick={() => setIsPlacingNode(!isPlacingNode)}
          disabled={nodeCount >= maxNodes}
        >
          {isPlacingNode ? '点击场景放置' : '+ 生成能量节点'}
        </button>
        <p className="node-count">节点数量: {nodeCount} / {maxNodes}</p>
      </div>

      <div className="panel-section">
        <label className="slider-label">
          能量流: <span className="value">{energyFlow}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={energyFlow}
          onChange={(e) => setEnergyFlow(Number(e.target.value))}
          className="energy-slider"
        />
        <div className="slider-marks">
          <span>0</span>
          <span>50</span>
          <span>100</span>
        </div>
      </div>

      <div className="panel-section btn-group">
        <button className="btn btn-secondary" onClick={resetView}>
          重置视角
        </button>
        <button className="btn btn-secondary" onClick={toggleFullscreen}>
          {isFullscreen ? '退出全屏' : '全屏模式'}
        </button>
      </div>

      <div className="panel-section">
        <button className="btn btn-danger" onClick={clearAll}>
          清除所有
        </button>
      </div>

      <div className="panel-tip">
        <p>💡 操作提示:</p>
        <ul>
          <li>点击"生成节点"后在场景中点击放置</li>
          <li>拖拽节点可以移动位置</li>
          <li>依次点击两个节点创建连接</li>
          <li>点击节点触发能量冲击波</li>
          <li>滚轮缩放，拖拽旋转视角</li>
        </ul>
      </div>
    </div>
  )
}

function LogPanel({ logs }: { logs: any[] }) {
  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      click: '⚡ 冲击波',
      connect: '🔗 连接',
      create: '⭐ 生成'
    }
    return labels[type] || type
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      click: '#ff4500',
      connect: '#ffd700',
      create: '#00ff88'
    }
    return colors[type] || '#ffffff'
  }

  return (
    <div className="log-panel">
      <h3 className="log-title">能量日志</h3>
      {logs.length === 0 ? (
        <p className="log-empty">暂无交互记录</p>
      ) : (
        <div className="log-list">
          {logs.map((log, index) => (
            <div key={log.id} className={`log-entry ${index === 0 ? 'latest' : ''}`}>
              <div className="log-header">
                <span className="log-type" style={{ color: getTypeColor(log.type) }}>
                  {getTypeLabel(log.type)}
                </span>
                <span className="log-time">
                  {new Date(log.timestamp).toLocaleTimeString('zh-CN', { hour12: false })}
                </span>
              </div>
              <div className="log-details">
                <span>节点: {log.nodeId.slice(0, 6)}</span>
                <span>能量: {log.energy}</span>
                <span>距离: {log.distance}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function App() {
  const { logs, addLog, clearLogs } = useInteractionLog()
  const { 
    isPlacingNode, 
    setIsPlacingNode, 
    energyFlow, 
    setEnergyFlow,
    resetView,
    clearAll,
    nodes,
    maxNodes
  } = useStore((state) => ({
    isPlacingNode: state.isPlacingNode,
    setIsPlacingNode: state.setIsPlacingNode,
    energyFlow: state.energyFlow,
    setEnergyFlow: state.setEnergyFlow,
    resetView: state.resetView,
    clearAll: state.clearAll,
    nodes: state.nodes,
    maxNodes: state.maxNodes
  }))

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPlacingNode(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setIsPlacingNode])

  const handleClearAll = () => {
    clearAll()
    clearLogs()
  }

  return (
    <div className="app-container">
      <div className={`canvas-container ${isPlacingNode ? 'placing' : ''}`}>
        <Canvas
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #2d0014 50%, #4a0000 100%)' }}
          onCreated={({ gl }) => {
            gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))
          }}
        >
          <CameraController />
          <Scene onLog={addLog} />
        </Canvas>
        
        {isPlacingNode && (
          <div className="placing-overlay">
            <p>点击场景任意位置放置能量节点</p>
            <p className="hint">按 ESC 取消</p>
          </div>
        )}
      </div>

      <ControlPanel
        isPlacingNode={isPlacingNode}
        setIsPlacingNode={setIsPlacingNode}
        energyFlow={energyFlow}
        setEnergyFlow={setEnergyFlow}
        resetView={resetView}
        clearAll={handleClearAll}
        nodeCount={nodes.length}
        maxNodes={maxNodes}
      />

      <LogPanel logs={logs} />
    </div>
  )
}
