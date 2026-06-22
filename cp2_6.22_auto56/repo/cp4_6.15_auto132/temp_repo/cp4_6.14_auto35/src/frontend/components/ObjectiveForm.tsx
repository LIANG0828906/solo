import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { CreateObjectiveRequest } from '../../types';

interface ObjectiveFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateObjectiveRequest) => void;
  initialData?: CreateObjectiveRequest | null;
}

interface FormErrors {
  title?: string;
  description?: string;
  owner?: string;
  keyResults?: string;
}

interface KRFormData {
  title: string;
  currentValue: number;
  targetValue: number;
  confidence: number;
  unit: string;
}

const ObjectiveForm: React.FC<ObjectiveFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [owner, setOwner] = useState('');
  const [quarter, setQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q2');
  const [year, setYear] = useState(2026);
  const [keyResults, setKeyResults] = useState<KRFormData[]>([
    { title: '', currentValue: 0, targetValue: 0, confidence: 3, unit: '%' },
    { title: '', currentValue: 0, targetValue: 0, confidence: 3, unit: '%' }
  ]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [shakeFields, setShakeFields] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description);
      setOwner(initialData.owner);
      setQuarter(initialData.quarter);
      setYear(initialData.year);
      setKeyResults(
        initialData.keyResults.map(kr => ({
          title: kr.title,
          currentValue: kr.currentValue,
          targetValue: kr.targetValue,
          confidence: kr.confidence,
          unit: kr.unit
        }))
      );
    } else {
      resetForm();
    }
  }, [initialData, isOpen]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setOwner('');
    setQuarter('Q2');
    setYear(2026);
    setKeyResults([
      { title: '', currentValue: 0, targetValue: 0, confidence: 3, unit: '%' },
      { title: '', currentValue: 0, targetValue: 0, confidence: 3, unit: '%' }
    ]);
    setErrors({});
    setShakeFields(new Set());
  };

  const triggerShake = (field: string) => {
    setShakeFields(prev => {
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
    requestAnimationFrame(() => {
      setTimeout(() => {
        setShakeFields(prev => new Set(prev).add(field));
        setTimeout(() => {
          setShakeFields(prev => {
            const next = new Set(prev);
            next.delete(field);
            return next;
          });
        }, 200);
      }, 10);
    });
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    if (!title.trim()) {
      newErrors.title = '请输入目标标题';
      triggerShake('title');
      isValid = false;
    }

    if (!description.trim()) {
      newErrors.description = '请输入目标描述';
      triggerShake('description');
      isValid = false;
    }

    if (!owner.trim()) {
      newErrors.owner = '请输入负责人';
      triggerShake('owner');
      isValid = false;
    }

    const validKRs = keyResults.filter(kr => kr.title.trim() && kr.targetValue > 0);
    if (validKRs.length < 2) {
      newErrors.keyResults = '至少需要2个有效的关键结果';
      isValid = false;
    }

    if (keyResults.length > 5) {
      newErrors.keyResults = '关键结果最多5个';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsSubmitting(true);
    
    const validKRs = keyResults.filter(kr => kr.title.trim() && kr.targetValue > 0);
    
    const requestData: CreateObjectiveRequest = {
      title: title.trim(),
      description: description.trim(),
      owner: owner.trim(),
      quarter,
      year,
      keyResults: validKRs.map(kr => ({
        title: kr.title.trim(),
        currentValue: kr.currentValue,
        targetValue: kr.targetValue,
        confidence: kr.confidence,
        unit: kr.unit
      }))
    };

    try {
      await onSubmit(requestData);
      onClose();
      resetForm();
    } catch (error) {
      console.error('提交失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addKR = () => {
    if (keyResults.length < 5) {
      setKeyResults([...keyResults, { title: '', currentValue: 0, targetValue: 0, confidence: 3, unit: '%' }]);
    }
  };

  const removeKR = (index: number) => {
    if (keyResults.length > 2) {
      setKeyResults(keyResults.filter((_, i) => i !== index));
    }
  };

  const updateKR = (index: number, field: keyof KRFormData, value: string | number) => {
    const newKRs = [...keyResults];
    (newKRs[index] as any) = { ...newKRs[index], [field]: value };
    setKeyResults(newKRs);
  };

  if (!isOpen) return null;

  const inputClass = (fieldName: string) =>
    `w-full px-4 py-2.5 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1a237e]/50 ${
      errors[fieldName as keyof FormErrors]
        ? 'border-red-500'
        : 'border-gray-300'
    } ${shakeFields.has(fieldName) ? 'shake' : ''}`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            {initialData ? '编辑目标' : '新建目标'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              目标标题 *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入目标标题"
              className={inputClass('title')}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              目标描述 *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="描述目标的详细内容..."
              rows={3}
              className={inputClass('description')}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                负责人 *
              </label>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="负责人姓名"
                className={inputClass('owner')}
              />
              {errors.owner && (
                <p className="mt-1 text-sm text-red-500">{errors.owner}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  季度
                </label>
                <select
                  value={quarter}
                  onChange={(e) => setQuarter(e.target.value as any)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a237e]/50"
                >
                  <option value="Q1">Q1</option>
                  <option value="Q2">Q2</option>
                  <option value="Q3">Q3</option>
                  <option value="Q4">Q4</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  年份
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a237e]/50"
                >
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">
              关键结果 * (2-5个)
              </label>
              <button
                type="button"
                onClick={addKR}
                disabled={keyResults.length >= 5}
                className="text-[#1a237e] hover:text-[#3949ab] text-sm font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={16} />
                添加关键结果
              </button>
            </div>
            {errors.keyResults && (
              <p className="mb-2 text-sm text-red-500">{errors.keyResults}</p>
            )}

            <div className="space-y-4">
              {keyResults.map((kr, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex justify-between items-start mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    关键结果 {index + 1}
                  </span>
                  {keyResults.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeKR(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <input
                      type="text"
                      value={kr.title}
                      onChange={(e) => updateKR(index, 'title', e.target.value)}
                      placeholder="关键结果标题"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a237e]/50 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-gray-500">当前值</label>
                      <input
                        type="number"
                        value={kr.currentValue}
                        onChange={(e) => updateKR(index, 'currentValue', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a237e]/50 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">目标值</label>
                      <input
                        type="number"
                        value={kr.targetValue}
                        onChange={(e) => updateKR(index, 'targetValue', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a237e]/50 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">单位</label>
                      <input
                        type="text"
                        value={kr.unit}
                        onChange={(e) => updateKR(index, 'unit', e.target.value)}
                        placeholder="%, 个, 分..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a237e]/50 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">置信度</label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => updateKR(index, 'confidence', star)}
                          className="p-1"
                        >
                          <span
                            className="text-xl transition-colors"
                            style={{
                              color: star <= kr.confidence ? '#fbbf24' : '#d1d5db'
                            }}
                          >
                            ★
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium btn hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#1a237e] text-white rounded-lg font-medium btn hover:bg-[#3949ab] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ObjectiveForm;
