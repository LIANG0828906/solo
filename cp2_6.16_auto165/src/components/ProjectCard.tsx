import { Calendar } from 'lucide-react';
import type { Project } from '@/types';
import { formatDate, getInitials } from '@/utils/formatters';

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  const progress = Math.min(
    Math.round((project.achieved_hours / project.required_hours) * 100),
    100,
  );

  return (
    <div
      className="card-hover bg-white rounded-card shadow-card overflow-hidden cursor-pointer"
      onClick={onClick}
    >
      {project.cover_image ? (
        <img
          src={project.cover_image}
          alt={project.name}
          className="h-40 w-full object-cover"
        />
      ) : (
        <div
          className="h-40 w-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #FF8F00, #FFC107)' }}
        >
          <span className="text-white text-5xl font-bold opacity-90">
            {getInitials(project.name)}
          </span>
        </div>
      )}

      <div className="px-4 pt-3">
        <h3 className="text-lg font-semibold text-navy-900 truncate">{project.name}</h3>
      </div>

      <div className="mx-4 mt-3 mb-4">
        <div className="bg-gray-100 h-2 rounded-full overflow-hidden">
          <div
            className="progress-bar-fill bg-gradient-to-r from-amber-700 to-amber-500 h-2 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="px-4 pb-4 flex items-center justify-between">
        <span className="text-sm text-navy-700 font-medium">
          进度 {progress}% · 共需 {project.required_hours}h
        </span>
        <div className="flex items-center gap-1 text-xs text-gray-500 shrink-0 ml-2">
          <Calendar className="w-3.5 h-3.5" />
          <span>{formatDate(project.deadline)}</span>
        </div>
      </div>
    </div>
  );
}
