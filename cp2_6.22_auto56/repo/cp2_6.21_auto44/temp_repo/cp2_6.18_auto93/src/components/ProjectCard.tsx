import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, Trash2, Edit2, Share2 } from 'lucide-react';
import type { Project } from '../types';
import { formatDate } from '../utils/helpers';

interface ProjectCardProps {
  project: Project;
  onDelete: () => void;
  onShare: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onDelete,
  onShare,
}) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = React.useState(false);

  const handleClick = () => {
    navigate(`/project/${project.id}`);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const thumbnails = [
    `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('minimalist UI design interface')}&image_size=square`,
    `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('modern app dashboard design')}&image_size=square`,
    `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('clean mobile app screen')}&image_size=square`,
  ];

  return (
    <div
      onClick={handleClick}
      className="group relative w-[280px] h-[180px] bg-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all duration-300 cursor-pointer overflow-hidden hover:-translate-y-1"
    >
      <div className="p-4 h-full flex flex-col">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
              {project.name}
            </h3>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              {project.description || '暂无描述'}
            </p>
          </div>
          <div className="relative ml-2">
            <button
              onClick={handleMenuClick}
              className="p-1 hover:bg-slate-100 rounded transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreVertical size={16} className="text-slate-400" />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-slate-200 py-1 min-w-[120px] z-50 animate-fadeIn"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClick();
                  }}
                  className="w-full px-3 py-2 flex items-center gap-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  <Edit2 size={14} />
                  编辑
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 flex items-center gap-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  <Share2 size={14} />
                  分享
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 flex items-center gap-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                  删除
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 mt-3 grid grid-cols-3 gap-1.5">
          {thumbnails.map((src, i) => (
            <div
              key={i}
              className="rounded-lg overflow-hidden bg-slate-100 aspect-square"
            >
              <img
                src={src}
                alt={`缩略图 ${i + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <div className="flex -space-x-2">
            <div className="w-6 h-6 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full border-2 border-white" />
            <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full border-2 border-white" />
          </div>
          <span className="text-xs text-slate-400">
            {formatDate(project.updatedAt)}
          </span>
        </div>
      </div>
    </div>
  );
};
