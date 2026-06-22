import { useState } from 'react'
import { Plus, X, BarChart3 } from 'lucide-react'
import ProjectTimeline from './components/ProjectTimeline'
import ReportView from './components/ReportView'
import SharedReport from './components/SharedReport'
import type { Project, ReportData, Milestone } from './utils/helpers'
import { COLOR_PALETTE, formatDate, calculateProjectCompletion } from './utils/helpers'

type ViewType =
  | { name: 'projects' }
  | { name: 'project-detail'; projectId: string }
  | { name: 'report'; reportData: ReportData }
  | { name: 'shared'; shortCode: string; reportData?: ReportData; project?: Project }

const createSampleProjects = (): Project[] => {
  const today = new Date()
  const format = (d: Date) => d.toISOString().split('T')[0]
  const addDays = (d: Date, days: number) => {
    const n = new Date(d)
    n.setDate(n.getDate() + days)
    return n
  }

  return [
    {
      id: 'p1',
      name: '企业官网重构',
      startDate: format(today),
      endDate: format(addDays(today, 60)),
      color: COLOR_PALETTE[6],
      description: '为某科技公司重构其官方网站，采用现代设计风格，提升用户体验。',
      milestones: [
        { id: 'm1', title: '需求分析与调研', dueDate: format(addDays(today, 7)), completion: 100, note: '已完成所有访谈' },
        { id: 'm2', title: 'UI/UX 设计稿', dueDate: format(addDays(today, 20)), completion: 75, note: '首页已完成' },
        { id: 'm3', title: '前端开发', dueDate: format(addDays(today, 45)), completion: 20, note: '' },
        { id: 'm4', title: '测试与上线', dueDate: format(addDays(today, 60)), completion: 0, note: '' },
      ],
    },
    {
      id: 'p2',
      name: '移动App设计',
      startDate: format(addDays(today, -10)),
      endDate: format(addDays(today, 50)),
      color: COLOR_PALETTE[4],
      description: '为一款健康管理App设计完整的移动端界面和交互流程。',
      milestones: [
        { id: 'm5', title: '竞品分析', dueDate: format(addDays(today, -5)), completion: 100, note: '' },
        { id: 'm6', title: '原型设计', dueDate: format(addDays(today, 10)), completion: 60, note: '核心流程已完成' },
        { id: 'm7', title: '视觉设计', dueDate: format(addDays(today, 30)), completion: 10, note: '' },
      ],
    },
    {
      id: 'p3',
      name: '电商平台开发',
      startDate: format(addDays(today, -30)),
      endDate: format(addDays(today, 90)),
      color: COLOR_PALETTE[9],
      description: '全栈开发一个中小型B2C电商平台，包含商品、订单、支付等模块。',
      milestones: [
        { id: 'm8', title: '数据库设计', dueDate: format(addDays(today, -20)), completion: 100, note: '' },
        { id: 'm9', title: 'API接口开发', dueDate: format(addDays(today, 15)), completion: 80, note: '' },
        { id: 'm10', title: '管理后台', dueDate: format(addDays(today, 40)), completion: 30, note: '' },
        { id: 'm11', title: '用户端前端', dueDate: format(addDays(today, 70)), completion: 0, note: '' },
        { id: 'm12', title: '部署上线', dueDate: format(addDays(today, 90)), completion: 0, note: '' },
      ],
    },
  ]
}

export default function App() {
  const [projects, setProjects] = useState<Project[]>(createSampleProjects())
  const [view, setView] = useState<ViewType>({ name: 'projects' })
  const [showAddProject, setShowAddProject] = useState(false)
  const [sharedLinks, setSharedLinks] = useState<
    Map<string, { reportData?: ReportData; project?: Project }>
  >(new Map())

  const [newProjectName, setNewProjectName] = useState('')
  const [newStartDate, setNewStartDate] = useState('')
  const [newEndDate, setNewEndDate] = useState('')
  const [newColor, setNewColor] = useState(COLOR_PALETTE[0])
  const [newDescription, setNewDescription] = useState('')

  const handleAddProject = () => {
    if (!newProjectName.trim()) return
    const newProject: Project = {
      id: Date.now().toString(),
      name: newProjectName.trim(),
      startDate: newStartDate,
      endDate: newEndDate,
      color: newColor,
      description: newDescription.trim(),
      milestones: [],
    }
    setProjects([...projects, newProject])
    setNewProjectName('')
    setNewStartDate('')
    setNewEndDate('')
    setNewColor(COLOR_PALETTE[0])
    setNewDescription('')
    setShowAddProject(false)
  }

  const handleUpdateProject = (updatedProject: Project) => {
    setProjects(projects.map((p) => (p.id === updatedProject.id ? updatedProject : p)))
  }

  const handleGenerateReportFromProject = (project: Project) => {
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - 30)
    const reportData: ReportData = {
      projects: projects,
      startDate: startDate.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
      completions: projects.map((p) => ({
        projectId: p.id,
        completion: calculateProjectCompletion(p),
      })),
    }
    setView({ name: 'report', reportData })
  }

  const handleGenerateReportAll = () => {
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - 30)
    const reportData: ReportData = {
      projects: projects,
      startDate: startDate.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
      completions: projects.map((p) => ({
        projectId: p.id,
        completion: calculateProjectCompletion(p),
      })),
    }
    setView({ name: 'report', reportData })
  }

  const handleShareReport = (shortCode: string, reportData: ReportData) => {
    const newMap = new Map(sharedLinks)
    newMap.set(shortCode, { reportData })
    setSharedLinks(newMap)
    setView({ name: 'shared', shortCode, reportData })
  }

  const handleShareProject = (shortCode: string, project: Project) => {
    const newMap = new Map(sharedLinks)
    newMap.set(shortCode, { project })
    setSharedLinks(newMap)
    setView({ name: 'shared', shortCode, project })
  }

  const renderProjectsView = () => (
    <div className="projects-page">
      <div className="app-header">
        <div className="app-header-info">
          <h1 className="app-title">项目协作管理</h1>
          <p className="app-subtitle">追踪里程碑，生成报告，高效协作</p>
        </div>
        <div className="app-header-actions">
          <button className="btn-secondary" onClick={handleGenerateReportAll} disabled={projects.length === 0}>
            <BarChart3 size={16} />
            生成全量报告
          </button>
          <button className="btn-primary" onClick={() => setShowAddProject(true)}>
            <Plus size={16} />
            新建项目
          </button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <p className="empty-title">还没有项目</p>
          <p className="empty-desc">点击右上角「新建项目」开始你的第一个项目</p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => {
            const avgCompletion = calculateProjectCompletion(project)
            return (
              <div
                key={project.id}
                className="project-card"
                onClick={() => setView({ name: 'project-detail', projectId: project.id })}
              >
                <div className="project-card-header">
                  <span className="project-color-dot" style={{ backgroundColor: project.color }} />
                  <span className="project-card-completion" style={{ backgroundColor: project.color }}>
                    {avgCompletion}%
                  </span>
                </div>
                <h2 className="project-card-name">{project.name}</h2>
                <p className="project-card-dates">
                  {formatDate(project.startDate)} ~ {formatDate(project.endDate)}
                </p>
                {project.description && (
                  <p className="project-card-desc">{project.description}</p>
                )}
                <div className="project-card-footer">
                  <span className="project-card-milestones">
                    {project.milestones.length} 个里程碑
                  </span>
                  <div className="project-card-progress">
                    <div
                      className="project-card-progress-fill"
                      style={{
                        width: `${avgCompletion}%`,
                        backgroundColor: project.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showAddProject && (
        <div className="modal-overlay" onClick={() => setShowAddProject(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>新建项目</h2>
              <button className="btn-icon" onClick={() => setShowAddProject(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>项目名称 *</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="输入项目名称"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>开始日期</label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>结束日期</label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>颜色标签</label>
                <div className="color-picker">
                  {COLOR_PALETTE.map((color) => (
                    <button
                      key={color}
                      className={`color-option ${newColor === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewColor(color)}
                    />
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>项目描述</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="简要描述项目内容（可选）"
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowAddProject(false)}>
                取消
              </button>
              <button
                className="btn-primary"
                onClick={handleAddProject}
                disabled={!newProjectName.trim()}
              >
                创建项目
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  if (view.name === 'project-detail') {
    const project = projects.find((p) => p.id === view.projectId)
    if (!project) {
      setView({ name: 'projects' })
      return null
    }
    return (
      <ProjectTimeline
        project={project}
        onBack={() => setView({ name: 'projects' })}
        onUpdateProject={handleUpdateProject}
        onGenerateReport={handleGenerateReportFromProject}
        onShare={handleShareProject}
      />
    )
  }

  if (view.name === 'report') {
    return (
      <ReportView
        reportData={view.reportData}
        onBack={() => setView({ name: 'projects' })}
        onShare={handleShareReport}
      />
    )
  }

  if (view.name === 'shared') {
    return (
      <SharedReport
        shortCode={view.shortCode}
        reportData={view.reportData}
        project={view.project}
        onBack={() => setView({ name: 'projects' })}
      />
    )
  }

  return renderProjectsView()
}
