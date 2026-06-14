import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
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
  discountType: 'percentage',
  discountValue: '',
  startDate: '',
  endDate: '',
  applicableItems: [],
};

function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function isExpired(endDate: string): boolean {
  return new Date(endDate) < new Date();
}

export default function PromotionManager() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

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

    const submitData: Omit<Promotion, 'id'> = {
      ...formData,
      discountValue: parseFloat(formData.discountValue),
      isActive: true,
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

  const handleItemChange = (itemId: string) => {
    const currentItems = formData.applicableItems;
    const newItems = currentItems.includes(itemId)
      ? currentItems.filter((id) => id !== itemId)
      : [...currentItems, itemId];
    setFormData({ ...formData, applicableItems: newItems });
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
          gap: 20,
          animation: 'fadeIn 0.3s ease',
        }}
      >
        {promotions.map((promotion) => {
          const expired = isExpired(promotion.endDate);
          const daysRemaining = getDaysRemaining(promotion.endDate);

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
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4, color: '#1e293b' }}>
                    {promotion.name}
                  </h3>
                  <span
                    style={{
                      fontSize: 14,
                      color: '#3b82f6',
                      fontWeight: 600,
                    }}
                  >
                    {promotion.discountType === 'fixed'
                      ? `减 ¥${promotion.discountValue}`
                      : `${promotion.discountValue}% 折扣`}
                  </span>
                </div>

                <div
                  style={{
                    position: 'relative',
                    width: 44,
                    height: 24,
                    backgroundColor: expired ? '#d1d5db' : promotion.isActive ? '#3b82f6' : '#d1d5db',
                    borderRadius: 12,
                    transition: 'background-color 0.3s ease',
                    cursor: expired ? 'not-allowed' : 'pointer',
                    opacity: expired ? 0.5 : 1,
                  }}
                  onClick={() => !expired && handleToggle(promotion.id)}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 2,
                      left: !expired && promotion.isActive ? 22 : 2,
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

              <div style={{ marginBottom: 8, fontSize: 13, color: '#64748b' }}>
                <div style={{ marginBottom: 4 }}>
                  开始日期: {new Date(promotion.startDate).toLocaleDateString('zh-CN')}
                </div>
                <div>
                  结束日期: {new Date(promotion.endDate).toLocaleDateString('zh-CN')}
                </div>
              </div>

              {!expired && daysRemaining <= 7 && daysRemaining > 0 && (
                <div style={{ color: '#ef4444', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                  剩余 {daysRemaining} 天
                </div>
              )}

              {expired && (
                <div style={{ color: '#94a3b8', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>
                  活动已过期
                </div>
              )}

              <div style={{ fontSize: 12, color: '#94a3b8' }}>
                适用菜品: {promotion.applicableItems.length === 0
                  ? '全部菜品'
                  : promotion.applicableItems
                      .map(
                        (id) => menuItems.find((item) => item.id === id)?.name || id
                      )
                      .join(', ')}
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
                style={{
                  padding: 4,
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
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
                      value="percentage"
                      checked={formData.discountType === 'percentage'}
                      onChange={() => set