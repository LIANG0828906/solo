import { useState, useCallback, useMemo } from 'react';
import { eventBridge, ApplicationData } from '../EventBridge';
import { useAppStore } from '../store';

interface FormData {
  name: string;
  idNumber: string;
  phone: string;
  companyName: string;
  avgRevenue: string;
  hasCollateral: string;
}

const initialFormData: FormData = {
  name: '',
  idNumber: '',
  phone: '',
  companyName: '',
  avgRevenue: '',
  hasCollateral: '否',
};

type ValidationStatus = 'untouched' | 'valid' | 'error';

interface FieldState {
  status: ValidationStatus;
  message: string;
  shakeKey: number;
}

const initialFieldStates: Record<keyof FormData, FieldState> = {
  name: { status: 'untouched', message: '', shakeKey: 0 },
  idNumber: { status: 'untouched', message: '', shakeKey: 0 },
  phone: { status: 'untouched', message: '', shakeKey: 0 },
  companyName: { status: 'untouched', message: '', shakeKey: 0 },
  avgRevenue: { status: 'untouched', message: '', shakeKey: 0 },
  hasCollateral: { status: 'valid', message: '', shakeKey: 0 },
};

function validateField(
  field: keyof FormData,
  value: string,
  currentShakeKey: number
): FieldState {
  switch (field) {
    case 'name':
      if (!value.trim())
        return { status: 'error', message: '请输入姓名', shakeKey: currentShakeKey + 1 };
      if (value.trim().length < 2)
        return { status: 'error', message: '姓名至少2个字符', shakeKey: currentShakeKey + 1 };
      return { status: 'valid', message: '', shakeKey: currentShakeKey };
    case 'idNumber':
      if (!value.trim())
        return { status: 'error', message: '请输入身份证号', shakeKey: currentShakeKey + 1 };
      if (!/^\d{17}[\dXx]$/.test(value.trim()))
        return {
          status: 'error',
          message: '请输入18位有效身份证号',
          shakeKey: currentShakeKey + 1,
        };
      return { status: 'valid', message: '', shakeKey: currentShakeKey };
    case 'phone':
      if (!value.trim())
        return { status: 'error', message: '请输入手机号', shakeKey: currentShakeKey + 1 };
      if (!/^1\d{10}$/.test(value.trim()))
        return {
          status: 'error',
          message: '请输入11位有效手机号',
          shakeKey: currentShakeKey + 1,
        };
      return { status: 'valid', message: '', shakeKey: currentShakeKey };
    case 'companyName':
      if (!value.trim())
        return { status: 'error', message: '请输入公司名称', shakeKey: currentShakeKey + 1 };
      return { status: 'valid', message: '', shakeKey: currentShakeKey };
    case 'avgRevenue': {
      if (!value.trim())
        return { status: 'error', message: '请输入平均流水', shakeKey: currentShakeKey + 1 };
      const num = parseFloat(value);
      if (isNaN(num) || num <= 0)
        return {
          status: 'error',
          message: '请输入有效的正数',
          shakeKey: currentShakeKey + 1,
        };
      return { status: 'valid', message: '', shakeKey: currentShakeKey };
    }
    case 'hasCollateral':
      return { status: 'valid', message: '', shakeKey: currentShakeKey };
    default:
      return { status: 'untouched', message: '', shakeKey: currentShakeKey };
  }
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="8" fill="#52C41A" />
      <path d="M4.5 8L7 10.5L11.5 5.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const FIELDS: { key: keyof FormData; label: string; type: string; placeholder: string; required: boolean }[] = [
  { key: 'name', label: '姓名', type: 'text', placeholder: '请输入您的姓名', required: true },
  { key: 'idNumber', label: '身份证号', type: 'text', placeholder: '请输入18位身份证号', required: true },
  { key: 'phone', label: '手机号', type: 'tel', placeholder: '请输入11位手机号', required: true },
  { key: 'companyName', label: '公司名称', type: 'text', placeholder: '请输入公司或商户名称', required: true },
  { key: 'avgRevenue', label: '近6个月平均流水（元）', type: 'number', placeholder: '请输入月平均流水金额', required: true },
];

export function ApplicationForm() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [fieldStates, setFieldStates] = useState(initialFieldStates);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const setApplicationData = useAppStore((s) => s.setApplicationData);

  const handleFieldChange = useCallback((field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFieldStates((prev) => {
      const result = validateField(field, value, prev[field].shakeKey);
      return { ...prev, [field]: result };
    });
  }, []);

  const handleFieldBlur = useCallback((field: keyof FormData) => {
    setFieldStates((prev) => {
      const result = validateField(field, formData[field], prev[field].shakeKey);
      return { ...prev, [field]: result };
    });
  }, [formData]);

  const progress = useMemo(() => {
    const total = 6;
    let completed = 0;
    for (const key of Object.keys(fieldStates) as (keyof FormData)[]) {
      if (fieldStates[key].status === 'valid') completed++;
    }
    return Math.round((completed / total) * 100);
  }, [fieldStates]);

  const isFormValid = useMemo(() => {
    return (Object.keys(fieldStates) as (keyof FormData)[]).every(
      (key) => fieldStates[key].status === 'valid'
    );
  }, [fieldStates]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const newStates = { ...fieldStates };
      let allValid = true;
      for (const key of Object.keys(formData) as (keyof FormData)[]) {
        const result = validateField(key, formData[key], newStates[key].shakeKey);
        newStates[key] = result;
        if (result.status !== 'valid') allValid = false;
      }
      setFieldStates(newStates);
      if (!allValid) return;

      const applicationData: ApplicationData = {
        name: formData.name.trim(),
        idNumber: formData.idNumber.trim(),
        phone: formData.phone.trim(),
        companyName: formData.companyName.trim(),
        avgRevenue: parseFloat(formData.avgRevenue),
        hasCollateral: formData.hasCollateral === '是',
      };

      setApplicationData(applicationData);
      eventBridge.emit('application', applicationData);
      setCurrentPage('assessment');
    },
    [formData, fieldStates, setApplicationData, setCurrentPage]
  );

  return (
    <div className="form-page">
      <div className="form-page-header">
        <h2>借贷申请</h2>
        <p>请如实填写以下信息，我们将为您进行信用评估</p>
      </div>
      <div className="form-layout">
        <div className="form-section">
          <form onSubmit={handleSubmit}>
            {FIELDS.map(({ key, label, type, placeholder, required }) => (
              <div className="form-group" key={key}>
                <label className="form-label">
                  {label}
                  {required && <span className="required">*</span>}
                </label>
                <div className="input-wrapper">
                  <input
                    key={`${key}-${fieldStates[key].shakeKey}`}
                    className={`form-input ${fieldStates[key].status === 'error' ? 'error' : ''} ${fieldStates[key].status === 'valid' ? 'valid' : ''}`}
                    type={type}
                    placeholder={placeholder}
                    value={formData[key]}
                    onChange={(e) => handleFieldChange(key, e.target.value)}
                    onBlur={() => handleFieldBlur(key)}
                  />
                  {fieldStates[key].status === 'valid' && (
                    <span className="validation-icon">
                      <CheckIcon />
                    </span>
                  )}
                </div>
                <div className="error-message">
                  {fieldStates[key].status === 'error' && fieldStates[key].message}
                </div>
              </div>
            ))}
            <div className="form-group">
              <label className="form-label">
                是否有抵押物<span className="required">*</span>
              </label>
              <select
                className="form-select"
                value={formData.hasCollateral}
                onChange={(e) => handleFieldChange('hasCollateral', e.target.value)}
              >
                <option value="否">否</option>
                <option value="是">是</option>
              </select>
            </div>
            <button type="submit" className="btn-primary" disabled={!isFormValid}>
              提交申请
            </button>
          </form>
          <div className="progress-container">
            <div className="progress-label">
              <span>填写进度</span>
              <span>{progress}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
        <div className="guide-section">
          <h3>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
              <path d="M9 5.5V9.5L11.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            填写指引
          </h3>
          <div className="guide-item">
            <div className="guide-item-number">1</div>
            <div className="guide-item-content">
              <h4>个人身份信息</h4>
              <p>请确保姓名与身份证号一致，手机号用于后续联系</p>
            </div>
          </div>
          <div className="guide-item">
            <div className="guide-item-number">2</div>
            <div className="guide-item-content">
              <h4>企业经营数据</h4>
              <p>填写公司全称及近6个月银行流水均值，数据越准确评估越精准</p>
            </div>
          </div>
          <div className="guide-item">
            <div className="guide-item-number">3</div>
            <div className="guide-item-content">
              <h4>抵押物信息</h4>
              <p>拥有抵押物可显著提升信用评分和预估额度</p>
            </div>
          </div>
          <div className="guide-item">
            <div className="guide-item-number">4</div>
            <div className="guide-item-content">
              <h4>提交与评估</h4>
              <p>提交后系统将自动进行信用评估，通常在3秒内完成</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
