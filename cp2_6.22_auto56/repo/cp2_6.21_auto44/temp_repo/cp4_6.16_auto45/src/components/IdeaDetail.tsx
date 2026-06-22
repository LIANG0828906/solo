import React, { useState, useRef, useEffect } from 'react';
import { useIdeaStore } from '@/store';
import {
  Milestone,
  PriorityLevel,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  MAX_MILESTONES,
} from '@/types';
import { format, addDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const EMOJI_LIST = [
  '✨', '💡', '🚀', '🎯', '🔥', '💎', '🌟', '🎨',
  '💰', '📈', '🎁', '🌈', '⚡', '🎪', '🏆', '🎵',
];

const RichTextEditor: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder }) => {
  const [showEmoji, setShowEmoji] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const applyFormat = (format: 'bold' | 'italic') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    let prefix = '';
    let suffix = '';

    if (format === 'bold') {
      prefix = '**';
      suffix = '**';
    } else {
      prefix = '*';
      suffix = '*';
    }

    const newText =
      value.substring(0, start) + prefix + selectedText + suffix + value.substring(end);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const pos = textarea.selectionStart;
    const newText = value.substring(0, pos) + emoji + value.substring(pos);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(pos + emoji.length, pos + emoji.length);
    }, 0);

    setShowEmoji(false);
  };

  const renderFormattedText = (text: string) => {
    let result = text;
    result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    result = result.replace(/\*(.+?)\*/g, '<em>$1</em>');
    result = result.replace(/\n/g, '<br />');
    return result;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        <button
          onClick={() => applyFormat('bold')}
          className="glass glass-hover p-2 rounded-lg font-bold text-sm"
          title="加粗"
        >
          B
        </button>
        <button
          onClick={() => applyFormat('italic')}
          className="glass glass-hover p-2 rounded-lg italic text-sm"
          title="斜体"
        >
          I
        </button>
        <div className="relative" ref={emojiRef}>
          <button
            onClick={() => setShowEmoji((v) => !v)}
            className="glass glass-hover p-2 rounded-lg text-sm"
            title="插入表情"
          >
            😊
          </button>
          {showEmoji && (
            <div className="absolute left-0 top-full mt-2 glass animate-dropdown z-50 p-2 grid grid-cols-8 gap-1 min-w-[220px]">
              {EMOJI_LIST.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => insertEmoji(emoji)}
                  className="p-1.5 rounded hover:bg-white/10 text-lg transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={5}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all resize-none leading-relaxed"
        />
        {value && (
          <div className="mt-2 p-3 rounded-xl bg-white/5 border border-white/10 text-sm leading-relaxed whitespace-pre-wrap">
            <div dangerouslySetInnerHTML={{ __html: renderFormattedText(value) || '<span class="text-slate-500">预览区域...</span>' }} />
          </div>
        )}
      </div>
    </div>
  );
};

const ProgressSlider: React.FC<{
  value: number;
  onChange: (v: number) => void;
}> = ({ value, onChange }) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = (clientX: number) => {
    const rect = sliderRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.round((x / rect.width) * 100);
    onChange(percent);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleMove(e.clientX);
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="flex items-center gap-3">
      <div
        ref={sliderRef}
        onMouseDown={handleMouseDown}
        className="relative flex-1 h-2 rounded-full bg-white/10 cursor-pointer group"
      >
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all"
          style={{ width: `${value}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-lg group-hover:scale-110 transition-transform"
          style={{ left: `calc(${value}% - 8px)` }}
        />
      </div>
      <span className="text-xs font-medium w-10 text-right text-slate-300">{value}%</span>
    </div>
  );
};

const MilestoneCard: React.FC<{
  milestone: Milestone;
  ideaId: string;
  index: number;
}> = ({ milestone, ideaId, index }) => {
  const updateMilestone = useIdeaStore((s) => s.updateMilestone);
  const deleteMilestone = useIdeaStore((s) => s.deleteMilestone);
  const toggleMilestoneComplete = useIdeaStore((s) => s.toggleMilestoneComplete);

  return (
    <div
      className={`glass p-4 transition-all duration-300 ${
        milestone.completed ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => toggleMilestoneComplete(ideaId, milestone.id)}
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
            milestone.completed
              ? 'bg-emerald-500 border-emerald-500'
              : 'border-white/30 hover:border-emerald-400'
          }`}
        >
          {milestone.completed && (
            <svg className="w-4 h-4 text-white animate-checkmark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-violet-400 font-medium">#{index + 1}</span>
            <input
              type="text"
              value={milestone.name}
              onChange={(e) =>
                updateMilestone(ideaId, milestone.id, { name: e.target.value })
              }
              className={`flex-1 bg-transparent text-sm font-medium outline-none placeholder-slate-500 ${
                milestone.completed ? 'line-through text-slate-400' : ''
              }`}
              placeholder="里程碑名称..."
            />
          </div>

          <input
            type="text"
            value={milestone.description}
            onChange={(e) =>
              updateMilestone(ideaId, milestone.id, { description: e.target.value })
            }
            className="w-full bg-transparent text-xs text-slate-400 outline-none placeholder-slate-600"
            placeholder="描述这个里程碑的具体内容..."
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">开始日期</label>
              <input
                type="date"
                value={milestone.startDate}
                onChange={(e) =>
                  updateMilestone(ideaId, milestone.id, { startDate: e.target.value })
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:border-violet-500/50 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">完成日期</label>
              <input
                type="date"
                value={milestone.endDate}
                onChange={(e) =>
                  updateMilestone(ideaId, milestone.id, { endDate: e.target.value })
                }
                className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:border-violet-500/50 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-xs text-slate-500 mb-1">进度</label>
              <ProgressSlider
                value={milestone.progress}
                onChange={(v) => updateMilestone(ideaId, milestone.id, { progress: v })}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">优先级</label>
              <select
                value={milestone.priority}
                onChange={(e) =>
                  updateMilestone(ideaId, milestone.id, {
                    priority: e.target.value as PriorityLevel,
                  })
                }
                className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:border-violet-500/50 outline-none cursor-pointer"
                style={{ color: PRIORITY_COLORS[milestone.priority] }}
              >
                {(['high', 'medium', 'low'] as PriorityLevel[]).map((p) => (
                  <option key={p} value={p} className="bg-slate-800">
                    {PRIORITY_LABELS[p]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <button
          onClick={() => deleteMilestone(ideaId, milestone.id)}
          className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all flex-shrink-0"
          title="删除里程碑"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

const AddMilestoneModal: React.FC<{
  ideaId: string;
  onClose: () => void;
}> = ({ ideaId, onClose }) => {
  const addMilestone = useIdeaStore((s) => s.addMilestone);
  const today = format(new Date(), 'yyyy-MM-dd');
  const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd');

  const [form, setForm] = useState({
    name: '',
    description: '',
    startDate: today,
    endDate: nextWeek,
    priority: 'medium' as PriorityLevel,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    addMilestone(ideaId, {
      ...form,
      progress: 0,
      completed: false,
    });
    onClose();
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
        <h2 className="text-xl font-bold mb-5">🎯 新里程碑</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2">里程碑名称</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="例如：完成市场调研"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">描述</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="详细描述这个里程碑..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-2">开始日期</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:border-violet-500/50 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-2">完成日期</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:border-violet-500/50 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">优先级</label>
            <div className="grid grid-cols-3 gap-2">
              {(['high', 'medium', 'low'] as PriorityLevel[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setForm({ ...form, priority: p })}
                  className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    form.priority === p
                      ? 'bg-white/10 border-white/20'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                  style={{
                    color: PRIORITY_COLORS[p],
                    borderColor: form.priority === p ? PRIORITY_COLORS[p] : undefined,
                  }}
                >
                  {PRIORITY_LABELS[p]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm text-slate-300 hover:bg-white/5 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={!form.name.trim()}
            className="px-5 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            添加里程碑
          </button>
        </div>
      </form>
    </div>
  );
};

const EmptyDetail: React.FC = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-8">
      <div className="w-24 h-24 mb-6 rounded-3xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center">
        <svg className="w-12 h-12 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      </div>
      <h3 className="text-xl font-semibold mb-2">选择一个灵感开始孵化</h3>
      <p className="text-sm text-slate-400 max-w-xs">
        点击左侧任意灵感卡片查看详情，设定里程碑，追踪创业进度
      </p>
    </div>
  );
};

const IdeaDetail: React.FC = () => {
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const {
    ideas,
    selectedIdeaId,
    updateIdea,
    toggleGantt,
    deleteIdea,
    selectIdea,
    isMobileDetailOpen,
    setMobileDetailOpen,
  } = useIdeaStore();

  const selectedIdea = ideas.find((i) => i.id === selectedIdeaId);

  if (!selectedIdea) {
    return (
      <div className="hidden md:block h-full">
        <EmptyDetail />
      </div>
    );
  }

  const overallProgress =
    selectedIdea.milestones.length > 0
      ? Math.round(
          selectedIdea.milestones.reduce((acc, m) => acc + m.progress, 0) /
            selectedIdea.milestones.length
        )
      : 0;

  const completedCount = selectedIdea.milestones.filter((m) => m.completed).length;

  return (
    <div
      className={`h-full flex flex-col ${
        isMobileDetailOpen
          ? 'fixed inset-0 z-40 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] md:relative md:bg-transparent'
          : 'hidden md:flex'
      }`}
    >
      <div className="flex items-center gap-2 p-4 border-b border-white/10">
        <button
          onClick={() => {
            selectIdea(null);
            setMobileDetailOpen(false);
          }}
          className="md:hidden glass glass-hover p-2 rounded-xl"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 text-xs text-slate-400">
          创建于 {format(new Date(selectedIdea.createdAt), 'yyyy年MM月dd日', { locale: zhCN })}
        </div>
        <button
          onClick={toggleGantt}
          disabled={selectedIdea.milestones.length === 0}
          className="glass glass-hover px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          甘特图
        </button>
        <button
          onClick={() => {
            if (confirm('确定要删除这个灵感吗？')) {
              deleteIdea(selectedIdea.id);
            }
          }}
          className="glass glass-hover p-2 rounded-xl text-slate-400 hover:text-red-400 hover:!bg-red-500/10"
          title="删除灵感"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        <div className="space-y-3">
          <input
            type="text"
            value={selectedIdea.title}
            onChange={(e) => updateIdea(selectedIdea.id, { title: e.target.value })}
            className="w-full bg-transparent text-2xl md:text-3xl font-bold outline-none placeholder-slate-500"
            placeholder="灵感标题..."
          />
          <div className="flex items-center gap-4 flex-wrap">
            <div className="glass px-4 py-2 rounded-xl flex items-center gap-2">
              <span className="text-xs text-slate-400">总进度</span>
              <div className="w-32 h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all duration-500"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-violet-400">{overallProgress}%</span>
            </div>
            <div className="glass px-4 py-2 rounded-xl text-xs text-slate-300">
              {completedCount}/{selectedIdea.milestones.length} 里程碑完成
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm text-slate-400 font-medium">灵感描述</label>
          <RichTextEditor
            value={selectedIdea.description}
            onChange={(v) => updateIdea(selectedIdea.id, { description: v })}
            placeholder="详细描述你的创业灵感，目标用户、商业模式、竞争优势..."
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-200">
              🎯 里程碑
              <span className="ml-2 text-xs text-slate-500 font-normal">
                ({selectedIdea.milestones.length}/{MAX_MILESTONES})
              </span>
            </h4>
            <button
              onClick={() => setShowAddMilestone(true)}
              disabled={selectedIdea.milestones.length >= MAX_MILESTONES}
              className="glass glass-hover px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              添加里程碑
            </button>
          </div>

          {selectedIdea.milestones.length === 0 ? (
            <div className="glass p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/5 flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-sm text-slate-400 mb-4">还没有设定里程碑</p>
              <button
                onClick={() => setShowAddMilestone(true)}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/25 transition-all"
              >
                创建第一个里程碑
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedIdea.milestones.map((milestone, index) => (
                <MilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  ideaId={selectedIdea.id}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddMilestone && (
        <AddMilestoneModal ideaId={selectedIdea.id} onClose={() => setShowAddMilestone(false)} />
      )}
    </div>
  );
};

export default IdeaDetail;
