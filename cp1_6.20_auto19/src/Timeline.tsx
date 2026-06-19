import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Plus, Edit2, Trash2, Info } from 'lucide-react';
import type { Project } from './types';

interface TimelineProps {
  projects: Project[];
  editable?: boolean;
  onAddProject?: () => void;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (id: string) => void;
}

interface ProjectCardProps {
  project: Project;
  index: number;
  tagColors: string[];
  editable?: boolean;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (id: string) => void;
}

const TAG_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
];

const ProjectCard = React.memo<ProjectCardProps>(function ProjectCard({
  project,
  index,
  tagColors,
  editable,
  onEditProject,
  onDeleteProject,
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="relative group"
      style={{
        animation: `slideInLeft 0.5s ease-out ${index * 0.1}s both`,
      }}
    >
      <div
        className={cn(
          'bg-white rounded-lg p-4 w-64 cursor-pointer',
          'border border-gray-200',
          'transform transition-all duration-300 ease-in-out',
          'hover:-translate-y-2 hover:shadow-lg',
          'active:scale-95'
        )}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className="flex items-start justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {project.year}
          </span>
          {editable && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditProject?.(project);
                }}
                className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-500 transition-colors"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteProject?.(project.id);
                }}
                className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-red-500 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>

        <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">
          {project.title}
        </h3>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {project.shortDescription}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {project.tags.slice(0, 3).map((tag, tagIndex) => (
            <span
              key={tagIndex}
              className={cn(
                'text-xs text-white px-2 py-0.5 rounded-full',
                tagColors[tagIndex % tagColors.length]
              )}
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-1 mt-3 text-xs text-gray-400">
          <Info size={12} />
          <span>悬停查看详情</span>
        </div>
      </div>

      {showTooltip && (
        <div
          className={cn(
            'absolute left-full top-0 ml-4 z-50',
            'w-72 bg-gray-900 text-white p-4 rounded-lg shadow-xl',
            'animate-fadeIn'
          )}
        >
          <div className="absolute -left-2 top-6 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-gray-900 border-b-8 border-b-transparent" />
          <h4 className="font-bold mb-2">{project.title}</h4>
          <p className="text-sm text-gray-300 leading-relaxed">
            {project.fullDescription}
          </p>
          <div className="mt-3 text-xs text-gray-400">
            年份: {project.year}
          </div>
        </div>
      )}
    </div>
  );
});

export default function Timeline({
  projects,
  editable = false,
  onAddProject,
  onEditProject,
  onDeleteProject,
}: TimelineProps) {
  const groupedProjects = useMemo(() => {
    const groups: Record<number, Project[]> = {};
    
    projects.forEach((project) => {
      if (!groups[project.year]) {
        groups[project.year] = [];
      }
      groups[project.year].push(project);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([year, items]) => ({
        year: Number(year),
        projects: items,
      }));
  }, [projects]);

  return (
    <div className="relative w-full overflow-x-auto pb-8">
      <style>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .hover\:shadow-lg:hover {
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15) !important;
        }

        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      {editable && (
        <div className="flex justify-end mb-4">
          <button
            onClick={onAddProject}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg',
              'bg-blue-500 text-white font-medium',
              'hover:bg-blue-600 transition-colors',
              'active:scale-95 transform'
            )}
          >
            <Plus size={18} />
            添加项目
          </button>
        </div>
      )}

      <div className="relative min-w-max px-8">
        <div className="absolute top-16 left-0 right-0 h-1 bg-gray-200" />

        <div className="flex items-start gap-12">
          {groupedProjects.map((yearGroup, groupIndex) => (
            <div key={yearGroup.year} className="relative">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-6 h-6 rounded-full bg-blue-500 border-4 border-white',
                    'shadow-md z-10 relative'
                  )}
                  style={{
                    marginTop: '56px',
                  }}
                />

                <div
                  className="text-lg font-bold text-gray-700 mt-2"
                  style={{
                    animation: `slideInLeft 0.5s ease-out ${groupIndex * 0.15}s both`,
                  }}
                >
                  {yearGroup.year}
                </div>

                <div
                  className="absolute top-20 w-px bg-gray-200"
                  style={{
                    height: `${Math.max(yearGroup.projects.length * 280, 200)}px`,
                  }}
                />
              </div>

              <div className="mt-8 flex flex-col gap-6">
                {yearGroup.projects.map((project, projectIndex) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    index={groupIndex * 10 + projectIndex}
                    tagColors={TAG_COLORS}
                    editable={editable}
                    onEditProject={onEditProject}
                    onDeleteProject={onDeleteProject}
                  />
                ))}
              </div>
            </div>
          ))}

          {groupedProjects.length === 0 && (
            <div className="w-full py-16 text-center text-gray-500">
              <p className="text-lg">暂无项目数据</p>
              {editable && (
                <button
                  onClick={onAddProject}
                  className="mt-4 text-blue-500 hover:text-blue-600 font-medium"
                >
                  点击添加第一个项目
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
