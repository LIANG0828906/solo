import { useState, useMemo } from 'react';
import { useFootprintStore, Categories, CategoryItem } from '../store/footprintStore';

export default function ActivityPanel() {
  const { categories, currentUser, addActivity, activities } = useFootprintStore();
  const [category, setCategory] = useState<keyof Categories>('transport');
  const [subcategory, setSubcategory] = useState('');
  const [value, setValue] = useState('');

  const categoryData = categories?.[category];
  const items: CategoryItem[] = categoryData?.items ?? [];
  const selectedItem = items.find((i) => i.id === subcategory);

  const emission = useMemo(() => {
    if (!selectedItem || !value) return 0;
    return parseFloat((selectedItem.factor * parseFloat(value)).toFixed(3));
  }, [selectedItem, value]);

  const handleSubmit = () => {
    if (!currentUser || !selectedItem || !value) return;
    addActivity({
      userId: currentUser.id,
      category,
      subcategory: selectedItem.id,
      value: parseFloat(value),
      unit: selectedItem.unit,
      emission,
    });
    setValue('');
    setSubcategory('');
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value as keyof Categories);
    setSubcategory('');
    setValue('');
  };

  const recentActivities = activities.slice(-5).reverse();

  const categoryEmoji: Record<string, string> = {
    transport: '🚗',
    food: '🍽️',
    electricity: '⚡',
  };

  return (
    <div>
      <div className="card">
        <h2 className="section-title">📋 记录活动</h2>

        <div className="form-group">
          <label className="form-label">活动类别</label>
          <select className="form-select" value={category} onChange={handleCategoryChange}>
            {categories && Object.entries(categories).map(([key, cat]) => (
              <option key={key} value={key}>
                {categoryEmoji[key] ?? ''} {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">具体项目</label>
          <select
            className="form-select"
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
          >
            <option value="">请选择...</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}（{item.factor} kg CO2/{item.unit}）
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">
            数值{selectedItem ? `（${selectedItem.unit}）` : ''}
          </label>
          <input
            className="form-input"
            type="number"
            min="0"
            step="0.1"
            placeholder={selectedItem ? `输入${selectedItem.unit}数` : '请先选择项目'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={!subcategory}
          />
        </div>

        {emission > 0 && (
          <div className="emission-preview">
            预估碳排放：
            <span className="emission-value">{emission}</span>
            <span className="emission-unit">kg CO2</span>
          </div>
        )}
        {selectedItem && selectedItem.factor === 0 && value && (
          <div className="emission-preview" style={{ background: '#C8E6C9' }}>
            🎉 零排放！绿色出行！
          </div>
        )}

        <button
          className="btn btn-primary"
          style={{ width: '100%', marginTop: 8 }}
          onClick={handleSubmit}
          disabled={!subcategory || !value}
        >
          提交记录
        </button>
      </div>

      {recentActivities.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <h3 className="section-title">🕐 最近记录</h3>
          <div className="activity-list">
            {recentActivities.map((a) => (
              <div key={a.id} className="activity-item">
                <div className="activity-item-left">
                  <span>{categoryEmoji[a.category] ?? '📌'}</span>
                  <span>
                    {categories?.[a.category as keyof Categories]?.items.find(
                      (i) => i.id === a.subcategory,
                    )?.label ?? a.subcategory}
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {a.value} {a.unit}
                  </span>
                </div>
                <div className="activity-item-right">
                  {a.emission} kg CO2
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
