import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Pencil, Share2, MoreHorizontal, Check, Clock } from 'lucide-react';
import type { Project } from '@/types';
import { useInkFlowStore } from '@/store/useInkFlowStore';
import { formatRelativeTime } from '@/utils/formatTime';

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onShare: (project: Project) => void;
  onMore: (project: Project, event: React.MouseEvent) => void;
}

const ProjectCard = memo(function ProjectCard({
  project,
  onEdit,
  onShare,
  onMore,
}: ProjectCardProps) {
  const navigate = useNavigate();
  const toggleFavorite = useInkFlowStore((s) => s.toggleFavorite);
  const getProjectProgress = useInkFlowStore((s) => s.getProjectProgress);

  const progress = getProjectProgress(project.id);
  const progressPercent = progress.percent;

  const handleCardClick = () => {
    navigate(`/project/${project.id}`);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(project.id);
  };

  const handleActionClick = (
    e: React.MouseEvent,
    action: 'edit' | 'share' | 'more'
  ) => {
    e.stopPropagation();
    if (action === 'edit') onEdit(project);
    else if (action === 'share') onShare(project);
    else onMore(project, e);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative overflow-hidden cursor-pointer select-none"
      style={{
        width: '280px',
        height: '200px',
        borderRadius: '16px',
        background: `linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)`,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)';
        e.currentTarget.style.transform = 'scale(1.02)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 z-10 flex items-center justify-end gap-1 px-3 py-2 opacity-0 group-hover:opacity-100"
        style={{
          background: 'rgba(0,0,0,0.4)',
          transition: 'opacity 0.2s ease',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
        }}
      >
        <button
          onClick={(e) => handleActionClick(e, 'edit')}
          className="p-1.5 rounded text-white/80 hover:text-white hover:bg-white/10 transition-all active:scale-[0.96]"
          title="编辑"
        >
          <Pencil size={16} />
        </button>
        <button
          onClick={(e) => handleActionClick(e, 'share')}
          className="p-1.5 rounded text-white/80 hover:text-white hover:bg-white/10 transition-all active:scale-[0.96]"
          title="分享"
        >
          <Share2 size={16} />
        </button>
        <button
          onClick={(e) => handleActionClick(e, 'more')}
          className="p-1.5 rounded text-white/80 hover:text-white hover:bg-white/10 transition-all active:scale-[0.96]"
          title="更多"
        >
          <MoreHorizontal size={16} />
        </button>
      </div>

      <div className="flex flex-col h-full pt-10">
        <div
          className="h-16 mx-4 mt-4 rounded-xl flex items-center justify-center relative"
          style={{ background: project.coverColor }}
        >
          <span
            className="text-white font-bold text-xl tracking-wider drop-shadow-sm"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
          >
            {project.title.charAt(0)}
          </span>
          {progress.total > 0 && (
            <div
              className="absolute -top-2 -right-2 bg-white rounded-full px-2 py-0.5 text-xs font-medium flex items-center gap-1 shadow-sm"
              style={{ color: '#6366F1' }}
            >
              <Check size={10} strokeWidth={3} />
              {progress.completed}/{progress.total}
            </div>
          )}
        </div>

        <div className="px-4 pt-3 flex-1 flex flex-col min-h-0">
          <div className="flex items-start justify-between gap-2">
            <h3
              className="font-semibold text-gray-800 truncate flex-1 leading-tight"
              style={{ fontSize: '15px' }}
              title={project.title}
            >
              {project.title}
            </h3>
          </div>
          <p
            className="text-gray-500 mt-1 line-clamp-2"
            style={{ fontSize: '12px', lineHeight: '1.5' }}
            title={project.description}
          >
            {project.description || '暂无简介'}
          </p>
        </div>

        <div className="px-4 pb-3 mt-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1 text-gray-400" style={{ fontSize: '11px' }}>
              <Clock size={12} />
              <span>{formatRelativeTime(project.updatedAt)}</span>
            </div>
            <button
              onClick={handleFavoriteClick}
              className="p-1 rounded hover:bg-white/60 transition-all active:scale-[0.96]"
              title={project.isFavorite ? '取消收藏' : '收藏'}
            >
              <Star
                size={16}
                style={{
                  fill: project.isFavorite ? '#F59E0B' : 'none',
                  color: project.isFavorite ? '#F59E0B' : '#9CA3AF',
                  transition: 'fill 0.2s ease, color 0.2s ease',
                }}
              />
            </button>
          </div>

          <div
            className="w-full overflow-hidden relative"
            style={{
              height: '4px',
              borderRadius: '2px',
              background: '#E2E8F0',
            }}
          >
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)',
                borderRadius: '2px',
                transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          </div>
          <div className="flex justify-between mt-1" style={{ fontSize: '10px' }}>
            <span className="text-gray-400">
              {progress.total > 0 ? `进度 ${progress.percent}%` : '暂无章节'}
            </span>
            {project.isFavorite && (
              <span style={{ color: '#F59E0B' }} className="font-medium">
                ★ 已收藏
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default ProjectCard;
