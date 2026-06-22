import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Project, useProjectStore } from '../../store/projectStore'

export const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
  const navigate = useNavigate()
  const selectProject = useProjectStore((s) => s.selectProject)
  const getProjectProgress = useProjectStore((s) => s.getProjectProgress)
  const collaborators = useProjectStore((s) => s.collaborators)
  const tracks = useProjectStore((s) => s.tracks[project.id] || [])

  const progress = getProjectProgress(project.id)

  const trackCollaborators = tracks.flatMap((t) => t.collaboratorIds)
  const uniqueCollabIds = [...new Set(trackCollaborators)]
  const projectCollabs = collaborators.filter((c) => uniqueCollabIds.includes(c.id))

  const handleClick = () => {
    selectProject(project.id)
    navigate(`/project/${project.id}`)
  }

  return (
    <div className="project-card scroll-fade-in" onClick={handleClick}>
      <div className="project-card-name">{project.name}</div>
      <div className="project-card-client">{project.client}</div>
      <div className="project-card-tags">
        {project.genres.map((g) => (
          <span key={g} className="tag">{g}</span>
        ))}
      </div>
      <div className="project-card-bpm">BPM: {project.bpmMin} - {project.bpmMax}</div>
      <div className="project-card-progress">
        <div
          className="project-card-progress-bar"
          style={{ width: `${progress}%` }}
        />
      </div>
      {projectCollabs.length > 0 && (
        <div className="project-card-collaborators">
          {projectCollabs.map((c) => (
            <div
              key={c.id}
              className="avatar-circle"
              style={{ background: c.avatarColor }}
              title={c.name}
            >
              {c.name.charAt(0)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
