import type { Project } from '@/types';
import { INSTRUMENTS } from '@/types';

/**
 * 项目卡片组件
 * - 横向滑入+上浮动画
 * - 显示项目名、调性、BPM、乐器列表
 */
interface ProjectCardProps {
  project: Project;
  animationDelay?: number;
  onClick?: () => void;
}

/**
 * 根据乐器ID获取emoji图标
 */
const getInstrumentEmoji = (instrumentId: string): string => {
  const instrument = INSTRUMENTS.find((i) => i.id === instrumentId);
  return instrument?.icon ?? '🎵';
};

export function ProjectCard({
  project,
  animationDelay = 0,
  onClick,
}: ProjectCardProps) {
  return (
    <div
      onClick={onClick}
      className="project-card card-enter cursor-pointer rounded-2xl p-6 border border-white/10 shadow-lg"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* 顶部：项目名 + 调性徽章 */}
      <div className="flex items-start justify-between mb-4">
        <h3
          className="text-xl font-bold text-white line-clamp-1 flex-1 mr-3"
          title={project.name}
        >
          {project.name}
        </h3>
        <span
          className="flex-shrink-0 px-3 py-1 rounded-full text-sm font-semibold text-white"
          style={{ backgroundColor: '#e94560' }}
        >
          {project.key}
        </span>
      </div>

      {/* 中部：BPM + 乐器图标 */}
      <div className="flex items-center justify-between">
        {/* BPM */}
        <div className="flex items-center gap-2 text-white/70">
          <span className="text-sm font-medium">BPM</span>
          <span className="text-lg font-bold text-white">{project.bpm}</span>
        </div>

        {/* 乐器图标列表 */}
        <div className="flex items-center gap-1">
          {project.instruments.slice(0, 5).map((instrument, index) => (
            <span
              key={`${instrument}-${index}`}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-lg"
              title={instrument}
            >
              {getInstrumentEmoji(instrument)}
            </span>
          ))}
          {project.instruments.length > 5 && (
            <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-xs text-white/60 font-medium">
              +{project.instruments.length - 5}
            </span>
          )}
        </div>
      </div>

      {/* 底部：创建者信息 */}
      <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-sm text-white/50">
        <span className="truncate max-w-[120px]" title={project.creatorName}>
          {project.creatorName}
        </span>
        <span>
          {new Date(project.updatedAt).toLocaleDateString('zh-CN', {
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>
    </div>
  );
}

export default ProjectCard;
