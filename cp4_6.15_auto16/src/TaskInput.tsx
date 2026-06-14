import React, { useState, useEffect, useCallback } from 'react';
import { useKanbanStore, TEAM_MEMBERS } from './store';
import type { Priority } from './types';
import { X } from 'lucide-react';
import dayjs from 'dayjs';

const TaskInput = React.memo(function TaskInput() {
  const modalState = useKanbanStore((s) => s.modalState);
  const closeModal = useKanbanStore((s) => s.closeModal);
  const addTask = useKanbanStore((s) => s.addTask);
  const updateTask = useKanbanStore((s) => s.updateTask);
  const tasks = useKanbanStore((s) => s.tasks);

  const editingTask = modalState.taskId ? tasks.find((t) => t.id === modalState.taskId) : null;

  const [name, setName] = useState('');
  const [assignee, setAssignee] = useState(TEAM_MEMBERS[0].name);
  const [startDate, setStartDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().add(7, 'day').format('YYYY-MM-DD'));
  const [priority, setPriority] = useState<Priority>('medium');
  const [progress, setProgress] = useState(0);
  const [nameError, setNameError] = useState('');
  const [dateError, setDateError] = useState('');
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);

  useEffect(() => {
    if (modalState.open && editingTask) {
      setName(editingTask.name);
      setAssignee(editingTask.assignee);
      setStartDate(editingTask.startDate);
      setEndDate(editingTask.endDate);
      setPriority(editingTask.priority);
      setProgress(editingTask.progress);
      setNameError('');
      setDateError('');
    } else if (modalState.open) {
      setName('');
      setAssignee(TEAM_MEMBERS[0].name);
      setStartDate(dayjs().format('YYYY-MM-DD'));
      setEndDate(dayjs().add(7, 'day').format('YYYY-MM-DD'));
      setPriority('medium');
      setProgress(0);
      setNameError('');
      setDateError('');
    }
  }, [modalState.open, editingTask]);

  const validate = useCallback((): boolean => {
    let valid = true;
    if (!name.trim()) {
      setNameError('任务名称不能为空');
      valid = false;
    } else if (name.length > 50) {
      setNameError('任务名称不能超过50字');
      valid = false;
    } else {
      setNameError('');
    }

    if (dayjs(endDate).isBefore(dayjs(startDate), 'day')) {
      setDateError('结束日期不能早于开始日期');
      valid = false;
    } else {
      setDateError('');
    }
    return valid;
  }, [name, startDate, endDate]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (modalState.mode === 'edit' && editingTask) {
      updateTask(editingTask.id, {
        name: name.trim(),
        assignee,
        startDate,
        endDate,
        priority,
        progress,
      });
    } else {
      addTask({
        name: name.trim(),
        assignee,
        startDate,
        endDate,
        priority,
        progress,
      });
    }
    closeModal();
  }, [name, assignee, startDate, endDate, priority, progress, modalState.mode, editingTask, validate, updateTask, addTask, closeModal]);

  if (!modalState.open) return null;

  const filteredMembers = TEAM_MEMBERS.filter((m) =>
    m.name.toLowerCase().includes(assigneeSearch.toLowerCase())
  );

  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={closeModal}>
      <div className="modal-content bg-kanban-card border border-kanban-border rounded-xl shadow-2xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-kanban-border">
          <h3 className="text-sm font-semibold text-kanban-text">
            {modalState.mode === 'edit' ? '编辑任务' : '新建任务'}
          </h3>
          <button onClick={closeModal} className="text-kanban-text-muted hover:text-kanban-text transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-kanban-text-muted mb-1.5">任务名称 <span className="text-kanban-high">*</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError(''); }}
              maxLength={50}
              placeholder="请输入任务名称（最多50字）"
              className="w-full bg-kanban-bg border border-kanban-border rounded-lg px-3 py-2 text-sm text-kanban-text placeholder:text-kanban-text-muted outline-none focus:border-kanban-accent transition-colors"
            />
            <div className="flex items-center justify-between mt-1">
              {nameError && <span className="text-[10px] text-kanban-high">{nameError}</span>}
              <span className="text-[10px] text-kanban-text-muted ml-auto">{name.length}/50</span>
            </div>
          </div>

          <div>
            <label className="block text-xs text-kanban-text-muted mb-1.5">负责人</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setAssigneeDropdownOpen(!assigneeDropdownOpen)}
                className="w-full bg-kanban-bg border border-kanban-border rounded-lg px-3 py-2 text-sm text-kanban-text text-left flex items-center justify-between hover:border-kanban-accent/50 transition-colors"
              >
                {assignee}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-kanban-text-muted"><path d="M6 9l6 6 6-6" /></svg>
              </button>
              {assigneeDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => { setAssigneeDropdownOpen(false); setAssigneeSearch(''); }} />
                  <div className="absolute top-full left-0 mt-1 w-full bg-kanban-card border border-kanban-border rounded-lg shadow-2xl z-50 animate-fade-in">
                    <div className="p-2 border-b border-kanban-border">
                      <input
                        type="text"
                        placeholder="搜索成员..."
                        value={assigneeSearch}
                        onChange={(e) => setAssigneeSearch(e.target.value)}
                        className="w-full bg-kanban-bg border border-kanban-border rounded px-2 py-1 text-xs text-kanban-text placeholder:text-kanban-text-muted outline-none focus:border-kanban-accent"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-40 overflow-y-auto p-1">
                      {filteredMembers.map((member) => (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => { setAssignee(member.name); setAssigneeDropdownOpen(false); setAssigneeSearch(''); }}
                          className={`w-full text-left px-2 py-1.5 rounded text-xs hover:bg-kanban-bg transition-colors ${assignee === member.name ? 'text-kanban-accent font-medium' : 'text-kanban-text'}`}
                        >
                          {member.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-kanban-text-muted mb-1.5">开始日期</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setDateError(''); }}
                className="w-full bg-kanban-bg border border-kanban-border rounded-lg px-3 py-2 text-sm text-kanban-text outline-none focus:border-kanban-accent transition-colors [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-xs text-kanban-text-muted mb-1.5">结束日期</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setDateError(''); }}
                min={startDate}
                className="w-full bg-kanban-bg border border-kanban-border rounded-lg px-3 py-2 text-sm text-kanban-text outline-none focus:border-kanban-accent transition-colors [color-scheme:dark]"
              />
            </div>
          </div>
          {dateError && <span className="text-[10px] text-kanban-high -mt-2">{dateError}</span>}

          <div>
            <label className="block text-xs text-kanban-text-muted mb-2">优先级</label>
            <div className="flex gap-2">
              {(['high', 'medium', 'low'] as Priority[]).map((p) => (
                <label
                  key={p}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border cursor-pointer transition-all duration-200 text-xs ${
                    priority === p
                      ? p === 'high' ? 'border-kanban-high bg-kanban-high/10 text-kanban-high'
                        : p === 'medium' ? 'border-kanban-medium bg-kanban-medium/10 text-kanban-medium'
                          : 'border-kanban-low bg-kanban-low/10 text-kanban-low'
                      : 'border-kanban-border text-kanban-text-muted hover:border-kanban-text-muted'
                  }`}
                >
                  <input
                    type="radio"
                    name="priority"
                    value={p}
                    checked={priority === p}
                    onChange={() => setPriority(p)}
                    className="sr-only"
                  />
                  <span className={`w-2 h-2 rounded-full ${p === 'high' ? 'bg-kanban-high' : p === 'medium' ? 'bg-kanban-medium' : 'bg-kanban-low'}`} />
                  {p === 'high' ? '高' : p === 'medium' ? '中' : '低'}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-kanban-text-muted mb-2">
              进度 <span className="text-kanban-accent font-medium">{progress}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full h-1.5 bg-kanban-bg rounded-full appearance-none cursor-pointer accent-kanban-accent"
            />
            <div className="flex justify-between text-[10px] text-kanban-text-muted mt-0.5">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="flex-1 px-4 py-2 bg-kanban-bg border border-kanban-border rounded-lg text-sm text-kanban-text-muted hover:text-kanban-text btn-hover"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-kanban-accent text-white rounded-lg text-sm font-medium btn-hover hover:bg-kanban-accent/90"
            >
              {modalState.mode === 'edit' ? '保存修改' : '创建任务'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default TaskInput;
