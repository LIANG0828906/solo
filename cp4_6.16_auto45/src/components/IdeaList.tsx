import React, { useState, useRef, useEffect } from 'react';
import { useIdeaStore } from '@/store';
import {
  Idea,
  IdeaStatus,
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_LABEL_COLORS,
  MAX_IDEAS,
} from '@/types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const ALL_STATUSES: IdeaStatus[] = ['fresh', 'hatching', 'launched', 'abandoned'];

interface Particle {
  id: number;
  tx: number;
  ty: number;
  x: number;
  y: number;
}

const StarRating: React.FC<{
  score: number;
  ideaId: string;
}> = ({ score, ideaId }) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const particleIdRef = useRef(0);
  const updateCreativeScore = useIdeaStore((s) => s.updateCreativeScore);

  const handleStarClick = (rating: number, event: React.MouseEvent) => {
    updateCreativeScore(ideaId, rating);

    const rect = containerRef.current?.getBoundingClientRect();
    const clickX = event.clientX - (rect?.left || 0);
    const clickY = event.clientY - (rect?.top || 0);

    const newParticles: Particle[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.5;
      const distance = 30 + Math.random() * 40;
      newParticles.push({
        id: particleIdRef.current++,
        tx: Math.cos(angle) * distance,
        ty: Math.sin(angle) * distance,
        x: clickX,
        y: clickY,
      });
    }

    setParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
    }, 800);
  };

  return (
    <div className="relative inline-flex items-center gap-0.5" ref={containerRef}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = (hoverRating || score) >= star;
        return (
          <button
            key={star}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={(e) => handleStarClick(star, e)}
            className="relative p-0.5 transition-transform hover:scale-125"
            style={{ width: 22, height: 22 }}
          >
            <svg viewBox="0 0 24 24" fill={filled ? 'var(--color-star)' : 'none'}>
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                stroke={filled ? 'var(--color-star)' : 'rgba(255,255,255,0.3)'}
                strokeWidth={1.5}
                strokeLinejoin="round"
              />
            </svg>
          </button>
        );
      })}
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute animate-particle pointer-events-none"
          style={
            {
              left: p.x,
              top: p.y,
              '--tx': `${p.tx}px`,
              '--ty': `${p.ty}px`,
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--color-star)',
              boxShadow: '0 0 8px var(--color-star)',
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
};

const StatusDropdown: React.FC<{
  currentStatus: IdeaStatus;
  ideaId: string;
}> = ({ currentStatus, ideaId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const updateStatus = useIdeaStore((s) => s.updateStatus);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((v) => !v);
        }}
        className="glass glass-hover px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5"
        style={{ color: STATUS_LABEL_COLORS[currentStatus] }}
      >
        <span
          className="w-2 h-2 rounded-full"
          style={{ background: STATUS_LABEL_COLORS[currentStatus] }}
        />
        {STATUS_LABELS[currentStatus]}
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 glass animate-dropdown z-50 overflow-hidden min-w-[120px]">
          {ALL_STATUSES.map((status) => (
            <button
              key={status}
              onClick={(e) => {
                e.stopPropagation();
                updateStatus(ideaId, status);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-xs font-medium hover:bg-white/10 transition-colors flex items-center gap-2 ${
                status === currentStatus ? 'bg-white/5' : ''
              }`}
              style={{ color: STATUS_LABEL_COLORS[status] }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: STATUS_LABEL_COLORS[status] }}
              />
              {STATUS_LABELS[status]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const IdeaCard: React.FC<{
  idea: Idea;
  isSelected: boolean;
  onClick: () => void;
}> = ({ idea, isSelected, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`glass glass-hover p-4 cursor-pointer relative transition-all duration-300 ${
        isSelected ? 'ring-2 ring-violet-500/50 scale-[1.02]' : ''
      }`}
      style={{
        background: STATUS_COLORS[idea.status],
        backdropFilter: 'blur(20px) saturate(180%)',
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-semibold text-base leading-tight flex-1 line-clamp-2">
          {idea.title}
        </h3>
        <StatusDropdown currentStatus={idea.status} ideaId={idea.id} />
      </div>

      <p className="text-xs text-slate-300/80 mb-3 line-clamp-2 leading-relaxed">
        {idea.description || '暂无描述'}
      </p>

      <div className="flex items-center justify-between">
        <StarRating score={idea.creativeScore} ideaId={idea.id} />
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            {idea.milestones.length}
          </span>
          <span>{format(new Date(idea.createdAt), 'MM/dd', { locale: zhCN })}</span>
        </div>
      </div>
    </div>
  );
};

const AddIdeaModal: React.FC<{
  onClose: () => void;
}> = ({ onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const addIdea = useIdeaStore((s) => s.addIdea);
  const ideasLength = useIdeaStore((s) => s.ideas.length);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const success = addIdea(title.trim(), description.trim());
    if (success) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-modal-fade"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <form
        className="glass p-6 w-full max-w-md mx-4 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2 className="text-xl font-bold mb-4">✨ 捕捉新灵感</h2>
        <div className="mb-4">
          <label className="block text-sm text-slate-300 mb-2">灵感名称</label>
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="给你的点子起个名字..."
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm text-slate-300 mb-2">简单描述</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="这是一个什么样的想法？解决什么问题？"
            rows={4}
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all resize-none"
          />
        </div>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm text-slate-300 hover:bg-white/5 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={!title.trim() || ideasLength >= MAX_IDEAS}
            className="px-5 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            创建灵感
          </button>
        </div>
      </form>
    </div>
  );
};

const IdeaList: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const ideas = useIdeaStore((s) => s.ideas);
  const selectedIdeaId = useIdeaStore((s) => s.selectedIdeaId);
  const selectIdea = useIdeaStore((s) => s.selectIdea);
  const toggleSidebar = useIdeaStore((s) => s.toggleSidebar);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="glass glass-hover p-2.5 rounded-xl"
              title="仪表盘"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                PopUpIdea
              </h1>
              <p className="text-xs text-slate-400">创业灵感孵化器</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            disabled={ideas.length >= MAX_IDEAS}
            className="glass glass-hover p-2.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
            title="新建灵感"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">
            {ideas.length} / {MAX_IDEAS} 个灵感
          </span>
          {ideas.length >= MAX_IDEAS && (
            <span className="text-amber-400">已达上限</span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {ideas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-20 h-20 mb-4 rounded-3xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-violet-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">灵感还在路上</h3>
            <p className="text-sm text-slate-400 mb-4">
              点击右上角的 + 号，记录你的第一个商业灵感吧！
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/25 transition-all"
            >
              ✨ 记录第一个灵感
            </button>
          </div>
        ) : (
          ideas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              isSelected={selectedIdeaId === idea.id}
              onClick={() => selectIdea(idea.id)}
            />
          ))
        )}
      </div>

      {showAddModal && <AddIdeaModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
};

export default IdeaList;
