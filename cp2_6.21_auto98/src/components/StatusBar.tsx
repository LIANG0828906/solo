import { useEffect, useState } from 'react'
import { Clock, Zap, Calendar } from 'lucide-react'
import { useTerrainStore } from '../store/terrainStore'
import './StatusBar.css'

export default function StatusBar() {
  const { simulationTime, fps, isSimulating, terrainType } = useTerrainStore()
  const [displayFps, setDisplayFps] = useState(60)
  
  useEffect(() => {
    setDisplayFps(Math.round(fps))
  }, [fps])
  
  const terrainLabels: Record<string, string> = {
    mountain: '山脉',
    basin: '盆地',
    plain: '平原',
    volcano: '火山',
  }
  
  return (
    <div className="status-bar">
      <div className="status-item">
        <Calendar size={14} />
        <span className="status-label">地貌类型:</span>
        <span className="status-value">{terrainLabels[terrainType] || terrainType}</span>
      </div>
      
      <div className="status-divider" />
      
      <div className="status-item">
        <Clock size={14} />
        <span className="status-label">模拟时间:</span>
        <span className="status-value highlight">{simulationTime.toFixed(1)} 年</span>
      </div>
      
      <div className="status-divider" />
      
      <div className="status-item">
        <Zap size={14} />
        <span className="status-label">状态:</span>
        <span className={`status-value ${isSimulating ? 'running' : 'paused'}`}>
          {isSimulating ? '运行中' : '已暂停'}
        </span>
      </div>
      
      <div className="status-spacer" />
      
      <div className="status-item fps-item">
        <span className="fps-dot" />
        <span className="status-label">FPS:</span>
        <span className={`status-value fps-value ${displayFps >= 30 ? 'good' : 'low'}`}>
          {displayFps}
        </span>
      </div>
    </div>
  )
}
