import { useNavigate } from 'react-router-dom';
import { ProgressBar } from './ProgressBar';
import type { Project } from '@/types';
import './ProjectCard.css';

interface ProjectCardProps {
  project: Project;
  onDelete: (id: string) => void;
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/project/${project.id}`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`确定要删除「${project.name}」吗？`)) {
      onDelete(project.id);
    }
  };

  return (
    <div className="project-card" onClick={handleClick}>
      <div className="project-card__header">
        <div
          className="project-card__color-dot"
          style={{ backgroundColor: project.yarnColor }}
        />
        <h3 className="project-card__title">{project.name}</h3>
        <button
          className="project-card__delete-btn"
          onClick={handleDelete}
          aria-label="删除项目"
        >
          ×
        </button>
      </div>

      <div className="project-card__info">
        <span className="project-card__info-item">
          {project.stitchCount > 0 ? project.stitchCount : 0} 针 × {project.rowCount > 0 ? project.rowCount : 0} 行
        </span>
      </div>

      <div className="project-card__progress">
        <div className="project-card__progress-text">
          <span>进度</span>
          <span>
            {project.currentRow} / {project.rowCount > 0 ? project.rowCount : 0} 行
            {project.rowCount > 0 && project.currentRow >= project.rowCount && ' ✓'}
          </span>
        </div>
        <ProgressBar current={project.currentRow} total={project.rowCount > 0 ? project.rowCount : 1} />
      </div>

      {project.referenceImage && (
        <div className="project-card__image">
          <img src={project.referenceImage} alt={project.name} />
        </div>
      )}
    </div>
  );
}
