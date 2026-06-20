import type { Project } from './types';

interface ProjectListProps {
  projects: Project[];
  currentId: string;
  onSelect: (id: string) => void;
}

function calculateProgress(tasks: Project['tasks']) {
  if (tasks.length === 0) return 0;
  const completed = tasks.filter(t => t.status === 'completed').length;
  return Math.round((completed / tasks.length) * 100);
}

function getProgressColor(progress: number) {
  const r = Math.round(255 - progress * 2.55);
  const g = Math.round(progress * 2.55);
  return `rgb(${r}, ${g}, 50)`;
}

export default function ProjectList({ projects, currentId, onSelect }: ProjectListProps) {
  return (
    <nav className="project-list">
      {projects.map(project => {
        const progress = calculateProgress(project.tasks);
        const isActive = project.id === currentId;
        return (
          <div
            key={project.id}
            className={`project-card ${isActive ? 'active' : ''}`}
            onClick={() => onSelect(project.id)}
          >
            <div className="project-card-header">
              <img
                src={project.ownerAvatar}
                alt={project.ownerName}
                className="owner-avatar"
              />
              <div className="project-info">
                <h3 className="project-name">{project.name}</h3>
                <p className="project-owner">负责人：{project.ownerName}</p>
              </div>
            </div>
            <div className="progress-section">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: getProgressColor(progress),
                  }}
                />
              </div>
              <span className="progress-text">{progress}%</span>
            </div>
            <div className="task-count">
              {project.tasks.filter(t => t.status === 'completed').length}/{project.tasks.length} 任务完成
            </div>
          </div>
        );
      })}
    </nav>
  );
}
