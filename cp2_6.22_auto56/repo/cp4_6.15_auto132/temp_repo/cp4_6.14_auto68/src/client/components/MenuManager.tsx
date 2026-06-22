import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { menuApi, type MenuItem } from '../api';

const categories: MenuItem['category'][] = ['主菜', '小食', '甜品', '饮品'];

const categoryIcons: Record<MenuItem['category'], string> = {
  '主菜': '🍲',
  '小食': '🍟',
  '甜品': '🍰',
  '饮品': '🥤',
};

interface FormData {
  name: string;
  category: MenuItem['category'];
  price: string;
  description: string;
  isRecommended: boolean;
}

const initialFormData: FormData = {
  name: '',
  category: '主菜',
  price: '',
  description: '',
  isRecommended: false,
};

export default function MenuManager() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const res = await menuApi.getAll();
      setMenuItems(res.data);
    } catch (error) {
      console.error('Failed to fetch menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name || formData.name.length < 2 || formData.name.length > 30) {
      newErrors.name = '名称长度必须在2-30字符之间';
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price < 0.01 || price > 999.99) {
      newErrors.price = '价格必须在0.01-999.99之间';
    }

    if (formData.description.length > 200) {
      newErrors.description = '描述最多200字';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const submitData = {
      ...formData,
      price: parseFloat(formData.price),
      icon: categoryIcons[formData.category],
    };

    try {
      if (editingItem) {
        await menuApi.update(editingItem.id, submitData);
      } else {
        await menuApi.create(submitData);
      }
      await fetchMenu();
      closeForm();
    } catch (error) {
      console.error('Failed to save menu item:', error);
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price.toString(),
      description: item.description,
      isRecommended: item.isRecommended,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个菜品吗？')) return;

    try {
      await menuApi.delete(id);
      await fetchMenu();
    } catch (error) {
      console.error('Failed to delete menu item:', error);
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData(initialFormData);
    setErrors({});
  };

  if (loading) {
    return <div style={{ padding: 32 }}>加载中...</div>;
  }

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#1e293b' }}>菜品管理</h1>
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
          添加菜品
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 200px)',
          gap: 24,
          animation: 'fadeIn 0.3s ease',
        }}
      >
        {menuItems.map((item) => (
          <div
            key={item.id}
            style={{
              width: 200,
              height: 300,
              backgroundColor: '#ffffff',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              position: 'relative',
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#3b82f6';
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {item.isRecommended && (
              <span
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  fontSize: 18,
                  color: '#fbbf24',
                }}
              >
                ★
              </span>
            )}

            <div
              style={{
                width: '100%',
                height: 120,
                backgroundColor: '#f1f5f9',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 48,
                marginBottom: 12,
              }}
            >
              {item.icon}
            </div>

            <h3 style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4, color: '#1e293b' }}>
              {item.name}
            </h3>

            <span style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
              {item.category}
            </span>

            <p
              style={{
                fontSize: 12,
                color: '#64748b',
                marginBottom: 8,
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {item.description}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 18, fontWeight: 'bold', color: '#ef4444' }}>
                ¥{item.price.toFixed(2)}
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  onClick={() => handleEdit(item)}
                  style={{
                    padding: 6,
                    backgroundColor: '#e2e8f0',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    transition: 'filter 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(0.95)')}
                  onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  style={{
                    padding: 6,
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    transition: 'filter 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(0.95)')}
                  onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
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
              width: 450,
              maxHeight: '90vh',
              overflowY: 'auto',
              animation: 'fadeIn 0.3s ease',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 'bold' }}>
                {editingItem ? '编辑菜品' : '添加菜品'}
              </h2>
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
                  菜品名称 <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${errors.name ? '#ef4444' : '#e2e8f0'}`,
                    borderRadius: 8,
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                  placeholder="请输入菜品名称（2-30字符）"
                />
                {errors.name && (
                  <span style={{ fontSize: 12, color: '#ef4444', marginTop: 4, display: 'block' }}>
                    {errors.name as string}
                  </span>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 14, marginBottom: 6, fontWeight: 500 }}>
                  类别 <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as MenuItem['category'] })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 14, marginBottom: 6, fontWeight: 500 }}>
                  价格（元） <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${errors.price ? '#ef4444' : '#e2e8f0'}`,
                    borderRadius: 8,
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                  placeholder="0.01-999.99"
                />
                {errors.price && (
                  <span style={{ fontSize: 12, color: '#ef4444', marginTop: 4, display: 'block' }}>
                    {errors.price as string}
                  </span>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 14, marginBottom: 6, fontWeight: 500 }}>
                  描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${errors.description ? '#ef4444' : '#e2e8f0'}`,
                    borderRadius: 8,
                    fontSize: 14,
                    boxSizing: 'border-box',
                    resize: 'none',
                  }}
                  placeholder="最多200字"
                />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  {errors.description && (
                    <span style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>
                      {errors.description as string}
                    </span>
                  )}
                  <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 'auto', marginTop: 4 }}>
                    {formData.description.length}/200
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>设为推荐</span>
                  <div
                    style={{
                      position: 'relative',
                      width: 44,
                      height: 24,
                      backgroundColor: formData.isRecommended ? '#3b82f6' : '#d1d5db',
                      borderRadius: 12,
                      transition: 'background-color 0.3s ease',
                    }}
                    onClick={() => setFormData({ ...formData, isRecommended: !formData.isRecommended })}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: 2,
                        left: formData.isRecommended ? 22 : 2,
                        width: 20,
                        height: 20,
                        backgroundColor: '#ffffff',
                        borderRadius: '50%',
                        transition: 'left 0.3s ease',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                      }}
                    />
                  </div>
                </label>
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
                  {editingItem ? '保存' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
