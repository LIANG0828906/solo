import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import type { Step, TimelineFilters, ProjectLog, DifficultyLevel } from '@/types';
import { GripVertical, Plus, X, Image as ImageIcon, Clock, Edit2, Trash2, Search, Calendar } from 'lucide-react';
import { formatDateTime, getDifficultyLabel, getDifficultyColor } from '@/utils/format';
import { validateAndConvertImage } from '@/utils/image';

interface TimelineProps {
  project: ProjectLog;
}

export function Timeline({ project }: TimelineProps) {
  const { addStep, updateStep, deleteStep, reorderSteps } = useProjectStore();
  const [filters, setFilters] = useState<TimelineFilters>({
    dateFrom: '',
    dateTo: '',
    keyword: ''
  });
  const [showForm, setShowForm] = useState(false);
  const [editingStep, setEditingStep] = useState<Step | null>(null);
  const [dragState, setDragState] = useState<{
    dragging: boolean;
    dragIdx: number | null;
    overIdx: number | null;
  }>({ dragging: false, dragIdx: null, overIdx: null });
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    difficulty: DifficultyLevel;
    imageData: string | undefined;
  }>({
    title: '',
    description: '',
    difficulty: 'easy',
    imageData: undefined
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const dragItemRef = useRef<number | null>(null);

  const sortedSteps = useMemo(
    () => [...project.steps].sort((a, b) => a.order - b.order),
    [project.steps]
  );

  const filteredSteps = useMemo(() => {
    const kw = filters.keyword.trim().toLowerCase();
    return sortedSteps.filter((s) => {
      if (filters.dateFrom) {
        const fromTs = new Date(filters.dateFrom).getTime();
        if (s.createdAt < fromTs) return false;
      }
      if (filters.dateTo) {
        const toTs = new Date(filters.dateTo).getTime() + 86400000;
        if (s.createdAt > toTs) return false;
      }
      if (kw) {
        const inTitle = s.title.toLowerCase().includes(kw);
        const inDesc = s.description.toLowerCase().includes(kw);
        if (!inTitle && !inDesc) return false;
      }
      return true;
    });
  }, [sortedSteps, filters]);

  const openNewForm = () => {
    setEditingStep(null);
    setFormData({ title: '', description: '', difficulty: 'easy', imageData: undefined });
    setImageFile(null);
    setError('');
    setShowForm(true);
  };

  const openEditForm = (step: Step) => {
    setEditingStep(step);
    setFormData({
      title: step.title,
      description: step.description,
      difficulty: step.difficulty,
      imageData: step.imageData
    });
    setImageFile(null);
    setError('');
    setShowForm(true);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await validateAndConvertImage(file);
      setFormData((prev) => ({ ...prev, imageData: data }));
      setImageFile(file);
      setError('');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('请填写步骤标题');
      return;
    }
    try {
      if (editingStep) {
        await updateStep(project.id, editingStep.id, formData);
      } else {
        await addStep(project.id, formData);
      }
      setShowForm(false);
    } catch (err) {
      setError('保存失败，请重试');
    }
  };

  const handleDelete = async (stepId: string) => {
    if (confirm('确定删除此步骤？')) {
      await deleteStep(project.id, stepId);
    }
  };

  const handleDragStart = useCallback((idx: number) => (e: React.DragEvent) => {
    dragItemRef.current = idx;
    setDragState({ dragging: true, dragIdx: idx, overIdx: null });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
    const target = e.currentTarget as HTMLElement;
    requestAnimationFrame(() => {
      target.style.opacity = '0.5';
      target.style.transform = 'scale(0.98)';
    });
  }, []);

  const handleDragOver = useCallback((idx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragItemRef.current !== null && dragItemRef.current !== idx) {
      setDragState((prev) => {
        if (prev.overIdx !== idx) {
          return { ...prev, overIdx: idx };
        }
        return prev;
      });
    }
  }, []);

  const handleDragLeave = useCallback(() => {
    // 不立即清除，避免快速移动时闪烁
  }, []);

  const handleDrop = useCallback((toIdx: number) => async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const fromIdx = dragItemRef.current;
    setDragState({ dragging: false, dragIdx: null, overIdx: null });
    if (fromIdx === null || fromIdx === toIdx) {
      dragItemRef.current = null;
      return;
    }
    await reorderSteps(project.id, fromIdx, toIdx);
    dragItemRef.current = null;
  }, [project.id, reorderSteps]);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    dragItemRef.current = null;
    setDragState({ dragging: false, dragIdx: null, overIdx: null });
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '';
    target.style.transform = '';
  }, []);

  return (
    <div className="timeline-container">
      <div className="timeline-header">
        <h2 className="timeline-title">创作时间线</h2>
        <button className="btn-primary" onClick={openNewForm}>
          <Plus size={18} /> 添加步骤
        </button>
      </div>

      <div className="filter-bar">
        <div className="filter-item">
          <Calendar size={16} />
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
          />
          <span style={{ margin: '0 6px', color: '#8B5A2B' }}>至</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
          />
        </div>
        <div className="filter-item search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="搜索步骤标题或说明..."
            value={filters.keyword}
            onChange={(e) => setFilters((f) => ({ ...f, keyword: e.target.value }))}
          />
        </div>
      </div>

      <div className="timeline-list">
        {filteredSteps.length === 0 ? (
          <div className="empty-state">
            <p>暂无创作步骤，点击"添加步骤"开始记录吧</p>
          </div>
        ) : (
          <div className="timeline-vertical">
            {filteredSteps.map((step, idx) => {
              const isDragging = dragState.dragIdx === idx;
              const isOver = dragState.overIdx === idx && dragState.dragIdx !== idx && dragState.dragIdx !== null;
              return (
              <div
                key={step.id}
                className={`timeline-step-wrapper ${isDragging ? 'is-dragging' : ''} ${isOver ? 'is-drag-over' : ''}`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="timeline-node">
                  <span className="node-dot" style={{ backgroundColor: getDifficultyColor(step.difficulty) }} />
                  <div className="timeline-line" />
                </div>
                <div
                  className={`timeline-card ${isDragging ? 'card-dragging' : ''} ${isOver ? 'card-drag-over' : ''}`}
                  draggable
                  onDragStart={handleDragStart(idx)}
                  onDragOver={handleDragOver(idx)}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop(idx)}
                  onDragEnd={handleDragEnd}
                >
                  <div className="step-header">
                    <div className="step-drag-handle" title="拖拽调整顺序">
                      <GripVertical size={16} />
                    </div>
                    <div className="step-title-section">
                      <h3>{step.title}</h3>
                      <div className="step-meta">
                        <Clock size={12} />
                        <span>{formatDateTime(step.createdAt)}</span>
                        <span
                          className="difficulty-tag"
                          style={{
                            backgroundColor: getDifficultyColor(step.difficulty),
                            color: '#fff',
                            padding: '2px 10px',
                            borderRadius: '10px',
                            fontSize: '11px'
                          }}
                        >
                          {getDifficultyLabel(step.difficulty)}
                        </span>
                      </div>
                    </div>
                    <div className="step-actions">
                      <button className="icon-btn" onClick={() => openEditForm(step)}>
                        <Edit2 size={16} />
                      </button>
                      <button className="icon-btn-danger" onClick={() => handleDelete(step.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  {step.imageData && (
                    <div className="step-image">
                      <img src={step.imageData} alt={step.title} loading="lazy" />
                    </div>
                  )}
                  {step.description && (
                    <p className="step-description">{step.description}</p>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingStep ? '编辑步骤' : '添加新步骤'}</h3>
              <button className="icon-btn" onClick={() => setShowForm(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              {error && <div className="error-message">{error}</div>}
              <div className="form-group">
                <label>步骤标题 *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  placeholder="例如：塑形、打磨、上色..."
                />
              </div>
              <div className="form-group">
                <label>文字说明</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  placeholder="记录这个步骤的要点和心得..."
                />
              </div>
              <div className="form-group">
                <label>难度等级</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData((p) => ({ ...p, difficulty: e.target.value as DifficultyLevel }))}
                >
                  <option value="easy">简单</option>
                  <option value="medium">中等</option>
                  <option value="hard">困难</option>
                </select>
              </div>
              <div className="form-group">
                <label>步骤图片 (JPG/PNG，≤5MB)</label>
                <label className="file-upload">
                  <ImageIcon size={18} />
                  <span>{imageFile ? imageFile.name : '选择图片文件'}</span>
                  <input type="file" accept="image/jpeg,image/png,image/jpg" onChange={handleImageChange} />
                </label>
                {formData.imageData && (
                  <div className="image-preview">
                    <img src={formData.imageData} alt="预览" />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                  取消
                </button>
                <button type="submit" className="btn-primary">
                  {editingStep ? '保存修改' : '添加步骤'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
