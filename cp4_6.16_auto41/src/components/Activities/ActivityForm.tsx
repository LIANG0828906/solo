import { useState, useEffect, useMemo } from 'react';
import { X, Plus, RefreshCw } from 'lucide-react';
import type { Activity, ActivityType, ActivityFormValues } from '@/types';
import {
  TRANSPORT_FACTORS,
  DIET_FACTORS,
  ELECTRICITY_FACTORS,
  ACTIVITY_TYPE_LABELS,
  calculateEmission,
  getFactor,
} from '@/constants/emissionFactors';
import { formatDateKey } from '@/utils/calculations';
import { subDays, format, differenceInDays } from 'date-fns';

interface ActivityFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: Omit<Activity, 'id' | 'emission' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  editData?: Activity | null;
}

const TYPES: { value: ActivityType; label: string; icon: string }[] = [
  { value: 'transport', label: ACTIVITY_TYPE_LABELS.transport, icon: '🚗' },
  { value: 'diet', label: ACTIVITY_TYPE_LABELS.diet, icon: '🍽️' },
  { value: 'electricity', label: ACTIVITY_TYPE_LABELS.electricity, icon: '⚡' },
];

const minDate = format(subDays(new Date(), 6), 'yyyy-MM-dd');
const maxDate = format(new Date(), 'yyyy-MM-dd');

const ActivityForm = ({
  open,
  onClose,
  onSubmit,
  editData,
}: ActivityFormProps) => {
  const isEdit = !!editData;
  const [form, setForm] = useState<ActivityFormValues>({
    type: 'transport',
    subtype: 'walk',
    value: '',
    date: formatDateKey(new Date()),
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ActivityFormValues, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (editData) {
        setForm({
          type: editData.type,
          subtype: editData.subtype,
          value: String(editData.value),
          date: formatDateKey(editData.date),
        });
      } else {
        setForm({
          type: 'transport',
          subtype: 'walk',
          value: '',
          date: formatDateKey(new Date()),
        });
      }
      setErrors({});
      setIsSubmitting(false);
    }
  }, [open, editData]);

  const subtypeOptions = useMemo(() => {
    switch (form.type) {
      case 'transport':
        return TRANSPORT_FACTORS;
      case 'diet':
        return DIET_FACTORS;
      case 'electricity':
        return ELECTRICITY_FACTORS;
      default:
        return [];
    }
  }, [form.type]);

  useEffect(() => {
    if (!subtypeOptions.some((o) => o.subtype === form.subtype)) {
      setForm((prev) => ({ ...prev, subtype: subtypeOptions[0]?.subtype || '' }));
    }
  }, [form.type, subtypeOptions]);

  const currentFactor = getFactor(form.type, form.subtype);
  const previewEmission = useMemo(() => {
    const v = parseFloat(form.value);
    if (isNaN(v) || v <= 0) return 0;
    return calculateEmission(form.type, form.subtype, v);
  }, [form.type, form.subtype, form.value]);

  const validate = (): boolean => {
    const errs: Partial<Record<keyof ActivityFormValues, string>> = {};
    const v = parseFloat(form.value);

    if (!form.value || isNaN(v)) {
      errs.value = '请输入有效的数值';
    } else if (v <= 0) {
      errs.value = '数值必须大于0';
    }

    if (!form.date) {
      errs.date = '请选择日期';
    } else {
      const daysDiff = differenceInDays(new Date(), new Date(form.date));
      if (daysDiff < 0) {
        errs.date = '日期不能晚于今天';
      } else if (daysDiff > 6) {
        errs.date = '日期不能早于7天前';
      }
    }

    if (!form.subtype) {
      errs.subtype = '请选择活动类别';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const success = await onSubmit({
        type: form.type,
        subtype: form.subtype,
        value: parseFloat(form.value),
        date: form.date,
      });
      if (success) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-white">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary-700 flex items-center justify-center text-white">
              {isEdit ? <RefreshCw className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-gray-800">
                {isEdit ? '编辑活动记录' : '新增活动记录'}
              </h3>
              <p className="text-xs text-gray-500">
                {isEdit ? '修改碳排放活动详情' : '记录您的日常碳排放活动'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              活动类型
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, type: t.value }))}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                    form.type === t.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-100 bg-gray-50 hover:border-gray-200 text-gray-600'
                  }`}
                >
                  <span className="text-xl">{t.icon}</span>
                  <span className="text-xs font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              具体活动
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {subtypeOptions.map((opt) => (
                <button
                  key={opt.subtype}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, subtype: opt.subtype }))}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all text-left ${
                    form.subtype === opt.subtype
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <span className="text-lg">{opt.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-800 truncate">
                      {opt.label}
                    </div>
                    <div className="text-[10px] text-gray-500 truncate">
                      {opt.factor === 0
                        ? '零排放'
                        : `${opt.factor} kg CO₂/${opt.unit}`}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {errors.subtype && (
              <p className="mt-1.5 text-xs text-danger-500">{errors.subtype}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                数量（{currentFactor?.unit || '单位'}）
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={form.value}
                onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
                placeholder={`请输入${currentFactor?.unit || '数值'}`}
                className={`input-field ${errors.value ? 'border-danger-400' : ''}`}
              />
              {errors.value && (
                <p className="mt-1.5 text-xs text-danger-500">{errors.value}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                活动日期
              </label>
              <input
                type="date"
                value={form.date}
                min={minDate}
                max={maxDate}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                className={`input-field ${errors.date ? 'border-danger-400' : ''}`}
              />
              {errors.date && (
                <p className="mt-1.5 text-xs text-danger-500">{errors.date}</p>
              )}
            </div>
          </div>

          <div className="rounded-xl p-4 bg-gradient-to-r from-primary-50/60 to-accent-100/40 border border-primary-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500 mb-0.5">预计碳排放</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-primary-700 tabular-nums">
                    {previewEmission.toFixed(2)}
                  </span>
                  <span className="text-sm font-medium text-primary-600">
                    kg CO₂
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 mb-0.5">系数</div>
                <div className="text-sm font-medium text-gray-700">
                  ×{currentFactor?.factor || 0}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-secondary"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : isEdit ? (
                <RefreshCw className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {isSubmitting ? '保存中...' : isEdit ? '保存修改' : '添加记录'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ActivityForm;
