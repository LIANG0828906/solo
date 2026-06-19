import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import RippleButton from './RippleButton';
import type { PromotionType, DiscountConfig, FullReductionConfig, GiftConfig } from '../types';

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

const getMinutesFromTime = (datetimeStr: string): number => {
  const date = new Date(datetimeStr);
  return date.getHours() * 60 + date.getMinutes();
};

const setMinutesToTime = (datetimeStr: string, totalMinutes: number): string => {
  const date = new Date(datetimeStr);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  date.setHours(hours, minutes);
  return formatDateTimeLocal(date);
};

const ActivityForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const { currentPromotion, createPromotion, updatePromotion, setCurrentPromotion, clearCurrentPromotion, promotions } = useStore();

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
        setFormData({
          name: promotion.name,
          description: promotion.description || '',
          type: promotion.type,
          config: promotion.config,
          startTime: promotion.startTime,
          endTime: promotion.endTime,
          categories: (promotion as any).categories || [],
        });
      }
    } else {
      clearCurrentPromotion();
    }
    return () => {
      clearCurrentPromotion();
    };
  }, [id, isEditMode, promotions, currentPromotion, setCurrentPromotion, clearCurrentPromotion]);

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
      const config = formData.config as GiftConfig & { buyN?: number; sendM?: number };
      if (!config.giftName.trim()) {
        newErrors.config = '请输入赠品名称';
      }
    }

    if (!formData.startTime) {
      newErrors.startTime = '请选择开始时间';
    }

    if (!formData.endTime) {
      newErrors.endTime = '请选择结束时间';
    } else if (formData.startTime && formData.endTime <= formData.startTime) {
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
        config = { giftName: '', minAmount: 1, buyN: 1, sendM: 1 } as any;
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
        startTime: formData.startTime,
        endTime: formData.endTime,
        categories: formData.categories,
      };

      if (isEditMode && id) {
        await updatePromotion(id, submitData);
      } else {
        await createPromotion(submitData);
      }
      navigate('/activities');
    } catch (error: any) {
      setErrors(prev => ({ ...prev, config: error.message }));
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
          style={styles.input}
          className={`input-field ${errors.name ? 'error' : ''}`}
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
            { value: 'DISCOUNT', label: '折扣', desc: '按比例折扣' },
            { value: 'FULL_REDUCTION', label: '满减', desc: '满额立减' },
            { value: 'GIFT', label: '赠品', desc: '买就送' },
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
            <span>0.1</span>
            <span>0.95</span>
          </div>
          {errors.config && <span style={styles.errorText}>{errors.config}</span>}
        </div>
      )}

      {formData.type === 'FULL_REDUCTION' && (
        <>
          <div style={styles.formGroup}>
            <label style={styles.label}>满减金额 <span style={styles.required}>*</span></label>
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
            {errors.config && <span style={styles.errorText}>{errors.config}</span>}
          </div>
        </>
      )}

      {formData.type === 'GIFT' && (
        <>
          <div style={styles.formGroup}>
            <label style={styles.label}>赠品名称 <span style={styles.required}>*</span></label>
            <input
              type="text"
              value={(formData.config as GiftConfig).giftName}
              onChange={(e) => handleConfigChange('giftName', e.target.value)}
              placeholder="请输入赠品名称"
              style={styles.input}
              className="input-field"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>买N送M配置</label>
            <div style={styles.fullReductionContainer}>
              <div style={styles.fullReductionItem}>
                <span style={styles.fullReductionLabel}>买</span>
                <input
                  type="number"
                  min="1"
                  value={((formData.config as any).buyN) || 1}
                  onChange={(e) => handleConfigChange('buyN', parseInt(e.target.value) || 1)}
                  placeholder="1"
                  style={styles.inputSmall}
                  className="input-field"
                />
                <span style={styles.fullReductionLabel}>件</span>
              </div>
              <div style={styles.fullReductionItem}>
                <span style={styles.fullReductionLabel}>送</span>
                <input
                  type="number"
                  min="1"
                  value={((formData.config as any).sendM) || 1}
                  onChange={(e) => handleConfigChange('sendM', parseInt(e.target.value) || 1)}
                  placeholder="1"
                  style={styles.inputSmall}
                  className="input-field"
                />
                <span style={styles.fullReductionLabel}>件</span>
              </div>
            </div>
          </div>
          {errors.config && <span style={styles.errorText}>{errors.config}</span>}
        </>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div style={styles.stepContainer}>
      <h3 style