import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Plus, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import type { AssetFormData, FormErrors, AssetType } from '@/types';
import { useAssetStore } from './assetStore';

interface AssetEntryFormProps {
  editingAsset?: AssetFormData & { id: string };
  onEditComplete?: () => void;
}

const initialFormData: AssetFormData = {
  name: '',
  type: 'stock',
  buyPrice: 0,
  currentPrice: 0,
  quantity: 0.01,
  buyDate: new Date().toISOString().split('T')[0],
};

const ASSET_TYPE_OPTIONS: { value: AssetType; label: string; color: string }[] = [
  { value: 'stock', label: '股票', color: '#FF6B6B' },
  { value: 'fund', label: '基金', color: '#50C878' },
  { value: 'bank', label: '银行理财', color: '#4A90D9' },
  { value: 'bond', label: '债券', color: '#F59E0B' },
  { value: 'gold', label: '黄金', color: '#D4AF37' },
  { value: 'other', label: '其他', color: '#94A3B8' },
];

const getTypeColor = (type: AssetType): string => {
  const found = ASSET_TYPE_OPTIONS.find((opt) => opt.value === type);
  return found?.color || '#94A3B8';
};

const AssetEntryForm: React.FC<AssetEntryFormProps> = ({
  editingAsset,
  onEditComplete,
}) => {
  const { addAsset, updateAsset } = useAssetStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [formData, setFormData] = useState<AssetFormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [shakeFields, setShakeFields] = useState<Set<string>>(new Set());
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [successVisible, setSuccessVisible] = useState(false);

  const timersRef = useRef<number[]>([]);

  const setSafeTimeout = useRef((callback: () => void, delay: number) => {
    const timerId = window.setTimeout(callback, delay);
    timersRef.current.push(timerId);
    return timerId;
  }).current;

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((timerId) => clearTimeout(timerId));
    timersRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  const isEditing = !!editingAsset;

  useEffect(() => {
    if (editingAsset) {
      setFormData({
        name: editingAsset.name,
        type: editingAsset.type,
        buyPrice: editingAsset.buyPrice,
        currentPrice: editingAsset.currentPrice,
        quantity: editingAsset.quantity,
        buyDate: editingAsset.buyDate,
      });
      setIsExpanded(true);
    }
  }, [editingAsset]);

  const showSuccess = useCallback(
    (message: string) => {
      setSuccessMessage(message);
      setSuccessVisible(true);
      setSafeTimeout(() => {
        setSuccessVisible(false);
        setSafeTimeout(() => {
          setSuccessMessage(null);
        }, 200);
      }, 3000);
    },
    [setSafeTimeout]
  );

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    const newShakeFields = new Set<string>();

    if (!formData.name.trim()) {
      newErrors.name = '请输入资产名称';
      newShakeFields.add('name');
    }

    if (formData.buyPrice <= 0 || isNaN(formData.buyPrice)) {
      newErrors.buyPrice = '买入价必须大于0';
      newShakeFields.add('buyPrice');
    }

    if (formData.currentPrice <= 0 || isNaN(formData.currentPrice)) {
      newErrors.currentPrice = '当前价必须大于0';
      newShakeFields.add('currentPrice');
    }

    if (formData.quantity <= 0 || isNaN(formData.quantity)) {
      newErrors.quantity = '持有数量必须大于0';
      newShakeFields.add('quantity');
    }

    if (!formData.buyDate) {
      newErrors.buyDate = '请选择买入日期';
      newShakeFields.add('buyDate');
    } else {
      const buyDate = new Date(formData.buyDate);
      if (isNaN(buyDate.getTime())) {
        newErrors.buyDate = '日期格式不正确';
        newShakeFields.add('buyDate');
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (buyDate > today) {
          newErrors.buyDate = '买入日期不能晚于今天';
          newShakeFields.add('buyDate');
        }
      }
    }

    setErrors(newErrors);
    setShakeFields(newShakeFields);

    if (newShakeFields.size > 0) {
      setSafeTimeout(() => setShakeFields(new Set()), 200);
    }

    return Object.keys(newErrors).length === 0;
  }, [formData, setSafeTimeout]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (isEditing && editingAsset) {
      updateAsset(editingAsset.id, formData);
      showSuccess('资产更新成功！');
      setSafeTimeout(() => {
        onEditComplete?.();
      }, 500);
    } else {
      addAsset(formData);
      showSuccess('资产添加成功！');
      setFormData({ ...initialFormData, buyDate: new Date().toISOString().split('T')[0] });
    }

    if (!isEditing) {
      setIsExpanded(false);
      setSafeTimeout(() => {
        setIsExpanded(true);
        setFormData({ ...initialFormData, buyDate: new Date().toISOString().split('T')[0] });
      }, 300);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'buyPrice' || name === 'currentPrice' || name === 'quantity'
          ? parseFloat(value) || 0
          : value,
    }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleBuyPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setFormData((prev) => ({
      ...prev,
      buyPrice: value,
      currentPrice: prev.currentPrice === prev.buyPrice ? value : prev.currentPrice,
    }));
  };

  const handleCancel = () => {
    clearAllTimers();
    if (isEditing) {
      onEditComplete?.();
    } else {
      setFormData(initialFormData);
      setErrors({});
      setSuccessMessage(null);
      setSuccessVisible(false);
    }
  };

  const inputClass = (fieldName: string) =>
    `form-input ${errors[fieldName as keyof FormErrors] ? 'form-input-error' : ''} ${
      shakeFields.has(fieldName) ? 'animate-shake' : ''
    }`;

  return (
    <div className="mb-8">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-accent/20 to-accent/5 rounded-xl border border-accent/30 hover:border-accent/50 transition-all duration-300 mb-2"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
            <Plus className="text-white" size={20} />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-text-primary">
              {isEditing ? '编辑资产' : '添加新资产'}
            </h3>
            <p className="text-sm text-text-secondary">
              {isEditing ? '修改资产信息' : '录入您的投资资产'}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="text-text-secondary" size={20} />
        ) : (
          <ChevronDown className="text-text-secondary" size={20} />
        )}
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ${
          isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        {successMessage && (
          <div
            className="mb-4 flex items-center gap-3 px-4 py-3 bg-success/15 border border-success/40 rounded-lg text-success transition-opacity duration-200"
            style={{ opacity: successVisible ? 1 : 0 }}
          >
            <CheckCircle size={20} />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {isEditing && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={handleCancel} />
        )}

        <form
          onSubmit={handleSubmit}
          className={`relative bg-bg-secondary/95 backdrop-blur-md rounded-xl border border-bg-tertiary p-6 ${
            isEditing ? 'fixed inset-8 z-50 m-auto max-w-2xl max-h-fit animate-scale-in' : ''
          }`}
        >
          {isEditing && (
            <button
              type="button"
              onClick={handleCancel}
              className="absolute top-4 right-4 p-1 text-text-secondary hover:text-text-primary transition-colors"
            >
              <X size={20} />
            </button>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                资产名称
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="例如：招商银行定期、易方达蓝筹精选、贵州茅台"
                className={inputClass('name')}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-danger">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                资产类型
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="form-input appearance-none cursor-pointer"
                style={{ borderLeftColor: getTypeColor(formData.type), borderLeftWidth: '4px' }}
              >
                {ASSET_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value} style={{ color: option.color }}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                买入日期
              </label>
              <input
                type="date"
                name="buyDate"
                value={formData.buyDate}
                onChange={handleInputChange}
                max={new Date().toISOString().split('T')[0]}
                className={inputClass('buyDate')}
              />
              {errors.buyDate && (
                <p className="mt-1 text-sm text-danger">{errors.buyDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                买入价 (元)
              </label>
              <input
                type="number"
                name="buyPrice"
                value={formData.buyPrice || ''}
                onChange={handleBuyPriceChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={inputClass('buyPrice')}
              />
              {errors.buyPrice && (
                <p className="mt-1 text-sm text-danger">{errors.buyPrice}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                当前价 (元)
              </label>
              <input
                type="number"
                name="currentPrice"
                value={formData.currentPrice || ''}
                onChange={handleInputChange}
                placeholder="默认与买入价相同"
                step="0.01"
                min="0"
                className={inputClass('currentPrice')}
              />
              {errors.currentPrice && (
                <p className="mt-1 text-sm text-danger">{errors.currentPrice}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                持有数量
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity || ''}
                onChange={handleInputChange}
                placeholder="0.01"
                step="0.01"
                min="0.01"
                className={inputClass('quantity')}
              />
              {errors.quantity && (
                <p className="mt-1 text-sm text-danger">{errors.quantity}</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <button type="button" onClick={handleCancel} className="btn-secondary">
              {isEditing ? '取消' : '重置'}
            </button>
            <button type="submit" className="btn-primary">
              {isEditing ? '保存修改' : '添加资产'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssetEntryForm;
