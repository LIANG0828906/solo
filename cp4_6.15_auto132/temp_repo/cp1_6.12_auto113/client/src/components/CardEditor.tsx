import { useState, useEffect, useRef } from 'react';
import { Card, CreateCardInput } from '../../../shared/types';
import './CardEditor.css';

interface CardEditorProps {
  userId: string;
  onCardCreated: (card: Card, ownerId: string) => void;
}

const CardEditor = ({ userId, onCardCreated }: CardEditorProps) => {
  const [formData, setFormData] = useState<CreateCardInput>({
    name: '',
    position: '',
    company: '',
    email: '',
    phone: '',
    bio: '',
    avatarUrl: ''
  });
  const [previewVisible, setPreviewVisible] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const previewTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }
    setPreviewVisible(false);
    previewTimeoutRef.current = setTimeout(() => {
      setPreviewVisible(true);
    }, 50);

    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
  }, [formData]);

  const handleChange = (field: keyof CreateCardInput, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = '请输入姓名';
    if (!formData.email.trim()) newErrors.email = '请输入邮箱';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '邮箱格式不正确';
    }
    if (formData.bio.length > 200) {
      newErrors.bio = '简介不能超过200字';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        onCardCreated(data.card, data.ownerId);
      }
    } catch (error) {
      console.error('Failed to create card:', error);
    }
  };

  return (
    <div className="card-editor-page">
      <h1 className="page-title">创建我的名片</h1>
      
      <div className="editor-grid">
        <div className="form-section">
          <form onSubmit={handleSubmit} className="card-form">
            <div className="form-row">
              <div className="form-group">
                <label>姓名 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="请输入姓名"
                  className={errors.name ? 'error' : ''}
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label>职位</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => handleChange('position', e.target.value)}
                  placeholder="请输入职位"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>公司</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleChange('company', e.target.value)}
                  placeholder="请输入公司名称"
                />
              </div>

              <div className="form-group">
                <label>邮箱 *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="请输入邮箱"
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>电话</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="请输入电话号码"
                />
              </div>

              <div className="form-group">
                <label>头像URL</label>
                <input
                  type="url"
                  value={formData.avatarUrl}
                  onChange={(e) => handleChange('avatarUrl', e.target.value)}
                  placeholder="请输入头像图片链接"
                />
              </div>
            </div>

            <div className="form-group">
              <label>个人简介 <span className="char-count">({formData.bio.length}/200)</span></label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                placeholder="简单介绍一下自己（最多200字）"
                rows={4}
                maxLength={200}
                className={errors.bio ? 'error' : ''}
              />
              {errors.bio && <span className="error-text">{errors.bio}</span>}
            </div>

            <button type="submit" className="submit-btn">
              创建名片
            </button>
          </form>
        </div>

        <div className="preview-section">
          <h3 className="preview-title">实时预览</h3>
          <div
            className={`preview-card ${previewVisible ? 'fade-in' : ''}`}
          >
            <div className="card-avatar-wrapper">
              {formData.avatarUrl ? (
                <img
                  src={formData.avatarUrl}
                  alt="头像"
                  className="card-avatar"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'User')}&background=1a237e&color=fff&size=120`;
                  }}
                />
              ) : (
                <div className="card-avatar-placeholder">
                  {formData.name ? formData.name.charAt(0).toUpperCase() : '?'}
                </div>
              )}
            </div>
            <h2 className="card-name">{formData.name || '您的姓名'}</h2>
            <p className="card-position">{formData.position || '职位'}</p>
            <p className="card-company">{formData.company || '公司名称'}</p>
            <div className="card-divider" />
            <div className="card-contact">
              {formData.email && (
                <p className="contact-item">📧 {formData.email}</p>
              )}
              {formData.phone && (
                <p className="contact-item">📱 {formData.phone}</p>
              )}
            </div>
            {formData.bio && (
              <p className="card-bio">{formData.bio}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardEditor;
