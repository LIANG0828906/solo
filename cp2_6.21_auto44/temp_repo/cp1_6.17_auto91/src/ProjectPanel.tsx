import React from 'react'
import { useAppStore, Project } from './store'

interface ProjectPanelProps {
  isMobile?: boolean
  isOpen?: boolean
  onClose?: () => void
}

const ProjectPanel: React.FC<ProjectPanelProps> = ({ isMobile, isOpen, onClose }) => {
  const { projects, currentProjectId, setCurrentProject } = useAppStore()

  const handleProjectClick = (projectId: string) => {
    setCurrentProject(projectId)
    if (isMobile && onClose) {
      onClose()
    }
  }

  const panelStyle: React.CSSProperties = {
    width: isMobile ? '100%' : '300px',
    backgroundColor: '#F8F9FA',
    borderRight: isMobile ? 'none' : '1px solid #E2E8F0',
    padding: '20px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    overflowY: 'auto',
    height: '100%',
  }

  const cardStyle = (project: Project): React.CSSProperties => ({
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    padding: '16px',
    cursor: 'pointer',
    borderLeft: `4px solid ${project.color}`,
    transition: 'box-shadow 0.2s ease-out, transform 0.2s ease-out',
    boxShadow: currentProjectId === project.id
      ? '0 4px 12px rgba(0, 0, 0, 0.1)'
      : '0 1px 3px rgba(0, 0, 0, 0.05)',
    transform: currentProjectId === project.id ? 'translateX(2px)' : 'translateX(0)',
  })

  const titleStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1E293B',
    marginBottom: '8px',
  }

  const countStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#64748B',
  }

  const headerStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px',
    padding: '0 4px',
  }

  if (isMobile) {
    return (
      <div
        style={{
          display: isOpen ? 'block' : 'none',
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: '#F8F9FA',
          borderBottom: '1px solid #E2E8F0',
          zIndex: 100,
          maxHeight: '70vh',
          overflowY: 'auto',
        }}
        className="fade-in"
      >
        <div style={panelStyle}>
          <div style={headerStyle}>项目列表</div>
          {projects.map((project) => (
            <div
              key={project.id}
              style={cardStyle(project)}
              onClick={() => handleProjectClick(project.id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'
              }}
              onMouseLeave={(e) => {
                if (currentProjectId !== project.id) {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)'
                }
              }}
            >
              <div style={titleStyle}>{project.name}</div>
              <div style={countStyle}>
                {project.entries.length} 条记录
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>项目列表</div>
      {projects.map((project) => (
        <div
          key={project.id}
          style={cardStyle(project)}
          onClick={() => handleProjectClick(project.id)}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'
          }}
          onMouseLeave={(e) => {
            if (currentProjectId !== project.id) {
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)'
            }
          }}
        >
          <div style={titleStyle}>{project.name}</div>
          <div style={countStyle}>
            {project.entries.length} 条记录
          </div>
        </div>
      ))}
    </div>
  )
}

export default ProjectPanel
