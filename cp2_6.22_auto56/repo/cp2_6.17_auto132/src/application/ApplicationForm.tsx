import { useState, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import EventBridge from '../EventBridge';
import type { ApplicationData } from '../types';

interface FormState {
  name: string;
  idCard: string;
  phone: string;
  companyName: string;
  avgRevenue: string;
  hasCollateral: string;
}

interface FormErrors {
  name?: string;
  idCard?: string;
  phone?: string;
  companyName?: string;
  avgRevenue?: string;
  hasCollateral?: string;
}

interface TouchedState {
  name: boolean;
  idCard: boolean;
  phone: boolean;
  companyName: boolean;
  avgRevenue: boolean;
  hasCollateral: boolean;
}

const initialForm: FormState = {
  name: '',
  idCard: '',
  phone: '',
  companyName: '',
  avgRevenue: '',
  hasCollateral: ''
};

function validateField(field: keyof FormState, value: string): string | undefined {
  switch (field) {
    case 'name':
      if (!value.trim()) return '请输入姓名';
      if (value.trim().length < 2) return '姓名至少2个字符';
      return undefined;
    case 'idCard':
      if (!value.trim()) return '请输入身份证号';
      if (!/^\d{17}[\dXx]$/.test(value.trim())) return '身份证号应为18位';
      return undefined;
    case 'phone':
      if (!value.trim()) return '请输入手机号';
      if (!/^1[3-9]\d{9}$/.test(value.trim())) return '手机号格式不正确';
      return undefined;
    case 'companyName':
      if (!value.trim()) return '请输入公司名称';
      if (value.trim().length < 2) return '公司名称至少2个字符';
      return undefined;
    case 'avgRevenue':
      if (!value.trim()) return '请输入近6个月平均流水';
      const num = Number(value);
      if (isNaN(num) || num < 0) return '请输入有效的金额';
      return undefined;
    case 'hasCollateral':
      if (!value) return '请选择是否有抵押物';
      return undefined;
    default:
      return undefined;
  }
}

export default function ApplicationForm() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<TouchedState>({
    name: false,
    idCard: false,
    phone: false,
    companyName: false,
    avgRevenue: false,
    hasCollateral: false
  });
  const [shakeFields, setShakeFields] = useState<Record<string, boolean>>({});

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    const err = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: err }));
    if (touched[field] && err) {
      setShakeFields((prev) => ({ ...prev, [field]: true }));
      setTimeout(() => {
        setShakeFields((prev) => ({ ...prev, [field]: false }));
      }, 300);
    }
  };

  const handleBlur = (field: keyof FormState) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, form[field]);
    setErrors((prev) => ({ ...prev, [field]: err }));
    if (err) {
      setShakeFields((prev) => ({ ...prev, [field]: true }));
      setTimeout(() => {
        setShakeFields((prev) => ({ ...prev, [field]: false }));
      }, 300);
    }
  };

  const progress = useMemo(() => {
    const fields: (keyof FormState)[] = ['name', 'idCard', 'phone', 'companyName', 'avgRevenue', 'hasCollateral'];
    const validCount = fields.filter((f) => !validateField(f, form[f])).length;
    return (validCount / fields.length) * 100;
  }, [form]);

  const isFormValid = useMemo(() => {
    const fields: (keyof FormState)[] = ['name', 'idCard', 'phone', 'companyName', 'avgRevenue', 'hasCollateral'];
    return fields.every((f) => !validateField(f, form[f]));
  }, [form]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fields: (keyof FormState)[] = ['name', 'idCard', 'phone', 'companyName', 'avgRevenue', 'hasCollateral'];
    const newErrors: FormErrors = {};
    let hasError = false;
    fields.forEach((f) => {
      const err = validateField(f, form[f]);
      if (err) {
        newErrors[f] = err;
        hasError = true;
      }
    });
    setErrors(newErrors);
    setTouched({
      name: true,
      idCard: true,
      phone: true,
      companyName: true,
      avgRevenue: true,
      hasCollateral: true
    });

    if (hasError) {
      fields.forEach((f) => {
        if (newErrors[f]) {
          setShakeFields((prev) => ({ ...prev, [f]: true }));
          setTimeout(() => {
            setShakeFields((prev) => ({ ...prev, [f]: false }));
          }, 300);
        }
      });
      return;
    }

    const appData: ApplicationData = {
      id: uuidv4(),
      name: form.name.trim(),
      idCard: form.idCard.trim(),
      phone: form.phone.trim(),
      companyName: form.companyName.trim(),
      avgRevenue: Number(form.avgRevenue),
      hasCollateral: form.hasCollateral === 'yes'
    };

    EventBridge.emit('application:submitted', appData);
  };

  const renderField = (
    field: keyof FormState,
    label: string,
    placeholder: string,
    type: 'text' | 'tel' | 'number' = 'text',
    options?: { value: string; label: string }[]
  ) => {
    const hasError = touched[field] && errors[field];
    const isValid = touched[field] && !errors[field] && form[field].trim() !== '';

    return (
      <div className="form-field">
        <label className="form-label">{label}</label>
        {options ? (
          <div className={`input-wrapper ${shakeFields[field] ? 'shake' : ''}`}>
            <select
              className={`form-input ${hasError ? 'has-error' : ''} ${isValid ? 'is-valid' : ''}`}
              value={form[field]}
              onChange={(e) => handleChange(field, e.target.value)}
              onBlur={() => handleBlur(field)}
            >
              <option value="">请选择</option>
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {isValid && <span className="check-icon">✓</span>}
          </div>
        ) : (
          <div className={`input-wrapper ${shakeFields[field] ? 'shake' : ''}`}>
            <input
              type={type}
              className={`form-input ${hasError ? 'has-error' : ''} ${isValid ? 'is-valid' : ''}`}
              placeholder={placeholder}
              value={form[field]}
              onChange={(e) => handleChange(field, e.target.value)}
              onBlur={() => handleBlur(field)}
            />
            {isValid && <span className="check-icon">✓</span>}
          </div>
        )}
        {hasError && <span className="error-text">{errors[field]}</span>}
      </div>
    );
  };

  return (
    <div className="form-page">
      <div className="form-layout">
        <div className="form-left">
          <div className="form-header">
            <h1 className="form-title">提交借贷申请</h1>
            <p className="form-subtitle">请填写真实信息，系统将根据您的资料进行信用评估</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              {renderField('name', '姓名', '请输入您的姓名')}
              {renderField('idCard', '身份证号', '请输入18位身份证号')}
              {renderField('phone', '手机号', '请输入11位手机号', 'tel')}
              {renderField('companyName', '公司名称', '请输入公司或个体工商户名称')}
              {renderField('avgRevenue', '近6个月平均流水（元）', '请输入金额', 'number')}
              {renderField('hasCollateral', '是否有抵押物', '', 'text', [
                { value: 'yes', label: '是' },
                { value: 'no', label: '否' }
              ])}
            </div>

            <div className="progress-wrapper">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
              <span className="progress-text">填写进度 {Math.round(progress)}%</span>
            </div>

            <button type="submit" className="btn btn-primary btn-submit" disabled={!isFormValid}>
              提交申请
            </button>
          </form>
        </div>

        <div className="form-right">
          <div className="guide-card">
            <h3 className="guide-title">📋 申请指南</h3>
            <ul className="guide-list">
              <li>
                <span className="guide-num">1</span>
                <div>
                  <p className="guide-item-title">填写个人信息</p>
                  <p className="guide-item-desc">请确保姓名与身份证号一致</p>
                </div>
              </li>
              <li>
                <span className="guide-num">2</span>
                <div>
                  <p className="guide-item-title">填写经营信息</p>
                  <p className="guide-item-desc">真实的流水数据有助于提高评估额度</p>
                </div>
              </li>
              <li>
                <span className="guide-num">3</span>
                <div>
                  <p className="guide-item-title">抵押物说明</p>
                  <p className="guide-item-desc">如有房产、车辆等抵押物可提升信用评分</p>
                </div>
              </li>
              <li>
                <span className="guide-num">4</span>
                <div>
                  <p className="guide-item-title">提交评估</p>
                  <p className="guide-item-desc">系统将在3秒内生成信用评估报告</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="guide-card tips-card">
            <h3 className="guide-title">💡 提额小贴士</h3>
            <ul className="tips-list">
              <li>保持良好的个人征信记录</li>
              <li>提供真实有效的经营流水</li>
              <li>有抵押物可显著提升额度</li>
              <li>企业经营年限越长评分越高</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
