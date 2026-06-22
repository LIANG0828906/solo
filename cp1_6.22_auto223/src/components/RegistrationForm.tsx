import { useState } from 'react';
import { X, Ticket } from 'lucide-react';
import type { RegisterRequest } from '@/types';

interface RegistrationFormProps {
  onSubmit: (data: RegisterRequest) => void;
  onClose: () => void;
  loading: boolean;
  initialInviteCode?: string;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  onSubmit,
  onClose,
  loading,
  initialInviteCode = '',
}) => {
  const [formData, setFormData] = useState<RegisterRequest>({
    inviteCode: initialInviteCode,
    name: '',
    email: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof RegisterRequest, string>>>({});

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof RegisterRequest, string>> = {};
    
    if (!formData.inviteCode.trim()) newErrors.inviteCode = '请输入邀请码';
    if (!formData.name.trim()) newErrors.name = '请输入您的姓名';
    if (!formData.email.trim()) newErrors.email = '请输入您的邮箱';
    else if (!validateEmail(formData.email)) newErrors.email = '请输入有效的邮箱地址';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        ...formData,
        inviteCode: formData.inviteCode.toUpperCase(),
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <Ticket size={24} style={{ display: 'inline', marginRight: 8 }} />
            活动报名
          </h2>
          <button className="modal-close" onClick={onClose} aria-label="关闭">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">邀请码</label>
            <input
              type="text"
              name="inviteCode"
              className="form-input"
              value={formData.inviteCode}
              onChange={handleChange}
              placeholder="请输入活动邀请码"
              style={{ fontFamily: 'monospace', textTransform: 'uppercase' }}
            />
            {errors.inviteCode && <span className="form-error">{errors.inviteCode}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">姓名</label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              placeholder="请输入您的姓名"
            />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">邮箱</label>
            <input
              type="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              placeholder="请输入您的邮箱"
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="loading-spinner" style={{ width: 16, height: 16 }} /> : '立即报名'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
