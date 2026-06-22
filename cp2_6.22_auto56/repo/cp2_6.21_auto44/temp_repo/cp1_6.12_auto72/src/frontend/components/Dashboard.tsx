import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

interface Project {
  id: string
  name: string
  stage: '构思中' | '进行中' | '已完成'
  progress: number
  lastEdited: string
}

const stageClassMap: Record<string, string> = {
  '构思中': 'stage-concept',
  '进行中': 'stage-progress',
  '已完成': 'stage-completed'
}

const progressClassMap: Record<string, string> = {
  '构思中': 'progress-bar-concept',
  '进行中': 'progress-bar-progress',
  '已完成': 'progress-bar-completed'
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return '刚刚编辑'
  if (diffMins < 60) return `${diffMins}分钟前编辑`
  if (diffHours < 24) return `${diffHours}小时前编辑`
  if (diffDays < 7) return `${diffDays}天前编辑`
  
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const startTime = performance.now()
    
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        const endTime = performance.now()
        console.log(`仪表盘数据加载时间: ${(endTime - startTime).toFixed(2)}ms`)
        setProjects(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('加载项目失败:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="container">
        <div className="loading">加载中...</div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">我的项目</h1>
      </div>
      
      <div className="dashboard-grid">
        {projects.map(project => (
          <Link 
            key={project.id} 
            to={`/project/${project.id}`}
            className="project-card"
          >
            <div className="project-card-header">
              <h3 className="project-card-title">{project.name}</h3>
              <span className={`stage-badge ${stageClassMap[project.stage]}`}>
                {project.stage}
              </span>
            </div>
            
            <p className="project-card-time">
              {formatDate(project.lastEdited)}
            </p>
            
            <div className="progress-bar-container">
              <div 
                className={`progress-bar ${progressClassMap[project.stage]}`}
                style={{ width: `${project.progress}%` }}
              />
            </div>
            <p className="progress-text">{project.progress}% 完成</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default Dashboard
