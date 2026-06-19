import { useState } from 'react';
import { useRiskStore } from '@/store/useRiskStore';
import { LEVEL_LABELS, STATUS_LABELS } from '@/types';
import type { RiskLevel, RiskStatus } from '@/types';
import { getTodayString } from '@/utils/date';
import styles from './AddRiskForm.module.css';

interface AddRiskFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddRiskForm = ({ isOpen, onClose }: AddRiskFormProps) => {
  const addRisk = useRiskStore((state) => state.addRisk);
  const [formData, setFormData] = useState({
    title: '',
    level: 'medium' as RiskLevel,
    status: 'pending' as RiskStatus,
    impact: '',
    owner: '',
    expectedCloseDate: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = '请输入风险标题';
    if (!formData.impact.trim()) newErrors.impact = '请输入影响范围描述';
    if (!formData.owner.trim()) newErrors.owner = '请输入负责人';
    if (!formData.expectedCloseDate) newErrors.expectedCloseDate = '请选择预计解决日期';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    addRisk({
      title: formData.title.trim(),
      level: formData.level,
      status: formData.status,
      impact: formData.impact.trim(),
      owner: formData.owner.trim(),
      expectedCloseDate: formData.expectedCloseDate,
    });

    setFormData({
      title: '',
      level: 'medium',
      status: 'pending',
      impact: '',
      owner: '',
      expectedCloseDate: '',
    });
    setErrors({});
    onClose();
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ''}`}
        onClick={handleOverlayClick}
      />
      <div
        className={`${styles.formContainer} ${isOpen ? styles.formOpen : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-risk-title"
      >
        <div className={styles.formHeader}>
          <h2 id="add-risk-title" className={styles.formTitle}>添加新风险</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="关闭"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="title" className={styles.label}>风险标题 *</label>
              <input
                type="text"
                id="title"
                className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="请输入风险标题"
              />
              {errors.title && <span className={styles.error}>{errors.title}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="level" className={styles.label}>风险等级 *</label>
              <select
                id="level"
                className={styles.select}
                value={formData.level}
                onChange={(e) => handleChange('level', e.target.value as RiskLevel)}
              >
                {(Object.keys(LEVEL_LABELS) as RiskLevel[]).map((level) => (
                  <option key={level} value={level}>
                    {LEVEL_LABELS[level]}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="status" className={styles.label}>状态 *</label>
              <select
                id="status"
                className={styles.select}
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value as RiskStatus)}
              >
                {(Object.keys(STATUS_LABELS) as RiskStatus[]).map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="owner" className={styles.label}>负责人 *</label>
              <input
                type="text"
                id="owner"
                className={`${styles.input} ${errors.owner ? styles.inputError : ''}`}
                value={formData.owner}
                onChange={(e) => handleChange('owner', e.target.value)}
                placeholder="请输入负责人姓名"
              />
              {errors.owner && <span className={styles.error}>{errors.owner}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="expectedCloseDate" className={styles.label}>预计解决日期 *</label>
              <input
                type="date"
                id="expectedCloseDate"
                className={`${styles.input} ${errors.expectedCloseDate ? styles.inputError : ''}`}
                value={formData.expectedCloseDate}
                min={getTodayString()}
                onChange={(e) => handleChange('expectedCloseDate', e.target.value)}
              />
              {errors.expectedCloseDate && (
                <span className={styles.error}>{errors.expectedCloseDate}</span>
              )}
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label htmlFor="impact" className={styles.label}>影响范围描述 *</label>
              <textarea
                id="impact"
                className={`${styles.textarea} ${errors.impact ? styles.inputError : ''}`}
                value={formData.impact}
                onChange={(e) => handleChange('impact', e.target.value)}
                placeholder="请详细描述该风险的影响范围..."
                rows={3}
              />
              {errors.impact && <span className={styles.error}>{errors.impact}</span>
            </div>
          </div>

          <div className={styles.formActions}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              取消
            </button>
            <button type="submit" className={styles.submitButton}>
              添加风险
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddRiskForm;
