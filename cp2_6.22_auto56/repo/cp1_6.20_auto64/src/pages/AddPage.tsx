import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addItem, Category, Unit } from '@/api';

interface FormData {
  name: string;
  category: Category;
  quantity: string;
  unit: Unit;
  purchaseDate: string;
  shelfLifeDays: string;
}

interface FormErrors {
  name?: string;
  category?: string;
  quantity?: string;
  unit?: string;
  purchaseDate?: string;
  shelfLifeDays?: string;
}

const CATEGORIES: Category[] = ['蔬菜', '水果', '肉类', '乳制品', '调料'];
const UNITS: Unit[] = ['克', '个', '盒'];

const today = new Date().toISOString().split('T')[0];

const AddPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    category: '蔬菜',
    quantity: '',
    unit: '个',
    purchaseDate: today,
    shelfLifeDays: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = '请输入食材名称';
    }
    if (!formData.category) {
      newErrors.category = '请选择分类';
    }
    const qtyNum = Number(formData.quantity);
    if (!formData.quantity || isNaN(qtyNum) || qtyNum <= 0) {
      newErrors.quantity = '请输入有效的数量';
    }
    if (!formData.unit) {
      newErrors.unit = '请选择单位';
    }
    if (!formData.purchaseDate) {
      newErrors.purchaseDate = '请选择购买日期';
    }
    const daysNum = Number(formData.shelfLifeDays);
    if (!formData.shelfLifeDays || isNaN(daysNum) || daysNum <= 0 || !Number.isInteger(daysNum)) {
      newErrors.shelfLifeDays = '请输入有效的保质天数';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await addItem({
        name: formData.name.trim(),
        category: formData.category,
        quantity: Number(formData.quantity),
        unit: formData.unit,
        purchaseDate: formData.purchaseDate,
        shelfLifeDays: Number(formData.shelfLifeDays),
      });
      showToast('✅ 添加成功！', 'success');
      setTimeout(() => navigate('/'), 800);
    } catch (error) {
      showToast('❌ 添加失败，请重试', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  return (
    <div>
      <div className="form-container">
        <h2 className="form-title">➕ 录入食材</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">食材名称</label>
            <input
              type="text"
              className="form-input"
              placeholder="例如：西红柿、鸡蛋、牛肉"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
            />
            {errors.name && <div className="form-error">{errors.name}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">分类</label>
            <select
              className="form-select"
              value={formData.category}
              onChange={(e) => updateField('category', e.target.value as Category)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.category && <div className="form-error">{errors.category}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">数量</label>
            <div className="form-row">
              <div>
                <input
                  type="number"
                  className="form-input"
                  placeholder="数量"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => updateField('quantity', e.target.value)}
                />
                {errors.quantity && <div className="form-error">{errors.quantity}</div>}
              </div>
              <select
                className="form-select"
                value={formData.unit}
                onChange={(e) => updateField('unit', e.target.value as Unit)}
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">购买日期</label>
            <input
              type="date"
              className="form-input"
              value={formData.purchaseDate}
              onChange={(e) => updateField('purchaseDate', e.target.value)}
              max={today}
            />
            {errors.purchaseDate && (
              <div className="form-error">{errors.purchaseDate}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">保质天数</label>
            <input
              type="number"
              className="form-input"
              placeholder="例如：7（表示7天内过期）"
              min="1"
              value={formData.shelfLifeDays}
              onChange={(e) => updateField('shelfLifeDays', e.target.value)}
            />
            {errors.shelfLifeDays && (
              <div className="form-error">{errors.shelfLifeDays}</div>
            )}
          </div>

          <button type="submit" className="form-submit" disabled={loading}>
            {loading ? '提交中...' : '✅ 确认添加'}
          </button>
        </form>
      </div>

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default AddPage;
