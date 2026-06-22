import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import type { Category, BillingCycle } from '@/utils/dateUtils';
import { CATEGORY_EMOJIS } from '@/utils/dateUtils';

interface FormErrors {
  name?: string;
  monthlyFee?: string;
  startDate?: string;
}

export default function AddSubscription() {
  const navigate = useNavigate();
  const { addSubscription, triggerNotification } = useSubscriptionStore();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('entertainment');
  const [monthlyFee, setMonthlyFee] = useState('');
  const [startDate, setStartDate] = useState('');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [errors, setErrors] = useState<FormErrors>({});
  const [shake, setShake] = useState(false);

  const categoryOptions: { value: Category; label: string }[] = [
    { value: 'entertainment', label: '娱乐' },
    { value: 'office', label: '办公' },
    { value: 'cloud', label: '云服务' },
    { value: 'music', label: '音乐' },
    { value: 'other', label: '其他' },
  ];

  const cycleOptions: { value: BillingCycle; label: string }[] = [
    { value: 'monthly', label: '月付' },
    { value: 'yearly', label: '年付' },
  ];

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = '请输入服务名称';
    }

    const fee = parseFloat(monthlyFee);
    if (!monthlyFee || isNaN(fee) || fee <= 0) {
      newErrors.monthlyFee = '请输入有效的费用金额';
    }

    if (!startDate) {
      newErrors.startDate = '请选择开始日期';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    addSubscription({
      name: name.trim(),
      category,
      monthlyFee: parseFloat(monthlyFee),
      startDate,
      billingCycle,
      emoji: CATEGORY_EMOJIS[category],
    });

    triggerNotification('订阅添加成功');
    navigate('/');
  };

  return (
    <div className="add-page">
      <header className="add-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={20} /> 返回
        </button>
        <h1 className="add-title">添加订阅</h1>
      </header>

      <form className={`add-form ${shake ? 'shake' : ''}`} onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">服务名称</label>
          <input
            type="text"
            className={`form-input ${errors.name ? 'has-error' : ''}`}
            placeholder="例如：Netflix"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {errors.name && <span className="form-error">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">类别</label>
          <select
            className="form-select"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
          >
            {categoryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {CATEGORY_EMOJIS[opt.value]} {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">月费金额（元）</label>
          <input
            type="number"
            className={`form-input ${errors.monthlyFee ? 'has-error' : ''}`}
            placeholder="例如：25.00"
            value={monthlyFee}
            onChange={(e) => setMonthlyFee(e.target.value)}
            step="0.01"
            min="0"
          />
          {errors.monthlyFee && <span className="form-error">{errors.monthlyFee}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">首次开始日期</label>
          <input
            type="date"
            className={`form-input ${errors.startDate ? 'has-error' : ''}`}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          {errors.startDate && <span className="form-error">{errors.startDate}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">续费周期</label>
          <select
            className="form-select"
            value={billingCycle}
            onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
          >
            {cycleOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className="form-hint">年付选项请输入年费总额，系统会自动折算月均费用</span>
        </div>

        <button type="submit" className="submit-btn">
          添加订阅
        </button>
      </form>
    </div>
  );
}
