import { useState, useEffect } from 'react';
import { Plus, X, Calendar } from 'lucide-react';
import { promotionApi, menuApi, type Promotion, type MenuItem } from '../api';

interface FormData {
  name: string;
  discountType: 'fixed' | 'percentage';
  discountValue: string;
  startDate: string;
  endDate: string;
  applicableItems: string[];
}

const initialFormData: FormData = {
  name: '',
  discountType: 'fixed',
  discountValue: '',
  startDate: '',
  endDate: '',
  applicableItems: [],
};

function getRemainingDays(endDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function isExpired(endDate: string): boolean {
  return getRemainingDays(endDate) < 0;
}

export default function PromotionManager() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [promotionsRes, menuRes] = await Promise.all([
        promotionApi.getAll(),
        menuApi.getAll(),
      ]);
      setPromotions(promotionsRes.data);
      setMenuItems(menuRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      ...formData,
      discountValue: parseFloat(formData.discountValue),
    };

    try {
      await promotionApi.create(submitData);
      await fetchData();
      closeForm();
    } catch (error) {
      console.error('Failed to create promotion:', error);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await promotionApi.toggle(id);
      await fetchData();
    } catch (error) {
      console.error('Failed to toggle promotion:', error);
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setFormData(initialFormData);
  };

  const handleApplicableItemChange = (menuId: string) => {
    setFormData((prev) => {
      if (prev.applicableItems.includes(menuId)) {
        return {
          ...prev,
          applicableItems: prev.applicableItems.filter((id) => id !== menuId),
        };
      } else {
        return {
          ...prev,
          applicableItems: [...prev.applicableItems, menuId],
        };
      }
    });
  };

  if (loading) {
    return <div style={{ padding: 32 }}>加载中...</div>;
  }

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#1e293b' }}>优惠活动管理</h1>
        <button
          onClick={() => setShowForm(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 16px',
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            cursor: 'pointer',
            transition: 'filter 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
        >
          <Plus size={16} />
          创建活动
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24,
          animation: 'fadeIn 0.3s ease',
        }}
      >
        {promotions.map((promotion) => {
          const expired = isExpired(promotion.endDate);
          const remainingDays = getRemainingDays(promotion.endDate);

          return (
            <div
              key={promotion.id}
              style={{
                backgroundColor: expired ? '#f1f5f9' : '#ffffff',
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                padding: 20,
                opacity: expired ? 0.5 : 1,
                transition: 'all 0.3s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
                  {promotion.name}
                </h3>
                <div
                  onClick={() => !expired && handleToggle(promotion.id)}
                  style={{
                    position: 'relative',
                    width: 44,
                    height: 24,
                    backgroundColor: expired ? '#d1d5db' : promotion.isActive ? '#3b82f6' : '#d1d5db',
                    borderRadius: 12,
                    transition: 'background-color 0.3s ease',
                    cursor: expired ? 'not-allowed' : 'pointer',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 2,
                      left: expired ? 2 : promotion.isActive ? 22 : 2,
                      width: 20,
                      height: 20,
                      backgroundColor: '#ffffff',
                      borderRadius: '50%',
                      transition: 'left 0.3s ease',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 14, color: '#64748b' }}>优惠类型：</span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>
                  {promotion.discountType === 'fixed'
                    ? `立减 ¥${promotion.discountValue}`
                    : `${promotion.discountValue}% 折扣`}
                </span>
              </div>

              <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={14} style={{ color: '#64748b' }} />
                <span style={{ fontSize: 13, color: '#64748b' }}>
                  {new Date(promotion.startDate).toLocaleDateString('zh-CN')} ~{' '}
                  {new Date(promotion.endDate).toLocaleDateString('zh-CN')}
                </span>
              </div>

              <div style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>适用菜品：</span>
                <span style={{ fontSize: 13 }}>
                  {promotion.applicableItems.length === 0
                    ? '全部菜品'
                    : promotion.applicableItems
                        .map(
                          (id) => menuItems.find((item) => item.id === id)?.name || id
                        )
                        .join('、')}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>
                  状态：
                  <span style={{ color: expired ? '#9ca3af' : promotion.isActive ? '#22c55e' : '#9ca3af' }}>
                    {expired ? '已过期' : promotion.isActive ? '已启用' : '已停用'}
                  </span>
                </span>
                {!expired && (
                  <span style={{ fontSize: 16, color: '#ef4444', fontWeight: 500 }}>
                    剩余 {remainingDays} 天
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={closeForm}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 12,
              padding: 24,
              width: 500,
              maxHeight: '90vh',
              overflowY: 'auto',
              animation: 'fadeIn 0.3s ease',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 'bold' }}>创建优惠活动</h2>
              <button
                onClick={closeForm}
                style={{ padding: 4, backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 14, marginBottom: 6, fontWeight: 500 }}>
                  活动名称 <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                  placeholder="请输入活动名称"
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 14, marginBottom: 6, fontWeight: 500 }}>
                  折扣类型 <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: 16 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="discountType"
                      value="fixed"
                      checked={formData.discountType === 'fixed'}
                      onChange={(e) =>
                        setFormData({ ...formData, discountType: e.target.value as 'fixed' | 'percentage' })
                      }
                    />
                    <span style={{ fontSize: 14 }}>固定金额</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="discountType"
                      value="percentage"
                      checked={formData.discountType === 'percentage'}
                      onChange={(e) =>
                        setFormData({ ...formData, discountType: e.target.value as 'fixed' | 'percentage' })
                      }
                    />
                    <span style={{ fontSize: 14 }}>百分比</span>
                  </label>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 14, marginBottom: 6, fontWeight: 500 }}>
                  折扣值 <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                  placeholder={formData.discountType === 'fixed' ? '请输入减免金额（元）' : '请输入折扣比例（%）'}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 14, marginBottom: 6, fontWeight: 500 }}>
                  开始日期 <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 14, marginBottom: 6, fontWeight: 500 }}>
                  结束日期 <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 14, marginBottom: 6, fontWeight: 500 }}>
                  适用菜品（不选则为全部）
                </label>
                <div
                  style={{
                    maxHeight: 150,
                    overflowY: 'auto',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    padding: 8,
                  }}
                >
                  {menuItems.map((item) => (
                    <label
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 8px',
                        cursor: 'pointer',
                        borderRadius: 4,
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <input
                        type="checkbox"
                        checked={formData.applicableItems.includes(item.id)}
                        onChange={() => handleApplicableItemChange(item.id)}
                      />
                      <span style={{ fontSize: 14 }}>{item.name}</span>
                      <span style={{ fontSize: 12, color: '#64748b', marginLeft: 'auto' }}>
                        {item.category}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={closeForm}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#e2e8f0',
                    color: '#1e293b',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 14,
                    cursor: 'pointer',
                    transition: 'filter 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(0.95)')}
                  onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
                >
                  取消
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#3b82f6',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 14,
                    cursor: 'pointer',
                    transition: 'filter 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.05)')}
                  onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
                >
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
