import { useState, useCallback } from 'react';

interface CreateExhibitionModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function CreateExhibitionModal({ onClose, onSuccess }: CreateExhibitionModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '请输入展览名称';
    }
    if (!formData.startDate) {
      newErrors.startDate = '请选择开始日期';
    }
    if (!formData.endDate) {
      newErrors.endDate = '请选择结束日期';
    }
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = '结束日期不能早于开始日期';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/exhibitions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json();
        setErrors({ submit: data.error || '创建失败' });
      }
    } catch (error) {
      setErrors({ submit: '网络错误，请稍后重试' });
    } finally {
      setSubmitting(false);
    }
  }, [formData, validate, onSuccess]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>创建新展览</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">展览名称 *</label>
            <input
              id="name"
              name="name"
              type="text"
              className={`form-input ${errors.name ? 'error' : ''}`}
              value={formData.name}
              onChange={handleChange}
              placeholder="请输入展览名称"
            />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description">展览描述</label>
            <textarea
              id="description"
              name="description"
              className="form-input form-textarea"
              value={formData.description}
              onChange={handleChange}
              placeholder="请输入展览描述"
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">开始日期 *</label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                className={`form-input ${errors.startDate ? 'error' : ''}`}
                value={formData.startDate}
                onChange={handleChange}
              />
              {errors.startDate && <span className="form-error">{errors.startDate}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="endDate">结束日期 *</label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                className={`form-input ${errors.endDate ? 'error' : ''}`}
                value={formData.endDate}
                onChange={handleChange}
              />
              {errors.endDate && <span className="form-error">{errors.endDate}</span>}
            </div>
          </div>

          {errors.submit && (
            <div className="form-error form-error-center">{errors.submit}</div>
          )}

          <button
            type="submit"
            className="btn-submit"
            disabled={submitting}
          >
            {submitting ? '创建中...' : '创建展览'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateExhibitionModal;
