import React, { useEffect, useState, useRef } from 'react';
import type { KanbanCard, Priority } from './types';
import { formatTimeAgo } from './websocket';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (card: KanbanCard) => void;
  card: KanbanCard | null;
  defaultStatus?: string;
}

const PRIORITY_OPTIONS: { value: Priority; label: string; color: string; bg: string }[] = [
  { value: 'high', label: '高', color: 'text-red-700', bg: 'bg-red-50 border-red-300 hover:bg-red-100' },
  { value: 'medium', label: '中', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-300 hover:bg-amber-100' },
  { value: 'low', label: '低', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100' }
];

const priorityRingClass = (p: Priority, selected: boolean): string => {
  const base = selected ? 'ring-2 ring-offset-2' : '';
  if (p === 'high') return selected ? `${base} ring-red-500` : '';
  if (p === 'medium') return selected ? `${base} ring-amber-500` : '';
  return selected ? `${base} ring-emerald-500` : '';
};

const leftBarClass = (p: Priority): string => {
  if (p === 'high') return 'bg-high-priority';
  if (p === 'medium') return 'bg-medium-priority';
  return 'bg-low-priority';
};

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onSave, card, defaultStatus }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const titleRef = useRef<HTMLInputElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (card) {
        setTitle(card.title);
        setDescription(card.description);
        setAssignee(card.assignee);
        setPriority(card.priority);
        setDueDate(card.dueDate);
      } else {
        setTitle('');
        setDescription('');
        setAssignee('');
        setPriority('medium');
        setDueDate('');
      }
      setTimeout(() => titleRef.current?.focus(), 50);
    }
  }, [isOpen, card]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleKeySubmit(e);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, title, description, assignee, priority, dueDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const newCard: KanbanCard = {
      id: card?.id ?? '',
      title: title.trim(),
      description: description.trim(),
      assignee: assignee.trim(),
      priority,
      dueDate,
      status: card?.status ?? defaultStatus ?? 'todo',
      lastEditor: card?.lastEditor ?? '',
      lastEditorAvatar: card?.lastEditorAvatar ?? '',
      lastEditTime: Date.now()
    };
    onSave(newCard);
  };

  const handleKeySubmit = (e: React.KeyboardEvent | KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const isOverdue = dueDate && new Date(dueDate) < new Date(new Date().toDateString());

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-card shadow-2xl overflow-hidden transform transition-all duration-200 animate-elastic-bounce"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${leftBarClass(priority)}`} />

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <h2 className="text-lg font-semibold text-gray-800 pl-2">
            {card ? '编辑任务卡片' : '新建任务卡片'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 pl-7 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">标题 <span className="text-red-500">*</span></label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入任务标题"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请输入任务描述"
              rows={3}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none placeholder:text-gray-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">负责人</label>
              <input
                type="text"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="负责人姓名"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">截止日期</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
              />
              {isOverdue && (
                <p className="text-xs text-red-500 mt-1">已超期</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">优先级</label>
            <div className="grid grid-cols-3 gap-3">
              {PRIORITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPriority(opt.value)}
                  className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-all duration-150 ${opt.bg} ${opt.color} ${priorityRingClass(
                    opt.value,
                    priority === opt.value
                  )}`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                      opt.value === 'high' ? 'bg-red-500' : opt.value === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                    {opt.label}优先级
                  </span>
                </button>
              ))}
            </div>
          </div>

          {card && card.lastEditTime > 0 && (
            <div className="flex items-center gap-2 py-2 px-3 bg-gray-50 rounded-lg">
              <img
                src={card.lastEditorAvatar}
                alt={card.lastEditor}
                className="w-6 h-6 rounded-full border border-white shadow-sm"
              />
              <span className="text-xs text-gray-500">
                {card.lastEditor} 于 {formatTimeAgo(card.lastEditTime)} 编辑
              </span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-50 -mx-6 -mb-6 px-6 py-4 bg-gray-50/50">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-800 transition-all"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
            >
              {card ? '保存修改' : '创建卡片'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Modal;
