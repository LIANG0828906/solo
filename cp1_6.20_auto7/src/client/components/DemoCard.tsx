import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ThumbsDown, Eye, MessageSquare, AlertTriangle } from 'lucide-react';
import type { Demo } from '../types';
import { cn } from '../lib/utils';

interface DemoCardProps {
  demo: Demo;
  className?: string;
}

export const DemoCard: React.FC<DemoCardProps> = ({ demo, className }) => {
  const navigate = useNavigate();

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div
      className={cn(
        'group relative bg-[#16213e] rounded-xl overflow-hidden cursor-pointer',
        'transition-all duration-300 ease-out',
        'hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#e94560]/20',
        className
      )}
      onClick={() => navigate(`/detail/${demo.id}`)}
    >
      <div className="relative aspect-video overflow-hidden">
        <img
          src={demo.coverImage}
          alt={demo.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e] via-transparent to-transparent opacity-80" />
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-lg font-bold text-white truncate">{demo.title}</h3>
        </div>
      </div>

      <div className="p-4">
        <p className="text-gray-400 text-sm line-clamp-2 mb-4 h-10">
          {demo.description}
        </p>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <span>{formatDate(demo.createdAt)}</span>
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            <span>{demo.feedbackCount + demo.crashCount}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-green-400">
            <Heart className="w-4 h-4 fill-current" />
            <span className="text-sm font-medium">{demo.likes}</span>
          </div>
          <div className="flex items-center gap-1 text-red-400">
            <ThumbsDown className="w-4 h-4" />
            <span className="text-sm font-medium">{demo.dislikes}</span>
          </div>
          <div className="flex items-center gap-1 text-blue-400">
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm font-medium">{demo.feedbackCount}</span>
          </div>
          <div className="flex items-center gap-1 text-yellow-400">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">{demo.crashCount}</span>
          </div>
        </div>
      </div>

      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="bg-[#e94560] text-white text-xs px-3 py-1 rounded-full font-medium">
          查看详情
        </div>
      </div>
    </div>
  );
};
