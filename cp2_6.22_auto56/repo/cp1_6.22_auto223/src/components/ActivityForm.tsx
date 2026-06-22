import { useState } from 'react';
import { X } from 'lucide-react';
import type { CreateActivityRequest } from '@/types';

interface ActivityFormProps {
  onSubmit: (data: CreateActivityRequest) => void;
  onClose: () => void;
  loading: boolean;
}

export const ActivityForm: React.FC<ActivityFormProps> = ({ onSubmit, onClose, loading }) => {
  const [formData, setFormData] = useState<CreateActivityRequest>({
    name: '',
    date: '',
    location: '',
    description: '',
    quota: 20,
    registrationDeadline: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CreateActivityRequest, string>>>({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CreateActivityRequest, string>> = {};
    
    if (!formData.name.trim()) newErrors.name = '请输入活动名称';
    if (!formData.date) newErrors.date = '请选择活动日期';
    if (!formData.location.trim()) newErrors.location = '请输入活动地点';
    if (!formData.description.trim()) newErrors.description = '请输入活动简介';
    if (formData.quota < 1) newErrors.quota = '名额至少为1人';
    if (!formData.registrationDeadline) newErrors.registrationDeadline = '请选择报名截止时间';
    
    if (formData.date && formData.registrationDeadline) {
      if (new Date(formData.registrationDeadline) >= new Date(formData.date)) {
        newErrors.registrationDeadline = '报名截止时间必须早于活动时间';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quota' ? parseInt(value) || 0 : value,
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">创建新活动</h2>
          <button className="modal-close" onClick={onClose} aria-label="关闭">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">活动名称</label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              placeholder="请输入活动名称"
            />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">活动时间</label>
            <input
              type="datetime-local"
              name="date"
              className="form-input"
              value={formData.date}
              onChange={handleChange}
            />
            {errors.date && <span className="form-error">{errors.date}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">活动地点</label>
            <input
              type="text"
              name="location"
              className="form-input"
              value={formData.location}
              onChange={handleChange}
              placeholder="请输入活动地点"
            />
            {errors.location && <span className="form-error">{errors.location}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">名额上限</label>
            <input
              type="number"
              name="quota"
              className="form-input"
              value={formData.quota}
              onChange={handleChange}
              min="1"
              max="100"
            />
            {errors.quota && <span className="form-error">{errors.quota}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">报名截止时间</label>
            <input
              type="datetime-local"
              name="registrationDeadline"
              className="form-input"
              value={formData.registrationDeadline}
              onChange={handleChange}
            />
            {errors.registrationDeadline && (
              <span className="form-error">{errors.registrationDeadline}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">活动简介</label>
            <textarea
              name="description"
              className="form-textarea"
              value={formData.description}
              onChange={handleChange}
              placeholder="请输入活动简介"
              rows={4}
            />
            {errors.description && <span className="form-error">{errors.description}</span>}
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="loading-spinner" style={{ width: 16, height: 16 }} /> : '创建活动'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
