import React, { useState, useRef } from 'react';
import { MoreVertical, Pencil, Copy, Trash2, Clock, Tag } from 'lucide-react';
import type { Project } from '../../shared/types';
import { getProjectWordCount } from '../utils/api';

interface ProjectCardProps {
  project: Project;
  onRename: (id: string, title: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onReorder?: (draggedId: string, targetId: string) => void;
  onClick: () => void;
  onOrderChange: (ids: string[]) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onRename,
  onDuplicate,
  onDelete,
  onClick,
  onOrderChange,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(project.title);
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const dragPos = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const springVelocity = useRef({ x: 0, y: 0 });

  const wordCount = getProjectWordCount(project.id);
  const progress = Math.min(100, project.targetWordCount > 0 ? (wordCount / project.targetWordCount) * 100 : 0);
  const circumference = 2 * Math.PI * 32;
  const offset = circumference - (progress / 100) * circumference;

  const tagColors: Record<string, string> = {
    小说: 'bg-purple-500',
    散文: 'bg-green-500',
    技术博客: 'bg-blue-500',
    诗歌: 'bg-pink-500',
    杂文: 'bg-orange-500',
  };

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect) {
      offsetRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
    e.dataTransfer.setData('text/plain', project.id);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setDragImage(new Image(), 0, 0);
    } catch {
      /* ignore */
    }

    const springFollow = () => {
      if (!cardRef.current || !isDragging) return;
      const targetX = dragPos.current.x - offsetRef.current.x - cardRef.current.getBoundingClientRect().left + cardRef.current.scrollLeft;
      const targetY = dragPos.current.y - offsetRef.current.y - cardRef.current.getBoundingClientRect().top + cardRef.current.scrollTop;
      springVelocity.current.x += (targetX - springVelocity.current.x) * 0.15;
      springVelocity.current.y += (targetY - springVelocity.current.y) * 0.15;
      springVelocity.current.x *= 0.8;
      springVelocity.current.y *= 0.8;
      cardRef.current.style.transform = `translate(${springVelocity.current.x}px, ${springVelocity.current.y}px) rotate(${springVelocity.current.x * 0.05}deg)`;
      rafRef.current = requestAnimationFrame(springFollow);
    };

    const handleDragMove = (ev: MouseEvent) => {
      dragPos.current = { x: ev.clientX, y: ev.clientY };
    };
    window.addEventListener('mousemove', handleDragMove);

    const handleDragEnd = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (cardRef.current) {
        cardRef.current.style.transform = '';
        cardRef.current.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
        setTimeout(() => {
          if (cardRef.current) cardRef.current.style.transition = '';
        }, 300);
      }
      springVelocity.current = { x: 0, y: 0 };
    };
    window.addEventListener('mouseup', handleDragEnd);

    rafRef.current = requestAnimationFrame(springFollow);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId && draggedId !== project.id) {
      onOrderChange([draggedId, project.id]);
    }
  };

  const handleRename = () => {
    if (editTitle.trim() && editTitle !== project.title) {
      onRename(project.id, editTitle.trim());
    }
    setEditing(false);
  };

  return (
    <div
      ref={cardRef}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={(e) => {
        if (editing || showMenu || (e.target as HTMLElement).closest('.card-menu')) return;
        onClick();
      }}
      className={`relative bg-surface-card rounded-xl shadow-md p-5 cursor-pointer transition-all duration-300 group hover:shadow-xl hover:-translate-y-1 ${
        isDragging ? 'opacity-50 z-50 pointer-events-none' : ''
      } ${
        isDragOver ? 'ring-2 ring-accent bg-primary-50 scale-105' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              autoFocus
              className="font-serif text-lg font-bold text-primary-700 bg-primary-50 border border-primary-200 rounded px-2 py-0.5 w-full focus:outline-none focus:ring-2 focus:ring-accent"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <h3 className="font-serif text-lg font-bold text-primary-700 truncate">{project.title}</h3>
          )}
          <div className="flex items-center gap-2 mt-1 text-xs text-primary-400">
            <Clock className="w-3 h-3" />
            <span>{project.deadline || '未设置截止日期'}</span>
          </div>
        </div>

        <div className="relative card-menu">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-primary-100 transition-opacity"
          >
            <MoreVertical className="w-4 h-4 text-primary-400" />
          </button>
          {showMenu && (
            <div
              className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-primary-100 py-1 z-20 min-w-[120px] animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="w-full px-3 py-1.5 text-left text-sm text-primary-600 hover:bg-primary-50 flex items-center gap-2"
                onClick={() => {
                  setEditing(true);
                  setShowMenu(false);
                }}
              >
                <Pencil className="w-3.5 h-3.5" /> 重命名
              </button>
              <button
                className="w-full px-3 py-1.5 text-left text-sm text-primary-600 hover:bg-primary-50 flex items-center gap-2"
                onClick={() => {
                  onDuplicate(project.id);
                  setShowMenu(false);
                }}
              >
                <Copy className="w-3.5 h-3.5" /> 复制
              </button>
              <button
                className="w-full px-3 py-1.5 text-left text-sm text-warning hover:bg-primary-50 flex items-center gap-2"
                onClick={() => {
                  if (confirm(`确定删除 "${project.title}" 吗？`)) {
                    onDelete(project.id);
                  }
                  setShowMenu(false);
                }}
              >
                <Trash2 className="w-3.5 h-3.5" /> 删除
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r="32" fill="none" stroke="#E8F0FE" strokeWidth="4" />
            <circle
              cx="36"
              cy="36"
              r="32"
              fill="none"
              stroke="#3498DB"
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-xs font-bold text-primary-700">{Math.round(progress)}%</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-sm text-primary-600 font-medium">
            {wordCount.toLocaleString()} / {project.targetWordCount.toLocaleString()} 字
          </div>
          <div className="h-1.5 bg-primary-100 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent to-accent-light rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {project.tags && project.tags.length > 0 && (
        <div className="flex items-center gap-1.5 mt-4 flex-wrap">
          <Tag className="w-3 h-3 text-primary-300" />
          {project.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className={`px-2 py-0.5 text-xs text-white rounded-full ${tagColors[tag] || 'bg-primary-400'}`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectCard;
