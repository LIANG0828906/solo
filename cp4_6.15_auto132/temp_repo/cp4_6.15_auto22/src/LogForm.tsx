import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useCoffeeStore } from '@/store';
import { PRESET_BEANS } from '@/data/presetBeans';
import { BREW_METHOD_LABELS, FLAVOR_TAGS } from '@/types';
import type { CoffeeBean, BrewMethod, LogEntry } from '@/types';
import FlavorTags from '@/components/FlavorTags';
import StarRating from '@/components/StarRating';
import BrewMethodIcon from '@/components/BrewMethodIcon';

interface FormState {
  beanSearch: string;
  selectedBean: CoffeeBean | null;
  customBeanName: string;
  customBeanOrigin: string;
  customBeanRoast: string;
  isCustomBean: boolean;
  brewMethod: BrewMethod | '';
  grindSize: number;
  waterTemp: number;
  ratio: number;
  brewMinutes: number;
  brewSeconds: number;
  rating: number;
  flavorTags: string[];
  customDescription: string;
}

const INITIAL_FORM: FormState = {
  beanSearch: '',
  selectedBean: null,
  customBeanName: '',
  customBeanOrigin: '',
  customBeanRoast: '中烘',
  isCustomBean: false,
  brewMethod: '',
  grindSize: 5,
  waterTemp: 92,
  ratio: 15,
  brewMinutes: 3,
  brewSeconds: 0,
  rating: 0,
  flavorTags: [],
  customDescription: '',
};

interface Validation {
  bean: string | null;
  brewMethod: string | null;
  waterTemp: string | null;
  rating: string | null;
}

function validateForm(form: FormState): Validation {
  const v: Validation = { bean: null, brewMethod: null, waterTemp: null, rating: null };

  if (!form.selectedBean && !form.isCustomBean) {
    v.bean = '请选择或输入咖啡豆';
  }
  if (form.isCustomBean && !form.customBeanName.trim()) {
    v.bean = '请输入咖啡豆名称';
  }
  if (!form.brewMethod) {
    v.brewMethod = '请选择冲煮方式';
  }
  if (form.waterTemp < 80) {
    v.waterTemp = '水温低于80°C，可能导致萃取不足，建议提高水温';
  }
  if (form.rating === 0) {
    v.rating = '请为本次冲煮评分';
  }

  return v;
}

export default function LogForm() {
  const [form, setForm] = useState<FormState>({ ...INITIAL_FORM });
  const [showBeanDropdown, setShowBeanDropdown] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const addLog = useCoffeeStore((s) => s.addLog);
  const addCustomBean = useCoffeeStore((s) => s.addCustomBean);
  const customBeans = useCoffeeStore((s) => s.customBeans);
  const addToast = useCoffeeStore((s) => s.addToast);
  const rippleRef = useRef<HTMLButtonElement>(null);

  const allBeans = useMemo(() => [...PRESET_BEANS, ...customBeans], [customBeans]);

  const filteredBeans = useMemo(() => {
    if (!form.beanSearch.trim()) return allBeans;
    const q = form.beanSearch.toLowerCase();
    return allBeans.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.origin.toLowerCase().includes(q) ||
        b.roastLevel.toLowerCase().includes(q)
    );
  }, [allBeans, form.beanSearch]);

  const validation = useMemo(() => validateForm(form), [form]);

  const updateField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const markTouched = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const selectBean = useCallback((bean: CoffeeBean) => {
    setForm((prev) => ({
      ...prev,
      selectedBean: bean,
      beanSearch: bean.name,
      isCustomBean: false,
    }));
    setShowBeanDropdown(false);
    setTouched((prev) => ({ ...prev, bean: true }));
  }, []);

  const handleCustomBeanToggle = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      isCustomBean: !prev.isCustomBean,
      selectedBean: null,
      beanSearch: '',
    }));
  }, []);

  const handleSubmit = useCallback(() => {
    const allTouched: Record<string, boolean> = { bean: true, brewMethod: true, waterTemp: true, rating: true };
    setTouched(allTouched);

    const v = validateForm(form);
    if (v.bean || v.brewMethod || v.rating) {
      addToast({ type: 'warning', message: '请完善必填项后再保存' });
      return;
    }

    let bean: CoffeeBean;
    if (form.isCustomBean) {
      bean = {
        id: `custom-${Date.now()}`,
        name: form.customBeanName.trim(),
        origin: form.customBeanOrigin.trim() || '未知',
        roastLevel: form.customBeanRoast,
      };
      addCustomBean(bean);
    } else {
      bean = form.selectedBean!;
    }

    const entry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      bean,
      brewMethod: form.brewMethod as BrewMethod,
      grindSize: form.grindSize,
      waterTemp: form.waterTemp,
      ratio: form.ratio,
      brewTimeSeconds: form.brewMinutes * 60 + form.brewSeconds,
      rating: form.rating,
      flavorTags: form.flavorTags,
      customDescription: form.customDescription.trim(),
      createdAt: Date.now(),
    };

    addLog(entry);
    addToast({ type: 'success', message: '冲煮记录已保存！' });
    setForm({ ...INITIAL_FORM });
    setTouched({});
  }, [form, addLog, addCustomBean, addToast]);

  const brewMethods: BrewMethod[] = ['pourover', 'espresso', 'frenchPress', 'aeropress'];

  const showWaterTempWarning = !!validation.waterTemp;
  const waterTempHasError = form.waterTemp < 80;

  return (
    <div className="bg-coffee-100 rounded-2xl p-6 shadow-sm">
      <h2 className="font-display text-2xl font-bold text-coffee-900 mb-6">记录冲煮</h2>

      <div className="space-y-5">
        {/* Coffee Bean Selection */}
        <div>
          <label className="block text-sm font-medium text-coffee-700 mb-1.5">
            咖啡豆 <span className="text-red-500">*</span>
          </label>
          {!form.isCustomBean ? (
            <div className="relative">
              <input
                type="text"
                value={form.beanSearch}
                onChange={(e) => {
                  updateField('beanSearch', e.target.value);
                  setShowBeanDropdown(true);
                }}
                onFocus={() => setShowBeanDropdown(true)}
                onBlur={() => setTimeout(() => setShowBeanDropdown(false), 200)}
                placeholder="搜索咖啡豆..."
                className={`w-full px-3 py-2.5 rounded-lg border bg-white text-coffee-900 placeholder:text-coffee-300
                  focus:outline-none focus:ring-2 focus:ring-amber/50 focus:border-amber
                  ${touched.bean && validation.bean ? 'border-red-400' : 'border-coffee-200'}
                  transition-colors`}
              />
              {showBeanDropdown && filteredBeans.length > 0 && (
                <div className="absolute z-20 top-full mt-1 w-full bg-white rounded-lg shadow-lg border border-coffee-200 max-h-48 overflow-y-auto scrollbar-thin">
                  {filteredBeans.map((bean) => (
                    <button
                      key={bean.id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-coffee-50 transition-colors flex justify-between items-center"
                      onClick={() => selectBean(bean)}
                    >
                      <span className="text-sm font-medium text-coffee-800">{bean.name}</span>
                      <span className="text-xs text-coffee-400">{bean.origin} · {bean.roastLevel}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                value={form.customBeanName}
                onChange={(e) => updateField('customBeanName', e.target.value)}
                onBlur={() => markTouched('bean')}
                placeholder="咖啡豆名称"
                className={`w-full px-3 py-2.5 rounded-lg border bg-white text-coffee-900 placeholder:text-coffee-300
                  focus:outline-none focus:ring-2 focus:ring-amber/50 focus:border-amber
                  ${touched.bean && validation.bean ? 'border-red-400' : 'border-coffee-200'}
                  transition-colors`}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={form.customBeanOrigin}
                  onChange={(e) => updateField('customBeanOrigin', e.target.value)}
                  placeholder="产地"
                  className="w-full px-3 py-2 rounded-lg border border-coffee-200 bg-white text-coffee-900 placeholder:text-coffee-300 focus:outline-none focus:ring-2 focus:ring-amber/50 focus:border-amber transition-colors text-sm"
                />
                <select
                  value={form.customBeanRoast}
                  onChange={(e) => updateField('customBeanRoast', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-coffee-200 bg-white text-coffee-900 focus:outline-none focus:ring-2 focus:ring-amber/50 focus:border-amber transition-colors text-sm"
                >
                  <option value="浅烘">浅烘</option>
                  <option value="中烘">中烘</option>
                  <option value="中深烘">中深烘</option>
                  <option value="深烘">深烘</option>
                </select>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={handleCustomBeanToggle}
            className="mt-1.5 text-xs text-amber-dark hover:text-amber underline underline-offset-2 transition-colors"
          >
            {form.isCustomBean ? '从列表中选择' : '手动输入新豆'}
          </button>
          {touched.bean && validation.bean && (
            <p className="mt-1 text-xs text-red-500">{validation.bean}</p>
          )}
        </div>

        {/* Brew Method */}
        <div>
          <label className="block text-sm font-medium text-coffee-700 mb-1.5">
            冲煮方式 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {brewMethods.map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => {
                  updateField('brewMethod', method);
                  markTouched('brewMethod');
                }}
                className={`
                  flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all duration-200
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-amber
                  ${form.brewMethod === method
                    ? 'border-amber bg-amber/10 shadow-sm'
                    : 'border-coffee-200 bg-white hover:border-coffee-300 hover:bg-coffee-50'}
                `}
              >
                <BrewMethodIcon method={method} size={24} />
                <span className="text-sm font-medium text-coffee-800">{BREW_METHOD_LABELS[method]}</span>
              </button>
            ))}
          </div>
          {touched.brewMethod && validation.brewMethod && (
            <p className="mt-1 text-xs text-red-500">{validation.brewMethod}</p>
          )}
        </div>

        {/* Grind Size Slider */}
        <div>
          <label className="block text-sm font-medium text-coffee-700 mb-1.5">
            研磨度 <span className="text-coffee-400 font-normal">({form.grindSize}/10)</span>
          </label>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={form.grindSize}
            onChange={(e) => updateField('grindSize', Number(e.target.value))}
            className="slider-coffee"
          />
          <div className="flex justify-between text-xs text-coffee-400 mt-1">
            <span>极细</span><span>粗</span>
          </div>
        </div>

        {/* Water Temp Slider */}
        <div>
          <label className={`block text-sm font-medium mb-1.5 transition-colors ${waterTempHasError ? 'text-amber-dark' : 'text-coffee-700'}`}>
            水温 <span className="text-coffee-400 font-normal">({form.waterTemp}°C)</span>
            {waterTempHasError && <span className="ml-2 text-xs">⚠ 偏低</span>}
          </label>
          <div className={`relative rounded-lg p-2 -mx-2 transition-colors ${waterTempHasError ? 'bg-amber/10' : ''}`}>
            <input
              type="range"
              min={70}
              max={100}
              step={1}
              value={form.waterTemp}
              onChange={(e) => {
                updateField('waterTemp', Number(e.target.value));
              }}
              className={`slider-coffee`}
              style={waterTempHasError ? { background: 'linear-gradient(to right, #FFBF00, #E5AC00)' } : undefined}
            />
          </div>
          <div className="flex justify-between text-xs text-coffee-400 mt-1">
            <span>70°C</span><span>100°C</span>
          </div>
          {showWaterTempWarning && (
            <p className="mt-1.5 text-xs text-amber-dark flex items-center gap-1 animate-fade_in">
              <span>⚠</span> {validation.waterTemp}
            </p>
          )}
        </div>

        {/* Ratio Slider */}
        <div>
          <label className="block text-sm font-medium text-coffee-700 mb-1.5">
            粉水比 <span className="text-coffee-400 font-normal">(1:{form.ratio})</span>
          </label>
          <input
            type="range"
            min={10}
            max={20}
            step={1}
            value={form.ratio}
            onChange={(e) => updateField('ratio', Number(e.target.value))}
            className="slider-coffee"
          />
          <div className="flex justify-between text-xs text-coffee-400 mt-1">
            <span>1:10</span><span>1:20</span>
          </div>
        </div>

        {/* Brew Time */}
        <div>
          <label className="block text-sm font-medium text-coffee-700 mb-1.5">冲煮时间</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={59}
              value={form.brewMinutes}
              onChange={(e) => updateField('brewMinutes', Math.max(0, Math.min(59, Number(e.target.value) || 0)))}
              className="w-20 px-3 py-2 rounded-lg border border-coffee-200 bg-white text-coffee-900 text-center focus:outline-none focus:ring-2 focus:ring-amber/50 focus:border-amber transition-colors"
              aria-label="分钟"
            />
            <span className="text-coffee-500 font-medium">:</span>
            <input
              type="number"
              min={0}
              max={59}
              value={form.brewSeconds}
              onChange={(e) => updateField('brewSeconds', Math.max(0, Math.min(59, Number(e.target.value) || 0)))}
              className="w-20 px-3 py-2 rounded-lg border border-coffee-200 bg-white text-coffee-900 text-center focus:outline-none focus:ring-2 focus:ring-amber/50 focus:border-amber transition-colors"
              aria-label="秒"
            />
          </div>
        </div>

        {/* Star Rating */}
        <div>
          <label className="block text-sm font-medium text-coffee-700 mb-1.5">
            评分 <span className="text-red-500">*</span>
          </label>
          <StarRating
            rating={form.rating}
            onChange={(r) => {
              updateField('rating', r);
              markTouched('rating');
            }}
          />
          {touched.rating && validation.rating && (
            <p className="mt-1 text-xs text-red-500">{validation.rating}</p>
          )}
        </div>

        {/* Flavor Tags */}
        <div>
          <label className="block text-sm font-medium text-coffee-700 mb-1.5">风味标签</label>
          <FlavorTags
            selected={form.flavorTags}
            onChange={(tags) => updateField('flavorTags', tags)}
          />
        </div>

        {/* Custom Description */}
        <div>
          <label className="block text-sm font-medium text-coffee-700 mb-1.5">自定义描述</label>
          <textarea
            value={form.customDescription}
            onChange={(e) => updateField('customDescription', e.target.value)}
            rows={3}
            placeholder="描述这次冲煮的风味感受..."
            className="w-full px-3 py-2.5 rounded-lg border border-coffee-200 bg-white text-coffee-900 placeholder:text-coffee-300 focus:outline-none focus:ring-2 focus:ring-amber/50 focus:border-amber transition-colors resize-none text-sm"
          />
        </div>

        {/* Submit */}
        <button
          ref={rippleRef}
          type="button"
          onClick={handleSubmit}
          className="relative w-full py-3 bg-amber hover:bg-amber-dark text-coffee-900 font-bold rounded-xl
            transition-all duration-200 shadow-md hover:shadow-lg
            focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-dark focus-visible:ring-offset-2
            overflow-hidden active:scale-[0.98]"
        >
          <span className="relative z-10">保存记录</span>
        </button>
      </div>
    </div>
  );
}
