import React, { useState, useRef, useEffect } from 'react';
import type { Schedule } from '../types';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Schedule>) => void;
  initialData?: Schedule | null;
  defaultDate?: string;
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  defaultDate
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title);
        setDate(initialData.date);
        setStartTime(initialData.startTime);
        setEndTime(initialData.endTime);
        setPriority(initialData.priority);
        if (editorRef.current) {
          editorRef.current.innerHTML = initialData.notes || '';
        }
      } else {
        setTitle('');
        setDate(defaultDate || '');
        setStartTime('09:00');
        setEndTime('10:00');
        setPriority('medium');
        if (editorRef.current) {
          editorRef.current.innerHTML = '';
        }
      }
      setActiveFormats(new Set());
    }
  }, [isOpen, initialData, defaultDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('请输入日程标题');
      return;
    }

    const duration = calculateDuration();

    onSave({
      title: title.trim(),
      date,
      startTime,
      endTime,
      notes: editorRef.current?.innerHTML || '',
      priority,
      duration
    });
    onClose();
  };

  const calculateDuration = () => {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    return (eh * 60 + em) - (sh * 60 + sm);
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateActiveFormats();
  };

  const updateActiveFormats = () => {
    const formats = new Set<string>();
    if (document.queryCommandState('bold')) formats.add('bold');
    if (document.queryCommandState('italic')) formats.add('italic');
    if (document.queryCommandState('insertUnorderedList')) formats.add('insertUnorderedList');
    setActiveFormats(formats);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{initialData ? '编辑日程' : '新建日程'}</h3>
        <form className="modal-form" onSubmit={handleSubmit}>
          <label>
            标题
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入日程标题"
              autoFocus
            />
          </label>
          <label>
            日期
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <label style={{ flex: 1 }}>
              开始时间
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </label>
            <label style={{ flex: 1 }}>
              结束时间
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </label>
          </div>
          <label>
            优先级
            <div className="priority-selector">
              <div
                className={`priority-option low ${priority === 'low' ? 'selected' : ''}`}
                onClick={() => setPriority('low')}
              >
                低
              </div>
              <div
                className={`priority-option medium ${priority === 'medium' ? 'selected' : ''}`}
                onClick={() => setPriority('medium')}
              >
                中
              </div>
              <div
                className={`priority-option high ${priority === 'high' ? 'selected' : ''}`}
                onClick={() => setPriority('high')}
              >
                高
              </div>
            </div>
          </label>
          <label>
            备注
            <div className="rich-toolbar">
              <button
                type="button"
                className={activeFormats.has('bold') ? 'active' : ''}
                onClick={() => execCommand('bold')}
                title="加粗"
              >
                <strong>B</strong>
              </button>
              <button
                type="button"
                className={activeFormats.has('italic') ? 'active' : ''}
                onClick={() => execCommand('italic')}
                title="斜体"
              >
                <em>I</em>
              </button>
              <button
                type="button"
                className={activeFormats.has('insertUnorderedList') ? 'active' : ''}
                onClick={() => execCommand('insertUnorderedList')}
                title="无序列表"
              >
                • 列表
              </button>
            </div>
            <div
              ref={editorRef}
              className="rich-editor"
              contentEditable
              onInput={updateActiveFormats}
              onSelect={updateActiveFormats}
            />
          </label>
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn-primary">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleModal;
