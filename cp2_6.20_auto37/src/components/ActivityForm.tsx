import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import RippleButton from './RippleButton';
import type { PromotionType, DiscountConfig, FullReductionConfig, GiftConfig } from '../types';
import { format } from 'date-fns';

interface FormData {
  name: string;
  description: string;
  type: PromotionType;
  config: DiscountConfig | FullReductionConfig | GiftConfig;
  startTime: string;
  endTime: string;
  categories: string[];
}

interface FormErrors {
  name?: string;
  type?: string;
  config?: string;
  startTime?: string;
  endTime?: string;
  categories?: string;
}

const CATEGORIES = ['电子产品', '服装', '食品', '家居', '美妆', '图书', '运动', '其他'];

const formatDateTimeLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const parseDateTimeLocal = (dateStr: string): Date => {
  return new Date(dateStr);
};

const getMinutesFromTime = (datetimeStr: string): number => {
  const date = parseDateTimeLocal(datetimeStr);
  return date.getHours() * 60 + date.getMinutes();
};

const setMinutesToTime = (datetimeStr: string, totalMinutes: number): string => {
  const date = parseDateTimeLocal(datetimeStr);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  date.setHours(hours, minutes, 0, 0);
  return formatDateTimeLocal(date);
};

const formatDisplayDate = (dateStr: string): string => {
  try {
    return format(parseDateTimeLocal(dateStr), 'yyyy-MM-dd HH:mm');
  } catch {
    return dateStr;
  }
};

const ActivityForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    currentPromotion,
    createPromotion,
    updatePromotion,
    setCurrentPromotion,
    clearCurrentPromotion,
    promotions,
    loading,
  } = useStore();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    type: 'DISCOUNT',
    config: { discountRate: 0.8 },
    startTime: formatDateTimeLocal(new Date(Date.now() + 24 * 60 * 60 * 1000)),
    endTime: formatDateTimeLocal(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    categories: [],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      const promotion = promotions.find(p => p.id === id) || currentPromotion;
      if (promotion) {
        setCurrentPromotion(promotion);
        let startTime = promotion.startTime;
        let endTime = promotion.endTime;
        try {
          startTime = formatDateTimeLocal(new Date(promotion.startTime));
          endTime = formatDateTimeLocal(new Date(promotion.endTime));
        } catch {}
        setFormData({
          name: promotion.name,
          description: promotion.description || '',
          type: promotion.type,
          config: promotion.config,
          startTime,
          endTime,
          categories: promotion.categories || [],
        });
      }
    } else {
      clearCurrentPromotion();
    }
    return () => {
    };
  }, [id, isEditMode, promotions, currentPromotion, setCurrentPromotion, clearCurrentPromotion]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowCategoryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = '请输入活动名称';
    } else if (formData.name.length > 50) {
      newErrors.name = '活动名称不能超过50个字符';
    }

    if (!formData.type) {
      newErrors.type = '请选择促销类型';
    }

    if (formData.type === 'DISCOUNT') {
      const config = formData.config as DiscountConfig;
      if (config.discountRate < 0.1 || config.discountRate > 0.95) {
        newErrors.config = '折扣率必须在0.1到0.95之间';
      }
    } else if (formData.type === 'FULL_REDUCTION') {
      const config = formData.config as FullReductionConfig;
      if (!config.fullAmount || config.fullAmount <= 0) {
        newErrors.config = '请输入有效的满减金额';
      } else if (!config.reductionAmount || config.reductionAmount <= 0) {
        newErrors.config = '请输入有效的减免金额';
      } else if (config.reductionAmount >= config.fullAmount) {
        newErrors.config = '减免金额必须小于满减金额';
      }
    } else if (formData.type === 'GIFT') {
      const config = formData.config as GiftConfig;
      if (!config.giftName || !config.giftName.trim()) {
        newErrors.config = '请输入赠品名称';
      }
    }

    if (!formData.startTime) {
      newErrors.startTime = '请选择开始时间';
    }

    if (!formData.endTime) {
      newErrors.endTime = '请选择结束时间';
    } else if (formData.startTime && parseDateTimeLocal(formData.endTime) <= parseDateTimeLocal(formData.startTime)) {
      newErrors.endTime = '结束时间必须晚于开始时间';
    }

    if (formData.categories.length === 0) {
      newErrors.categories = '请选择至少一个适用商品类别';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTypeChange = (type: PromotionType) => {
    let config: DiscountConfig | FullReductionConfig | GiftConfig;
    switch (type) {
      case 'DISCOUNT':
        config = { discountRate: 0.8 };
        break;
      case 'FULL_REDUCTION':
        config = { fullAmount: 100, reductionAmount: 20 };
        break;
      case 'GIFT':
        config = { giftName: '', minAmount: 1 };
        break;
      default:
        config = { discountRate: 0.8 };
    }
    setFormData(prev => ({ ...prev, type, config }));
    setErrors(prev => ({ ...prev, type: undefined, config: undefined }));
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleConfigChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      config: { ...prev.config, [key]: value },
    }));
    if (errors.config) {
      setErrors(prev => ({ ...prev, config: undefined }));
    }
  };

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => {
      const categories = prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category];
      return { ...prev, categories };
    });
    if (errors.categories) {
      setErrors(prev => ({ ...prev, categories: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const submitData = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        config: formData.config,
        startTime: parseDateTimeLocal(formData.startTime).toISOString(),
        endTime: parseDateTimeLocal(formData.endTime).toISOString(),
        categories: formData.categories,
      };

      if (isEditMode && id) {
        await updatePromotion(id, submitData);
      } else {
        await createPromotion(submitData);
      }
      navigate('/');
    } catch (error: any) {
      setErrors(prev => ({ ...prev, config: error.message || '保存失败' }));
    }
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.name.trim()) {
        setErrors(prev => ({ ...prev, name: '请输入活动名称' }));
        return;
      }
      if (!formData.type) {
        setErrors(prev => ({ ...prev, type: '请选择促销类型' }));
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const renderStep1 = () => (
    <div style={styles.stepContainer}>
      <h3 style={styles.stepTitle}>基本信息</h3>

      <div style={styles.formGroup}>
        <label style={styles.label}>活动名称 <span style={styles.required}>*</span></label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="请输入活动名称"
          style={{
            ...styles.input,
            ...(errors.name ? { borderColor: '#ef4444' } : {}),
          }}
          className="input-field"
        />
        {errors.name && <span style={styles.errorText}>{errors.name}</span>}
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>活动描述</label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="请输入活动描述（选填）"
          style={{ ...styles.input, ...styles.textarea }}
          className="input-field"
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>促销类型 <span style={styles.required}>*</span></label>
        <div style={styles.radioGroup}>
          {[
            { value: 'DISCOUNT', label: '折扣', desc: '按比例折扣，如8折' },
            { value: 'FULL_REDUCTION', label: '满减', desc: '满额立减，如满100减20' },
            { value: 'GIFT', label: '赠品', desc: '买就送，如买一送一' },
          ].map((option) => (
            <label
              key={option.value}
              style={{
                ...styles.radioLabel,
                ...(formData.type === option.value ? styles.radioLabelSelected : {}),
              }}
              onClick={() => handleTypeChange(option.value as PromotionType)}
            >
              <input
                type="radio"
                name="type"
                value={option.value}
                checked={formData.type === option.value}
                onChange={() => handleTypeChange(option.value as PromotionType)}
                style={styles.radioInput}
              />
              <div style={styles.radioContent}>
                <span style={styles.radioLabelText}>{option.label}</span>
                <span style={styles.radioDesc}>{option.desc}</span>
              </div>
            </label>
          ))}
        </div>
        {errors.type && <span style={styles.errorText}>{errors.type}</span>}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div style={styles.stepContainer}>
      <h3 style={styles.stepTitle}>规则配置</h3>

      {formData.type === 'DISCOUNT' && (
        <div style={styles.formGroup}>
          <label style={styles.label}>折扣率 <span style={styles.required}>*</span></label>
          <div style={styles.sliderContainer}>
            <input
              type="range"
              min="0.1"
              max="0.95"
              step="0.05"
              value={(formData.config as DiscountConfig).discountRate}
              onChange={(e) => handleConfigChange('discountRate', parseFloat(e.target.value))}
              style={styles.slider}
            />
            <div style={styles.sliderValue}>
              {((formData.config as DiscountConfig).discountRate * 10).toFixed(1)}折
            </div>
          </div>
          <div style={styles.sliderMarks}>
            <span>1折</span>
            <span>9.5折</span>
          </div>
          {errors.config && <span style={styles.errorText}>{errors.config}</span>}
        </div>
      )}

      {formData.type === 'FULL_REDUCTION' && (
        <div style={styles.formGroup}>
          <label style={styles.label}>满减规则 <span style={styles.required}>*</span></label>
          <div style={styles.fullReductionContainer}>
            <div style={styles.fullReductionItem}>
              <span style={styles.fullReductionLabel}>满</span>
              <input
                type="number"
                min="0"
                value={(formData.config as FullReductionConfig).fullAmount}
                onChange={(e) => handleConfigChange('fullAmount', parseFloat(e.target.value) || 0)}
                placeholder="0"
                style={styles.inputSmall}
                className="input-field"
              />
              <span style={styles.fullReductionLabel}>元</span>
            </div>
            <div style={styles.fullReductionItem}>
              <span style={styles.fullReductionLabel}>减</span>
              <input
                type="number"
                min="0"
                value={(formData.config as FullReductionConfig).reductionAmount}
                onChange={(e) => handleConfigChange('reductionAmount', parseFloat(e.target.value) || 0)}
                placeholder="0"
                style={styles.inputSmall}
                className="input-field"
              />
              <span style={styles.fullReductionLabel}>元</span>
            </div>
          </div>
          <div style={styles.hintText}>
            例：满100元减20元
          </div>
          {errors.config && <span style={styles.errorText}>{errors.config}</span>}
        </div>
      )}

      {formData.type === 'GIFT' && (
        <>
          <div style={styles.formGroup}>
            <label style={styles.label}>赠品名称 <span style={styles.required}>*</span></label>
            <input
              type="text"
              value={(formData.config as GiftConfig).giftName}
              onChange={(e) => handleConfigChange('giftName', e.target.value)}
              placeholder="请输入赠品名称，如：精美礼品一份"
              style={{
                ...styles.input,
                ...(errors.config ? { borderColor: '#ef4444' } : {}),
              }}
              className="input-field"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>最低消费金额（选填）</label>
            <div style={styles.fullReductionItem}>
              <span style={styles.fullReductionLabel}>满</span>
              <input
                type="number"
                min="0"
                value={(formData.config as GiftConfig).minAmount || 0}
                onChange={(e) => handleConfigChange('minAmount', parseFloat(e.target.value) || 0)}
                placeholder="0"
                style={styles.inputSmall}
                className="input-field"
              />
              <span style={styles.fullReductionLabel}>元可获赠</span>
            </div>
          </div>
          {errors.config && <span style={styles.errorText}>{errors.config}</span>}
        </>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div style={styles.stepContainer}>
      <h3 style={styles.stepTitle}>时间与范围</h3>

      <div style={styles.formGroup}>
        <label style={styles.label}>开始时间 <span style={styles.required}>*</span></label>
        <div style={styles.dateTimeContainer}>
          <input
            type="date"
            value={formData.startTime.split('T')[0]}
            onChange={(e) => {
              const timePart = formData.startTime.split('T')[1] || '00:00';
              handleInputChange('startTime', `${e.target.value}T${timePart}`);
            }}
            style={styles.dateInput}
            className="input-field"
          />
          <input
            type="range"
            min="0"
            max="1439"
            step="1"
            value={getMinutesFromTime(formData.startTime)}
            onChange={(e) => handleInputChange('startTime', setMinutesToTime(formData.startTime, parseInt(e.target.value)))}
            style={styles.timeSlider}
          />
          <span style={styles.timeValue}>
            {formatDisplayDate(formData.startTime)}
          </span>
        </div>
        {errors.startTime && <span style={styles.errorText}>{errors.startTime}</span>}
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>结束时间 <span style={styles.required}>*</span></label>
        <div style={styles.dateTimeContainer}>
          <input
            type="date"
            value={formData.endTime.split('T')[0]}
            onChange={(e) => {
              const timePart = formData.endTime.split('T')[1] || '00:00';
              handleInputChange('endTime', `${e.target.value}T${timePart}`);
            }}
            style={styles.dateInput}
            className="input-field"
          />
          <input
            type="range"
            min="0"
            max="1439"
            step="1"
            value={getMinutesFromTime(formData.endTime)}
            onChange={(e) => handleInputChange('endTime', setMinutesToTime(formData.endTime, parseInt(e.target.value)))}
            style={styles.timeSlider}
          />
          <span style={styles.timeValue}>
            {formatDisplayDate(formData.endTime)}
          </span>
        </div>
        {errors.endTime && <span style={styles.errorText}>{errors.endTime}</span>}
      </div>

      <div style={styles.formGroup} ref={dropdownRef}>
        <label style={styles.label}>适用商品类别 <span style={styles.required}>*</span></label>
        <div
          style={{
            ...styles.categorySelect,
            ...(errors.categories ? { borderColor: '#ef4444' } : {}),
          }}
          onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
          className="input-field"
        >
          {formData.categories.length === 0 ? (
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>请选择适用商品类别（可多选）</span>
          ) : (
            <div style={styles.selectedCategories}>
              {formData.categories.map((cat, idx) => (
                <span key={idx} style={styles.categoryPill}>
                  {cat}
                  <span
                    style={styles.categoryRemove}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCategoryToggle(cat);
                    }}
                  >
                    ×
                  </span>
                </span>
              ))}
            </div>
          )}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{
            marginLeft: 'auto',
            transform: showCategoryDropdown ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.2s ease',
          }}>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
        {showCategoryDropdown && (
          <div style={styles.categoryDropdown}>
            {CATEGORIES.map((cat) => (
              <div
                key={cat}
                style={{
                  ...styles.categoryOption,
                  ...(formData.categories.includes(cat) ? styles.categoryOptionSelected : {}),
                }}
                onClick={() => handleCategoryToggle(cat)}
              >
                <span style={styles.categoryCheckbox}>
                  {formData.categories.includes(cat) && '✓'}
                </span>
                <span>{cat}</span>
              </div>
            ))}
          </div>
        )}
        {errors.categories && <span style={styles.errorText}>{errors.categories}</span>}
      </div>

      <div style={styles.summaryContainer}>
        <h4 style={styles.summaryTitle}>活动预览</h4>
        <div style={styles.summaryContent}>
          <div style={styles.summaryRow}>
            <span style={styles.summaryLabel}>活动名称</span>
            <span style={styles.summaryValue}>{formData.name || '未设置'}</span>
          </div>
          <div style={styles.summaryRow}>
            <span style={styles.summaryLabel}>促销类型</span>
            <span style={styles.summaryValue}>
              {formData.type === 'DISCOUNT' ? '折扣' : formData.type === 'FULL_REDUCTION' ? '满减' : '赠品'}
            </span>
          </div>
          <div style={styles.summaryRow}>
            <span style={styles.summaryLabel}>活动时间</span>
            <span style={styles.summaryValue}>
              {formatDisplayDate(formData.startTime)} ~ {formatDisplayDate(formData.endTime)}
            </span>
          </div>
          <div style={styles.summaryRow}>
            <span style={styles.summaryLabel}>适用类别</span>
            <span style={styles.summaryValue}>
              {formData.categories.length > 0 ? formData.categories.join('、') : '未设置'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.backButton} onClick={() => navigate('/')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
          <span>返回列表</span>
        </div>
        <h1 style={styles.pageTitle}>{isEditMode ? '编辑活动' : '创建新活动'}</h1>
      </div>

      <div style={styles.progressSteps}>
        {['基本信息', '规则配置', '时间范围'].map((step, idx) => (
          <div key={idx} style={styles.stepWrapper}>
            <div style={{
              ...styles.stepIndicator,
              ...(currentStep > idx + 1 ? styles.stepCompleted : {}),
              ...(currentStep === idx + 1 ? styles.stepActive : {}),
            }}>
              {currentStep > idx + 1 ? '✓' : idx + 1}
            </div>
            <span style={{
              ...styles.stepLabel,
              ...(currentStep === idx + 1 ? styles.stepLabelActive : {}),
            }}>
              {step}
            </span>
            {idx < 2 && <div style={{
              ...styles.stepLine,
              ...(currentStep > idx + 1 ? styles.stepLineCompleted : {}),
            }} />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={styles.formCard}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}

        <div style={styles.buttonRow}>
          {currentStep > 1 ? (
            <RippleButton variant="outline" type="button" onClick={prevStep}>
              上一步
            </RippleButton>
          ) : (
            <RippleButton variant="outline" type="button" onClick={() => navigate('/')}>
              取消
            </RippleButton>
          )}
          <div style={{ flex: 1 }} />
          {currentStep < 3 ? (
            <RippleButton variant="primary" type="button" onClick={nextStep}>
              下一步
            </RippleButton>
          ) : (
            <RippleButton variant="primary" type="submit" disabled={loading}>
              {loading ? '保存中...' : (isEditMode ? '保存修改' : '创建活动')}
            </RippleButton>
          )}
        </div>
      </form>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '32px 20px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '32px',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: 'rgba(255, 255, 255, 0.7)',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'color 0.2s ease',
    padding: '8px 12px',
    borderRadius: '8px',
  },
  pageTitle: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 700,
    color: '#fff',
  },
  progressSteps: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '32px',
    gap: '0',
  },
  stepWrapper: {
    display: 'flex',
    alignItems: 'center',
  },
  stepIndicator: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 600,
    color: 'rgba(255, 255, 255, 0.5)',
    transition: 'all 0.3s ease',
  },
  stepActive: {
    backgroundColor: '#e2b714',
    borderColor: '#e2b714',
    color: '#1a1a2e',
    boxShadow: '0 0 0 4px rgba(226, 183, 20, 0.2)',
  },
  stepCompleted: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
    color: '#fff',
  },
  stepLabel: {
    marginLeft: '8px',
    marginRight: '16px',
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: 500,
  },
  stepLabelActive: {
    color: '#fff',
  },
  stepLine: {
    width: '60px',
    height: '2px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: '16px',
  },
  stepLineCompleted: {
    backgroundColor: '#10b981',
  },
  formCard: {
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '32px',
    animation: 'slideUp 0.4s ease-out',
  },
  stepContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    marginBottom: '32px',
  },
  stepTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: '#fff',
    paddingBottom: '12px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 500,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  required: {
    color: '#ef4444',
  },
  input: {
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.3s ease',
  },
  textarea: {
    minHeight: '80px',
    resize: 'vertical',
  },
  inputSmall: {
    width: '100px',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.3s ease',
  },
  errorText: {
    fontSize: '12px',
    color: '#ef4444',
    marginTop: '4px',
  },
  hintText: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: '4px',
  },
  radioGroup: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    borderRadius: '12px',
    border: '2px solid rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  radioLabelSelected: {
    borderColor: '#e2b714',
    backgroundColor: 'rgba(226, 183, 20, 0.1)',
    boxShadow: '0 0 0 3px rgba(226, 183, 20, 0.1)',
  },
  radioInput: {
    display: 'none',
  },
  radioContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  radioLabelText: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#fff',
  },
  radioDesc: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  sliderContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  slider: {
    flex: 1,
    height: '8px',
    borderRadius: '4px',
    background: 'rgba(255, 255, 255, 0.1)',
    outline: 'none',
    appearance: 'none',
    cursor: 'pointer',
  },
  sliderValue: {
    minWidth: '60px',
    padding: '8px 16px',
    borderRadius: '8px',
    backgroundColor: 'rgba(226, 183, 20, 0.2)',
    color: '#e2b714',
    fontSize: '14px',
    fontWeight: 600,
    textAlign: 'center',
  },
  sliderMarks: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingLeft: '4px',
    paddingRight: '80px',
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  fullReductionContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  fullReductionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  fullReductionLabel: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: 500,
  },
  dateTimeContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  dateInput: {
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
  },
  timeSlider: {
    flex: 1,
    minWidth: '120px',
    height: '6px',
    borderRadius: '3px',
    background: 'rgba(255, 255, 255, 0.1)',
    outline: 'none',
    cursor: 'pointer',
  },
  timeValue: {
    fontSize: '13px',
    color: '#e2b714',
    fontWeight: 500,
    minWidth: '140px',
  },
  categorySelect: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#fff',
    fontSize: '14px',
    cursor: 'pointer',
    minHeight: '48px',
    flexWrap: 'wrap',
  },
  selectedCategories: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    flex: 1,
  },
  categoryPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    borderRadius: '6px',
    backgroundColor: 'rgba(226, 183, 20, 0.2)',
    color: '#e2b714',
    fontSize: '12px',
    fontWeight: 500,
  },
  categoryRemove: {
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 700,
    padding: '0 2px',
  },
  categoryDropdown: {
    position: 'relative',
    marginTop: '4px',
    backgroundColor: '#16213e',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    padding: '8px',
    maxHeight: '240px',
    overflowY: 'auto',
    zIndex: 100,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  },
  categoryOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  categoryOptionSelected: {
    backgroundColor: 'rgba(226, 183, 20, 0.15)',
  },
  categoryCheckbox: {
    width: '20px',
    height: '20px',
    borderRadius: '4px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    color: '#e2b714',
    fontWeight: 700,
  },
  summaryContainer: {
    marginTop: '16px',
    padding: '20px',
    borderRadius: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  summaryTitle: {
    margin: 0,
    marginBottom: '16px',
    fontSize: '14px',
    fontWeight: 600,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  summaryContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
  },
  summaryLabel: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  summaryValue: {
    fontSize: '13px',
    color: '#fff',
    fontWeight: 500,
    textAlign: 'right',
  },
  buttonRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    paddingTop: '24px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  },
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #e2b714;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(226, 183, 20, 0.4);
    transition: transform 0.2s ease;
  }
  input[type="range"]::-webkit-slider-thumb:hover {
    transform: scale(1.1);
  }
  input[type="range"]::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #e2b714;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 8px rgba(226, 183, 20, 0.4);
  }
  input[type="date"]::-webkit-calendar-picker-indicator {
    filter: invert(1);
    cursor: pointer;
  }
  input[type="date"] {
    color-scheme: dark;
  }
  .back-btn:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: #fff;
  }
`;
document.head.appendChild(styleSheet);

export default ActivityForm;
