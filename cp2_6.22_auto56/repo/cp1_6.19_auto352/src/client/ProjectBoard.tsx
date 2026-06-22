import { useStore } from './store';
import type { Project } from '../shared/types';

interface ProjectBoardProps {
  onProjectClick: (projectId: string) => void;
}

function ProjectBoard({ onProjectClick }: ProjectBoardProps) {
  const { projects } = useStore();

  return (
    <div className="project-board">
      <div className="board-header">
        <h1>我的项目</h1>
        <button className="btn btn-primary">+ 新建项目</button>
      </div>
      <div className="project-grid">
        {projects.map(project => (
          <div
            key={project.id}
            className="project-card"
            onClick={() => onProjectClick(project.id)}
          >
            <div className="project-card-header">
              <h3>{project.name}</h3>
              <div
                className="project-avatar"
                style={{ backgroundColor: project.avatarColor }}
              >
                {project.ownerName.charAt(0)}
              </div>
            </div>
            <p className="project-desc">{project.description}</p>
            <div className="project-stats">
              <div className="stat-item">
                <span className="stat-value">{project.taskCount}</span>
                <span className="stat-label">总任务</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{project.completedCount}</span>
                <span className="stat-label">已完成</span>
              </div>
            </div>
            <div className="project-footer">
              <span className="deadline">截止: {project.deadline}</span>
              <span className="owner">负责人: {project.ownerName}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProjectBoard;
