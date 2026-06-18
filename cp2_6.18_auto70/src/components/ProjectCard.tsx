import type { Project } from '@/types';
import { useProjectStore } from '@/store/projectStore';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  const getProjectTracks = useProjectStore((state) => state.getProjectTracks);
  const getProjectProgress = useProjectStore((state) => state.getProjectProgress);

  const projectTracks = getProjectTracks(project.id);
  const completedTracks = projectTracks.filter((t) => t.status === 'finalized').length;
  const totalTracks = projectTracks.length;
  const progress = getProjectProgress(project.id) * 100;

  const getInitials = (name: string) => {
    return name.slice(0, 1).toUpperCase();
  };

  const displayedCollaborators = project.collaborators.slice(0, 3);
  const remainingCount = project.collaborators.length - 3;

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative w-[300px] cursor-pointer overflow-hidden rounded-2xl border border-[#374151] p-5',
        'transition-all duration-300 ease-out',
        'hover:-translate-y-1'
      )}
      style={{
        background: 'linear-gradient(180deg, #1F2937 0%, #111827 100%)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 6px 30px rgba(0, 0, 0, 0.5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
      }}
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-text-primary">{project.name}</h3>
        <p className="mt-1 text-sm text-text-secondary">{project.clientName}</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {project.genres.map((genre) => (
          <span
            key={genre}
            className="rounded-full bg-[#374151] px-3 py-1 text-xs font-medium text-text-secondary"
          >
            {genre}
          </span>
        ))}
      </div>

      <div className="mb-5 text-sm text-text-secondary">
        BPM: {project.bpmRange.min} - {project.bpmRange.max}
      </div>

      <div className="mb-2">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#374151]">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-text-secondary">
            {completedTracks}/{totalTracks} 曲目已完成
          </span>
          <span className="text-accent">{Math.round(progress)}%</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end">
        <div className="flex -space-x-2">
          {displayedCollaborators.map((collaborator) => (
            <div
              key={collaborator.id}
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white ring-2 ring-bg-card"
              style={{ backgroundColor: collaborator.color }}
            >
              {getInitials(collaborator.name)}
            </div>
          ))}
          {remainingCount > 0 && (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#374151] text-xs font-semibold text-text-primary ring-2 ring-bg-card">
              +{remainingCount}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
