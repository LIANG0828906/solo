import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormData, FormErrors, HousingType } from '../types';
import { useAppContext } from '../context/AppContext';
import { housingTypeLabels } from '../data/PetData';

interface ApplicationFormProps {
  petId: string;
  petName: string;
}

const ApplicationForm: React.FC<ApplicationFormProps> = ({ petId, petName }) => {
  const navigate = useNavigate();
  const { addApplication } = useAppContext();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    housingType: 'own' as HousingType,
    experience: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const formatPhone = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  };

  useEffect(() => {
    setFormData(prev => ({ ...prev, phone: formatPhone(prev.phone) }));
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = '请输入您的姓名';
    }

    const phoneDigits = formData.phone.replace(/-/g, '');
    if (!phoneDigits) {
      newErrors.phone = '请输入手机号';
    } else if (!/^\d{11}$/.test(phoneDigits)) {
      newErrors.phone = '请输入正确的11位手机号';
    }

    if (!formData.housingType) {
      newErrors.housingType = '请选择居住类型';
    }

    if (!formData.experience.trim()) {
      newErrors.experience = '请填写养宠经验';
    } else if (formData.experience.length > 500) {
      newErrors.experience = '养宠经验不能超过500字';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'phone') {
      const formatted = formatPhone(value);
      setFormData(prev => ({ ...prev, [name]: formatted }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      addApplication(petId, {
        ...formData,
        phone: formData.phone.replace(/-/g, ''),
      });

      setShowSuccess(true);

      setTimeout(() => {
        navigate('/');
      }, 2500);
    } catch (error) {
      console.error('提交失败:', error);
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  if (showSuccess) {
    return (
      <div className="success-overlay">
        <div className="success-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20,6 9,17 4,12" />
          </svg>
        </div>
        <p className="success-text">提交成功！</p>
        <p className="success-subtext">我们将尽快审核您的申请</p>
      </div>
    );
  }

  return (
    <div className="form-page">
      <div className="form-header">
        <h1 className="form-title">申请领养 {petName}</h1>
        <p className="form-subtitle">请填写以下信息，我们将尽快与您联系</p>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">
              姓名 <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              className={`form-input ${errors.name ? 'error' : ''}`}
              value={formData.name}
              onChange={handleInputChange}
              placeholder="请输入您的姓名"
            />
            {errors.name && <p className="form-error">{errors.name}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="phone">
              手机号 <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              className={`form-input ${errors.phone ? 'error' : ''}`}
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="请输入手机号（自动格式化）"
              maxLength={13}
            />
            {errors.phone && <p className="form-error">{errors.phone}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="housingType">
              居住类型 <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <select
              id="housingType"
              name="housingType"
              className={`form-select ${errors.housingType ? 'error' : ''}`}
              value={formData.housingType}
              onChange={handleInputChange}
            >
              {Object.entries(housingTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {errors.housingType && <p className="form-error">{errors.housingType}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="experience">
              养宠经验 <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <textarea
              id="experience"
              name="experience"
              className={`form-textarea ${errors.experience ? 'error' : ''}`}
              value={formData.experience}
              onChange={handleInputChange}
              placeholder="请描述您的养宠经验（最多500字）"
              maxLength={500}
            />
            <div className="char-count">{formData.experience.length}/500</div>
            {errors.experience && <p className="form-error">{errors.experience}</p>}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={handleBack}>
              返回
            </button>
            <button type="submit" className="btn btn-accent" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="loading-spinner" />
                  提交中...
                </>
              ) : (
                '提交申请'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplicationForm;
