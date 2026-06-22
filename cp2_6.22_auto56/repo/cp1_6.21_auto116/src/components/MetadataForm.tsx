import React, { useState } from 'react';
import { addMetadata } from '../api';
import type { MaterialMeta } from '../types';

interface MetadataFormProps {
  onSuccess: () => void;
}

interface FormData {
  title: string;
  scene: string;
  actor: string;
  lighting: string;
  duration: string;
  thumbnailUrl: string;
}

interface FormErrors {
  title?: string;
  duration?: string;
  thumbnail?: string;
}

const MetadataForm: React.FC<MetadataFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    scene: '',
    actor: '',
    lighting: '',
    duration: '',
    thumbnailUrl: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const validateField = (name: keyof FormData, value: string): string | undefined => {
    if (name === 'title') {
      if (!value.trim()) return '标题必填';
      if (value.length > 50) return '标题不能超过50字';
    }
    if (name === 'duration') {
      if (!value) return '时长必填';
      const num = parseFloat(value);
      if (isNaN(num) || num <= 0) return '时长必须为正数';
    }
    return undefined;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    const error = validateField(name as keyof FormData, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      setErrors(prev => ({ ...prev, thumbnail: '缩略图大小不能超过500KB' }));
      return;
    }
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, thumbnail: '请上传图片文件' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({ ...prev, thumbnailUrl: reader.result as string }));
      setErrors(prev => ({ ...prev, thumbnail: undefined }));
    };
    reader.readAsDataURL(file);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    const titleError = validateField('title', formData.title);
    if (titleError) newErrors.title = titleError;
    const durationError = validateField('duration', formData.duration);
    if (durationError) newErrors.duration = durationError;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload: Omit<MaterialMeta, 'id' | 'createTime'> = {
        title: formData.title.trim(),
        scene: formData.scene.trim(),
        actor: formData.actor.trim(),
        lighting: formData.lighting.trim(),
        thumbnailUrl: formData.thumbnailUrl,
        duration: parseFloat(formData.duration)
      };
      await addMetadata(payload);
      setFormData({
        title: '',
        scene: '',
        actor: '',
        lighting: '',
        duration: '',
        thumbnailUrl: ''
      });
      setErrors({});
      onSuccess();
    } catch (err) {
      console.error('提交失败:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      title: '',
      scene: '',
      actor: '',
      lighting: '',
      duration: '',
      thumbnailUrl: ''
    });
    setErrors({});
  };

  return (
    <form className="form-section" onSubmit={handleSubmit}>
      <div className="form-title">上传素材元数据</div>
      <div className="form-grid">
        <div className="form-item">
          <label>标题 *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="输入镜头标题（最多50字）"
            maxLength={100}
          />
          {errors.title && <span className="error-text">{errors.title}</span>}
        </div>
        <div className="form-item">
          <label>场景名</label>
          <input
            type="text"
            name="scene"
            value={formData.scene}
            onChange={handleChange}
            placeholder="如：办公室、街道夜景"
          />
        </div>
        <div className="form-item">
          <label>演员</label>
          <input
            type="text"
            name="actor"
            value={formData.actor}
            onChange={handleChange}
            placeholder="主要演员姓名"
          />
        </div>
        <div className="form-item">
          <label>灯光设置</label>
          <input
            type="text"
            name="lighting"
            value={formData.lighting}
            onChange={handleChange}
            placeholder="如：自然光、三点布光"
          />
        </div>
        <div className="form-item">
          <label>时长（秒）*</label>
          <input
            type="number"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            placeholder="输入正数值"
            min="0"
            step="0.1"
          />
          {errors.duration && <span className="error-text">{errors.duration}</span>}
        </div>
        <div className="form-item">
          <label>缩略图（可选，≤500KB）</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />
          {formData.thumbnailUrl && (
            <img
              src={formData.thumbnailUrl}
              alt="预览"
              style={{ width: 160, height: 90, objectFit: 'cover', borderRadius: 4, marginTop: 4 }}
            />
          )}
          {errors.thumbnail && <span className="error-text">{errors.thumbnail}</span>}
        </div>
      </div>
      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={handleReset}>重置</button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? '提交中...' : '提交'}
        </button>
      </div>
    </form>
  );
};

export default MetadataForm;
