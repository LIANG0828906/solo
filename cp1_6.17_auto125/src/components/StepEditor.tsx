import React, { useState, useRef } from 'react';
import { useProjectStore } from '../store/projectStore';
import { compressImage } from '../utils';
import type { Step } from '../types';

interface StepEditorProps {
  projectId: string;
}

interface StepFormState {
  title: string;
  duration: number;
  notes: string;
  images: string[];
  quality: number;
}

interface FormErrors {
  title?: string;
  duration?: string;
  notes?: string;
  images?: string;
}

export const StepEditor: React.FC<StepEditorProps> = ({ projectId }) => {
  const { getProjectById, updateStep, deleteStep, addStep, reorderSteps } = useProjectStore();
  const project = getProjectById(projectId);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [dragActiveFor, setDragActiveFor] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, FormErrors>>({});

  if (!project) {
    return <div className="empty-state">项目不存在</div>;
  }

  const handleAddStep = () => {
    addStep(projectId, {
      title: '新步骤',
      duration: 10,
      notes: '',
      images: [],
      quality: 3
    });
  };

  const handleUpdateField = (stepId: string, field: keyof StepFormState, value: string | number | string[]) => {
    const step = project.steps.find(s => s.id === stepId);
    if (!step) return;

    if (field === 'duration') {
      const num = Number(value);
      if (isNaN(num) || num < 1) {
        setErrors(prev => ({
          ...prev,
          [stepId]: { ...prev[stepId], duration: '耗时必须大于等于1分钟' }
        }));
      } else {
        setErrors(prev => {
          const next = { ...prev };
          if (next[stepId]) delete next[stepId].duration;
          return next;
        });
      }
    }

    if (field === 'title' && typeof value === 'string' && !value.trim()) {
      setErrors(prev => ({
        ...prev,
        [stepId]: { ...prev[stepId], title: '步骤标题不能为空' }
      }));
    } else if (field === 'title') {
      setErrors(prev => {
        const next = { ...prev };
        if (next[stepId]) delete next[stepId].title;
        return next;
      });
    }

    if (field === 'notes' && typeof value === 'string' && value.length > 500) {
      setErrors(prev => ({
        ...prev,
        [stepId]: { ...prev[stepId], notes: '笔记不能超过500字' }
      }));
      return;
    } else if (field === 'notes') {
      setErrors(prev => {
        const next = { ...prev };
        if (next[stepId]) delete next[stepId].notes;
        return next;
      });
    }

    updateStep(projectId, stepId, { [field]: value } as Partial<Step>);
  };

  const handleImageUpload = async (stepId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const step = project.steps.find(s => s.id === stepId);
    if (!step) return;

    const remainingSlots = 3 - step.images.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    try {
      const compressedImages = await Promise.all(
        filesToProcess.map(file => compressImage(file, 800))
      );
      const newImages = [...step.images, ...compressedImages];
      updateStep(projectId, stepId, { images: newImages });
    } catch (err) {
      console.error('图片上传失败:', err);
    }
  };

  const handleDeleteImage = (stepId: string, imageIndex: number) => {
    const step = project.steps.find(s => s.id === stepId);
    if (!step) return;
    const newImages = step.images.filter((_, i) => i !== imageIndex);
    updateStep(projectId, stepId, { images: newImages });
  };

  const handleDeleteStep = (stepId: string) => {
    if (project.steps.length <= 1) {
      alert('至少保留一个步骤');
      return;
    }
    if (confirm('确定要删除这个步骤吗？')) {
      deleteStep(projectId, stepId);
    }
  };

  const handleDragStart = (e: React.DragEvent, stepId: string) => {
    setDraggedId(stepId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, stepId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (stepId !== draggedId) {
      setDragOverId(stepId);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const stepIds = project.steps.map(s => s.id);
    const draggedIndex = stepIds.indexOf(draggedId);
    const targetIndex = stepIds.indexOf(targetId);

    const newOrder = [...stepIds];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedId);

    reorderSteps(projectId, newOrder);
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleAreaDragOver = (e: React.DragEvent, stepId: string) => {
    e.preventDefault();
    setDragActiveFor(stepId);
  };

  const handleAreaDragLeave = (stepId: string) => {
    if (dragActiveFor === stepId) {
      setDragActiveFor(null);
    }
  };

  const handleAreaDrop = (e: React.DragEvent, stepId: string) => {
    e.preventDefault();
    setDragActiveFor(null);
    handleImageUpload(stepId, e.dataTransfer.files);
  };

  return (
    <div>
      {project.steps.map((step, index) => {
        const stepErrors = errors[step.id] || {};
        return (
          <div
            key={step.id}
            className={`step-card ${draggedId === step.id ? 'dragging' : ''} ${dragOverId === step.id ? 'drag-over' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, step.id)}
            onDragOver={(e) => handleDragOver(e, step.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, step.id)}
            onDragEnd={handleDragEnd}
          >
            <div className="step-header">
              <input
                type="text"
                className={`step-title-input ${stepErrors.title ? 'error' : ''}`}
                value={step.title}
                onChange={(e) => handleUpdateField(step.id, 'title', e.target.value)}
                placeholder="步骤标题"
                style={stepErrors.title ? { borderColor: '#e74c3c', borderWidth: '2px' } : {}}
              />
              <div className="step-meta">
                <div className="duration-input">
                  <input
                    type="number"
                    min="1"
                    value={step.duration}
                    onChange={(e) => handleUpdateField(step.id, 'duration', parseInt(e.target.value) || 0)}
                    className={stepErrors.duration ? 'error' : ''}
                  />
                  <span className="duration-label">分钟</span>
                </div>
                <div className="quality-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`star ${star <= step.quality ? 'filled' : ''}`}
                      onClick={() => handleUpdateField(step.id, 'quality', star)}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="drag-handle" title="拖拽排序">⋮⋮</span>
              </div>
            </div>

            {stepErrors.duration && (
              <div className="form-error" style={{ marginTop: '-8px', marginBottom: '12px' }}>
                {stepErrors.duration}
              </div>
            )}

            <div className="step-body">
              <div>
                <textarea
                  className="notes-textarea"
                  value={step.notes}
                  onChange={(e) => handleUpdateField(step.id, 'notes', e.target.value)}
                  placeholder="记录这个步骤的心得体会、工艺要点、需要注意的问题..."
                  maxLength={500}
                />
                <div className="notes-counter">{step.notes.length}/500</div>
                {stepErrors.notes && (
                  <div className="form-error">{stepErrors.notes}</div>
                )}
              </div>

              <div>
                {step.images.length > 0 && (
                  <div className="images-preview" style={{ marginBottom: '12px' }}>
                    {step.images.map((img, imgIdx) => (
                      <div key={imgIdx} className="image-thumbnail">
                        <img src={img} alt={`步骤图片 ${imgIdx + 1}`} />
                        <button
                          className="image-delete"
                          onClick={() => handleDeleteImage(step.id, imgIdx)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {step.images.length < 3 && (
                  <>
                    <div
                      className={`images-upload-area ${dragActiveFor === step.id ? 'drag-active' : ''}`}
                      onClick={() => fileInputRefs.current[step.id]?.click()}
                      onDragOver={(e) => handleAreaDragOver(e, step.id)}
                      onDragLeave={() => handleAreaDragLeave(step.id)}
                      onDrop={(e) => handleAreaDrop(e, step.id)}
                    >
                      <div className="upload-placeholder">
                        <div className="upload-icon">📷</div>
                        <div className="upload-text">
                          {dragActiveFor === step.id ? '松开以上传' : '点击或拖拽上传图片'}
                        </div>
                        <div style={{ fontSize: '12px', marginTop: '4px', color: '#bdc3c7' }}>
                          最多3张 ({step.images.length}/3)
                        </div>
                      </div>
                    </div>
                    <input
                      ref={(el) => { fileInputRefs.current[step.id] = el; }}
                      type="file"
                      accept="image/*"
                      multiple
                      style={{ display: 'none' }}
                      onChange={(e) => handleImageUpload(step.id, e.target.files)}
                    />
                  </>
                )}
              </div>
            </div>

            <div className="step-actions">
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDeleteStep(step.id)}
              >
                删除步骤
              </button>
            </div>
          </div>
        );
      })}

      <button className="add-step-btn" onClick={handleAddStep}>
        + 添加新步骤
      </button>
    </div>
  );
};
