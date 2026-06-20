import React, { useState, useCallback } from 'react';
import { format, isPast, isToday } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Plus, Calendar, Check, X, GripVertical, Clock, AlertCircle } from 'lucide-react';
import type { ActionItem, TeamMember } from '@/types';
import { cn } from '@/lib/utils';

interface ActionBoardProps {
  actionItems: ActionItem[];
  members: TeamMember[];
  onStatusChange: (id: string, status: ActionItem['status']) => void;
  onAddAction: (action: Omit<ActionItem, 'id' | 'createdAt'>) => void;
  isHost?: boolean;
}

const STATUS_CONFIG = {
  todo: { label: '待办', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  in_progress: { label: '进行中', color: 'bg-primary-500/20 text-primary-400 border-primary-500/30' },
  completed: { label: '已完成', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
} as const;

const CONFETTI_COLORS = ['#00bcd4', '#ffd700', '#ff6b6b', '#4ade80', '#a78bfa', '#f472b6'];

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  color: string;
  delay: number;
  rotation: number;
}

function ActionBoard({ actionItems, members, onStatusChange, onAddAction, isHost = false }: ActionBoardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<ActionItem['status'] | null>(null);
  const [completingItems, setCompletingItems] = useState<Set<string>>(new Set());
  const [confetti, setConfetti] = useState<Map<string, ConfettiPiece[]>>(new Map());
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigneeId: '',
    dueDate: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const columns: { status: ActionItem['status']; items: ActionItem[] }[] = [
    { status: 'todo', items: actionItems.filter(item => item.status === 'todo') },
    { status: 'in_progress', items: actionItems.filter(item => item.status === 'in_progress') },
    { status: 'completed', items: actionItems.filter(item => item.status === 'completed') },
  ];

  const generateConfetti = useCallback((itemId: string) => {
    const pieces: ConfettiPiece[] = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 50,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      delay: Math.random() * 0.3,
      rotation: Math.random() * 360,
    }));
    setConfetti(prev => new Map(prev).set(itemId, pieces));
    setTimeout(() => {
      setConfetti(prev => {
        const next = new Map(prev);
        next.delete(itemId);
        return next;
      });
    }, 1500);
  }, []);

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', itemId);
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedItem(null);
    setDragOverColumn(null);
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '1';
  };

  const handleDragOver = (e: React.DragEvent, status: ActionItem['status']) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, status: ActionItem['status']) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('text/plain');
    if (itemId && draggedItem) {
      const item = actionItems.find(i => i.id === itemId);
      if (item && item.status !== status) {
        if (status === 'completed') {
          setCompletingItems(prev => new Set(prev).add(itemId));
          generateConfetti(itemId);
          setTimeout(() => {
            onStatusChange(itemId, status);
            setCompletingItems(prev => {
              const next = new Set(prev);
              next.delete(itemId);
              return next;
            });
          }, 600);
        } else {
          onStatusChange(itemId, status);
        }
      }
    }
    setDraggedItem(null);
    setDragOverColumn(null);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.title.trim()) errors.title = '请输入行动项标题';
    if (!formData.assigneeId) errors.assigneeId = '请选择负责人';
    if (!formData.dueDate) errors.dueDate = '请选择截止日期';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const assignee = members.find(m => m.id === formData.assigneeId);
    if (!assignee) return;

    onAddAction({
      title: formData.title.trim(),
      description: formData.description.trim(),
      status: 'todo',
      assigneeId: formData.assigneeId,
      assigneeName: assignee.name,
      dueDate: formData.dueDate,
    });

    setFormData({ title: '', description: '', assigneeId: '', dueDate: '' });
    setFormErrors({});
    setIsModalOpen(false);
  };

  const getDueDateStyle = (dueDate: string) => {
    const date = new Date(dueDate);
    if (isPast(date) && !isToday(date)) return 'text-red-400';
    if (isToday(date)) return 'text-amber-400';
    return 'text-white/60';
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold font-display">行动项看板</h2>
        {isHost && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            添加行动项
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map(({ status, items }) => (
          <div
            key={status}
            className={cn(
              'glass-card p-4 min-h-[400px] transition-all duration-300',
              dragOverColumn === status && 'ring-2 ring-primary-500/50 bg-primary-500/10'
            )}
            onDragOver={(e) => handleDragOver(e, status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, status)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className={cn('px-2 py-1 rounded-md text-xs font-medium border', STATUS_CONFIG[status].color)}>
                  {STATUS_CONFIG[status].label}
                </span>
                <span className="text-white/50 text-sm">{items.length}</span>
              </div>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => {
                const isCompleting = completingItems.has(item.id);
                const itemConfetti = confetti.get(item.id);
                const staggerClass = `animate-stagger-${Math.min(index + 1, 8) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      'glass-card glass-card-hover p-4 cursor-grab active:cursor-grabbing relative overflow-hidden',
                      'fade-in slide-up list-item-optimize transition-all duration-300',
                      staggerClass,
                      isCompleting && 'scale-105 bg-emerald-500/20',
                      draggedItem === item.id && 'opacity-50'
                    )}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.id)}
                    onDragEnd={handleDragEnd}
                  >
                    {itemConfetti && (
                      <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {itemConfetti.map((piece) => (
                          <div
                            key={piece.id}
                            className="confetti-piece"
                            style={{
                              left: `${piece.x}%`,
                              top: `${piece.y}%`,
                              backgroundColor: piece.color,
                              animationDelay: `${piece.delay}s`,
                              transform: `rotate(${piece.rotation}deg)`,
                            }}
                          />
                        ))}
                      </div>
                    )}

                    <div className="flex items-start gap-2">
                      <GripVertical className="w-4 h-4 text-white/30 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className={cn(
                            'font-medium truncate transition-all duration-300',
                            isCompleting && 'text-emerald-400'
                          )}>
                            {item.title}
                          </h4>
                          {isCompleting && (
                            <Check className="w-4 h-4 text-emerald-400 animate-pulse" />
                          )}
                        </div>

                        {item.description && (
                          <p className="text-sm text-white/60 mb-3 line-clamp-2">
                            {item.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary-500/30 flex items-center justify-center overflow-hidden">
                              {item.assigneeName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs text-white/50">{item.assigneeName}</span>
                          </div>

                          <div className={cn('flex items-center gap-1 text-xs', getDueDateStyle(item.dueDate))}>
                            {isPast(new Date(item.dueDate)) && !isToday(new Date(item.dueDate)) ? (
                              <AlertCircle className="w-3 h-3" />
                            ) : (
                              <Calendar className="w-3 h-3" />
                            )}
                            <span>{format(new Date(item.dueDate), 'MM/dd', { locale: zhCN })}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {items.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-white/30">
                  <Clock className="w-8 h-8 mb-2" />
                  <p className="text-sm">暂无{STATUS_CONFIG[status].label}项</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold font-display">添加行动项</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">标题</label>
                <div className="input-glow">
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="输入行动项标题"
                    className={cn('input-field', formErrors.title && 'border-red-500/50')}
                  />
                </div>
                {formErrors.title && (
                  <p className="text-xs text-red-400 mt-1">{formErrors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">描述</label>
                <div className="input-glow">
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="输入行动项描述（可选）"
                    rows={3}
                    className="input-field resize-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">负责人</label>
                <div className="input-glow">
                  <select
                    value={formData.assigneeId}
                    onChange={(e) => setFormData(prev => ({ ...prev, assigneeId: e.target.value }))}
                    className={cn('input-field appearance-none cursor-pointer', formErrors.assigneeId && 'border-red-500/50')}
                  >
                    <option value="">选择负责人</option>
                    {members.map(member => (
                      <option key={member.id} value={member.id} className="bg-dark-500">
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
                {formErrors.assigneeId && (
                  <p className="text-xs text-red-400 mt-1">{formErrors.assigneeId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1.5">截止日期</label>
                <div className="input-glow">
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    className={cn('input-field', formErrors.dueDate && 'border-red-500/50')}
                  />
                </div>
                {formErrors.dueDate && (
                  <p className="text-xs text-red-400 mt-1">{formErrors.dueDate}</p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary flex-1"
                >
                  取消
                </button>
                <button type="submit" className="btn-primary flex-1">
                  添加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ActionBoard;
