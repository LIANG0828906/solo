import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'

interface Project {
  id: string
  name: string
  description: string
  stage: '构思中' | '进行中' | '已完成'
  progress: number
  lastEdited: string
  publicToken: string
}

interface Material {
  id: string
  projectId: string
  name: string
  quantity: number
  unitPrice: number
  link: string
}

const stageClassMap: Record<string, string> = {
  '构思中': 'stage-concept',
  '进行中': 'stage-progress',
  '已完成': 'stage-completed'
}

function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!id) return
    
    Promise.all([
      fetch(`/api/projects/${id}`).then(res => res.json()),
      fetch(`/api/materials/${id}`).then(res => res.json())
    ])
      .then(([projectData, materialsData]) => {
        setProject(projectData)
        setMaterials(materialsData)
        setLoading(false)
      })
      .catch(err => {
        console.error('加载数据失败:', err)
        setLoading(false)
      })
  }, [id])

  const updateProject = (field: keyof Project, value: string | number) => {
    if (!project) return
    
    const updatedProject = { 
      ...project, 
      [field]: value,
      lastEdited: new Date().toISOString()
    }
    
    setProject(updatedProject)
    
    fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProject)
    }).catch(err => console.error('更新项目失败:', err))
  }

  const addMaterial = () => {
    if (!id) return
    
    const newMaterial: Material = {
      id: uuidv4(),
      projectId: id,
      name: '',
      quantity: 1,
      unitPrice: 0,
      link: ''
    }
    
    setMaterials([...materials, newMaterial])
    
    fetch(`/api/materials/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMaterial)
    }).catch(err => console.error('添加材料失败:', err))
  }

  const updateMaterial = (materialId: string, field: keyof Material, value: string | number) => {
    const updatedMaterials = materials.map(m => 
      m.id === materialId ? { ...m, [field]: value } : m
    )
    setMaterials(updatedMaterials)
    
    const material = updatedMaterials.find(m => m.id === materialId)
    if (material) {
      fetch(`/api/materials/${id}/${materialId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(material)
      }).catch(err => console.error('更新材料失败:', err))
    }
  }

  const deleteMaterial = (materialId: string) => {
    setRemovingId(materialId)
    
    setTimeout(() => {
      setMaterials(materials.filter(m => m.id !== materialId))
      setRemovingId(null)
      
      fetch(`/api/materials/${id}/${materialId}`, {
        method: 'DELETE'
      }).catch(err => console.error('删除材料失败:', err))
    }, 300)
  }

  const totalCost = materials.reduce((sum, m) => sum + m.quantity * m.unitPrice, 0)

  const copyPublicLink = () => {
    if (!project) return
    const link = `${window.location.origin}/public/${project.publicToken}`
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">加载中...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="container">
        <p>项目不存在</p>
        <Link to="/" className="btn btn-primary">返回仪表盘</Link>
      </div>
    )
  }

  return (
    <div className="container">
      <Link to="/" className="back-link">← 返回仪表盘</Link>
      
      <div className="page-header">
        <h1 className="page-title">项目详情</h1>
        <span className={`stage-badge ${stageClassMap[project.stage]}`}>
          {project.stage}
        </span>
      </div>
      
      <div className="project-detail">
        <div className="project-info-section">
          <h2 className="section-title">基本信息</h2>
          
          <div className="form-group">
            <label className="form-label">项目名称</label>
            <input
              type="text"
              className="form-input"
              value={project.name}
              onChange={(e) => updateProject('name', e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">项目阶段</label>
            <select
              className="form-select"
              value={project.stage}
              onChange={(e) => updateProject('stage', e.target.value as Project['stage'])}
            >
              <option value="构思中">构思中</option>
              <option value="进行中">进行中</option>
              <option value="已完成">已完成</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">完成进度: {project.progress}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={project.progress}
              onChange={(e) => updateProject('progress', parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">项目简介</label>
            <textarea
              className="form-textarea"
              value={project.description}
              onChange={(e) => updateProject('description', e.target.value)}
              placeholder="描述你的项目..."
            />
          </div>
        </div>
        
        <div className="materials-section">
          <h2 className="section-title">材料清单</h2>
          
          <div className="table-container">
            <table className="materials-table">
              <thead>
                <tr>
                  <th>材料名称</th>
                  <th style={{ width: '100px' }}>数量</th>
                  <th style={{ width: '120px' }}>单价 (元)</th>
                  <th style={{ width: '100px' }}>小计 (元)</th>
                  <th>采购链接</th>
                  <th style={{ width: '80px' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {materials.map(material => (
                  <tr 
                    key={material.id} 
                    className={`material-row ${removingId === material.id ? 'removing' : ''}`}
                  >
                    <td>
                      <input
                        type="text"
                        value={material.name}
                        onChange={(e) => updateMaterial(material.id, 'name', e.target.value)}
                        placeholder="材料名称"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={material.quantity}
                        onChange={(e) => updateMaterial(material.id, 'quantity', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={material.unitPrice}
                        onChange={(e) => updateMaterial(material.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td style={{ fontWeight: 500 }}>
                      {(material.quantity * material.unitPrice).toFixed(2)}
                    </td>
                    <td>
                      <input
                        type="url"
                        value={material.link}
                        onChange={(e) => updateMaterial(material.id, 'link', e.target.value)}
                        placeholder="粘贴链接"
                      />
                    </td>
                    <td>
                      <button
                        className="btn btn-danger"
                        onClick={() => deleteMaterial(material.id)}
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td colSpan={3}>总成本</td>
                  <td colSpan={3}>¥ {totalCost.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <button className="btn btn-secondary add-material-btn" onClick={addMaterial}>
            + 添加新材料
          </button>
        </div>
        
        <div className="public-link-section">
          <h2 className="section-title">公开作品展示页</h2>
          <p style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--color-warm-gray)' }}>
            生成一个公开链接，分享给朋友或客户查看你的作品
          </p>
          <div className="public-link-container">
            <input
              type="text"
              className="public-link-input"
              value={`${window.location.origin}/public/${project.publicToken}`}
              readOnly
            />
            <button className="btn btn-primary" onClick={copyPublicLink}>
              {copied ? '✓ 已复制' : '复制链接'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectDetail
