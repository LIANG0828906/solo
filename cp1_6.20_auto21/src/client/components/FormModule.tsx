import React, { useState, useCallback, useRef } from 'react';
import { FormData } from '../types';
import { compressImage } from '../utils/imageCompression';
import './FormModule.css';

interface FormModuleProps {
  onSubmit: (data: FormData) => void;
  isSubmitting: boolean;
}

interface FormErrors {
  title?: string;
  description?: string;
  priority?: string;
}

export default function FormModule({ onSubmit, isSubmitting }: FormModuleProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [images, setImages] = useState<string[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    
    if (!title.trim()) {
      newErrors.title = '请输入报修标题';
    } else if (title.length < 5) {
      newErrors.title = '标题至少5个字符';
    }
    
    if (!description.trim()) {
      newErrors.description = '请输入详细描述';
    } else if (description.length < 10) {
      newErrors.description = '描述至少10个字符';
    }
    
    if (!priority) {
      newErrors.priority = '请选择优先级';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title, description, priority]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({ title, description, priority, images });
    }
  }, [validate, title, description, priority, images, onSubmit]);

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files) return;
    
    const remainingSlots = 3 - images.length;
    if (remainingSlots <= 0) {
      return;
    }
    
    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    
    try {
      const compressedImages = await Promise.all(
        filesToProcess.map(file => compressImage(file))
      );
      
      setImages(prev => [...prev, ...compressedImages]);
    } catch (error) {
      console.error('图片处理失败:', error);
    }
  }, [images.length]);

  const handleRemoveImage = useCallback((index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  return (
    <form className="repair-form" onSubmit={handleSubmit}>
      <div className="form-columns">
        <div className="form-left">
          <div className="form-group">
            <label htmlFor="title">报修标题 *</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请简要描述问题"
              className={errors.title ? 'error' : ''}
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description">详细描述 *</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请详细描述故障情况、位置等信息"
              rows={8}
              className={errors.description ? 'error' : ''}
            />
            {errors.description && <span className="error-message">{errors.description}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="priority">优先级 *</label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'high' | 'medium' | 'low')}
              className={errors.priority ? 'error' : ''}
            >
              <option value="high">高优先级 - 紧急故障</option>
              <option value="medium">中优先级 - 一般故障</option>
              <option value="low">低优先级 - 轻微问题</option>
            </select>
            {errors.priority && <span className="error-message">{errors.priority}</span>}
          </div>
        </div>

        <div className="form-right">
          <div className="form-group">
            <label>图片附件（最多3张）</label>
            <div
              className={`upload-area ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => handleFileSelect(e.target.files)}
              />
              <div className="upload-icon">📷</div>
              <p className="upload-text">点击或拖拽上传图片</p>
              <p className="upload-hint">支持 JPG、PNG 格式，单图不超过1MB</p>
            </div>

            <div className="image-preview-list">
              {images.map((img, index) => (
                <div key={index} className="image-preview-item">
                  <img src={img} alt={`预览 ${index + 1}`} />
                  <button
                    type="button"
                    className="remove-image"
                    onClick={() => handleRemoveImage(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="submit-btn" disabled={isSubmitting}>
          {isSubmitting ? '提交中...' : '提交报修'}
        </button>
      </div>
    </form>
  );
}
