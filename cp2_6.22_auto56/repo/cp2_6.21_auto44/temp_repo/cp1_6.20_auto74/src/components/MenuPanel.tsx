import { useState, useRef } from 'react';
import type { MenuItem, DrinkCategory, MenuItemType } from '../types';

interface MenuPanelProps {
  menu: MenuItem[];
  onMenuChange: () => void;
}

const createRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
  const button = e.currentTarget;
  const ripple = document.createElement('span');
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top - size / 2;
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = x + 'px';
  ripple.style.top = y + 'px';
  ripple.className = 'ripple';
  button.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
};

const MenuPanel = ({ menu, onMenuChange }: MenuPanelProps) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [itemType, setItemType] = useState<MenuItemType>('drink');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<DrinkCategory>('coffee');
  const [hasGluten, setHasGluten] = useState(false);
  const [newItemId, setNewItemId] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const resetForm = () => {
    setEditingId(null);
    setItemType('drink');
    setName('');
    setPrice('');
    setCategory('coffee');
    setHasGluten(false);
  };

  const handleAdd = () => {
    resetForm();
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setItemType(item.type);
    setName(item.name);
    setPrice(String(item.price));
    setCategory(item.category || 'coffee');
    setHasGluten(item.hasGluten || false);
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) return;

    const payload: Record<string, unknown> = {
      name: name.trim(),
      price: Number(price),
      type: itemType
    };

    if (itemType === 'drink') {
      payload.category = category;
    } else {
      payload.hasGluten = hasGluten;
    }

    try {
      if (editingId) {
        await fetch(`/api/menu/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        const res = await fetch('/api/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        setNewItemId(data.id);
        setTimeout(() => setNewItemId(null), 800);
      }
      onMenuChange();
      resetForm();
      setShowForm(false);
    } catch (err) {
      console.error('保存菜单项失败', err);
    }
  };

  const handleToggleAvailable = async (item: MenuItem) => {
    try {
      await fetch(`/api/menu/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: !item.available })
      });
      onMenuChange();
    } catch (err) {
      console.error('更新状态失败', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个菜单项吗？')) return;
    try {
      await fetch(`/api/menu/${id}`, { method: 'DELETE' });
      onMenuChange();
    } catch (err) {
      console.error('删除失败', err);
    }
  };

  const drinks = menu.filter((m) => m.type === 'drink');
  const desserts = menu.filter((m) => m.type === 'dessert');

  const categoryLabel: Record<DrinkCategory, string> = {
    coffee: '☕ 咖啡',
    tea: '🍵 茶饮',
    special: '✨ 特调'
  };

  return (
    <div
      style={{
        backgroundColor: '#E8D5B7',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 4px 12px rgba(139, 94, 60, 0.15)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ color: '#6B4226', fontSize: '22px', fontWeight: 700 }}>📋 菜单管理</h2>
        {!showForm && (
          <button
            onClick={(e) => {
              createRipple(e);
              handleAdd();
            }}
            className="ripple-effect"
            style={{
              backgroundColor: '#8B5E3C',
              color: '#FFF8F0',
              border: 'none',
              padding: '8px 20px',
              borderRadius: '20px',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '14px',
              boxShadow: '0 2px 8px rgba(139, 94, 60, 0.3)',
              transition: 'transform 0.2s ease'
            }}
          >
            + 添加新品
          </button>
        )}
      </div>

      {showForm && (
        <div
          ref={formRef}
          style={{
            backgroundColor: '#FFF8F0',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '16px',
            animation: 'fadeInUp 0.3s ease'
          }}
        >
          <h3 style={{ color: '#6B4226', marginBottom: '12px', fontSize: '16px' }}>
            {editingId ? '✏️ 编辑菜品' : '➕ 新增菜品'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  checked={itemType === 'drink'}
                  onChange={() => setItemType('drink')}
                  style={{ accentColor: '#8B5E3C' }}
                />
                <span style={{ fontWeight: 600 }}>🥤 饮品</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  checked={itemType === 'dessert'}
                  onChange={() => setItemType('dessert')}
                  style={{ accentColor: '#8B5E3C' }}
                />
                <span style={{ fontWeight: 600 }}>🍰 甜品</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#6D4C41' }}>名称</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="请输入名称"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '2px solid #D7C4A5',
                    borderRadius: '8px',
                    outline: 'none',
                    fontSize: '14px',
                    backgroundColor: '#FFFBF5',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#8B5E3C')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#D7C4A5')}
                />
              </div>
              <div style={{ width: '120px' }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#6D4C41' }}>价格</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.5"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '2px solid #D7C4A5',
                    borderRadius: '8px',
                    outline: 'none',
                    fontSize: '14px',
                    backgroundColor: '#FFFBF5',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#8B5E3C')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#D7C4A5')}
                />
              </div>
            </div>

            {itemType === 'drink' ? (
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: '#6D4C41' }}>类别</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['coffee', 'tea', 'special'] as DrinkCategory[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className="ripple-effect"
                      style={{
                        padding: '6px 14px',
                        borderRadius: '16px',
                        border: category === c ? '2px solid #8B5E3C' : '2px solid #D7C4A5',
                        backgroundColor: category === c ? '#8B5E3C' : 'transparent',
                        color: category === c ? '#FFF8F0' : '#6D4C41',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '13px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {categoryLabel[c]}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={hasGluten}
                    onChange={(e) => setHasGluten(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#8B5E3C' }}
                  />
                  <span style={{ fontWeight: 600 }}>🌾 含麸质</span>
                </label>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={(e) => {
                  createRipple(e);
                  resetForm();
                  setShowForm(false);
                }}
                className="ripple-effect"
                style={{
                  padding: '8px 20px',
                  borderRadius: '20px',
                  border: '2px solid #D7C4A5',
                  backgroundColor: 'transparent',
                  color: '#6D4C41',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '14px'
                }}
              >
                取消
              </button>
              <button
                type="submit"
                onClick={createRipple}
                className="ripple-effect"
                style={{
                  padding: '8px 20px',
                  borderRadius: '20px',
                  border: 'none',
                  backgroundColor: '#8B5E3C',
                  color: '#FFF8F0',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '14px',
                  boxShadow: '0 2px 8px rgba(139, 94, 60, 0.3)'
                }}
              >
                {editingId ? '保存修改' : '确认添加'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ color: '#6B4226', fontSize: '16px', marginBottom: '10px' }}>🥤 饮品</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
          {drinks.length === 0 && (
            <p style={{ gridColumn: '1/-1', color: '#8B7355', textAlign: 'center', padding: '12px' }}>暂无饮品</p>
          )}
          {drinks.map((item) => (
            <div
              key={item.id}
              style={{
                backgroundColor: item.available ? '#FFFBF5' : '#E0D0B5',
                borderRadius: '12px',
                padding: '12px',
                boxShadow: '0 2px 6px rgba(139, 94, 60, 0.12)',
                opacity: item.available ? 1 : 0.6,
                animation: newItemId === item.id ? 'fadeInUp 0.6s ease' : undefined,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 94, 60, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(139, 94, 60, 0.12)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#4A3728', fontSize: '15px' }}>{item.name}</div>
                  <div style={{ fontSize: '12px', color: '#8B7355' }}>{categoryLabel[item.category || 'coffee']}</div>
                </div>
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#D2691E',
                    textShadow: '1px 1px 2px rgba(210, 105, 30, 0.15)'
                  }}
                >
                  ¥{item.price}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                <button
                  onClick={(e) => {
                    createRipple(e);
                    handleEdit(item);
                  }}
                  className="ripple-effect"
                  style={{
                    flex: 1,
                    padding: '4px 8px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#A1887F',
                    color: '#FFF',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  编辑
                </button>
                <button
                  onClick={(e) => {
                    createRipple(e);
                    handleToggleAvailable(item);
                  }}
                  className="ripple-effect"
                  style={{
                    flex: 1,
                    padding: '4px 8px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: item.available ? '#66BB6A' : '#EF5350',
                    color: '#FFF',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  {item.available ? '上架中' : '已下架'}
                </button>
                <button
                  onClick={(e) => {
                    createRipple(e);
                    handleDelete(item.id);
                  }}
                  className="ripple-effect"
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#E57373',
                    color: '#FFF',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 style={{ color: '#6B4226', fontSize: '16px', marginBottom: '10px' }}>🍰 甜品</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
          {desserts.length === 0 && (
            <p style={{ gridColumn: '1/-1', color: '#8B7355', textAlign: 'center', padding: '12px' }}>暂无甜品</p>
          )}
          {desserts.map((item) => (
            <div
              key={item.id}
              style={{
                backgroundColor: item.available ? '#FFFBF5' : '#E0D0B5',
                borderRadius: '12px',
                padding: '12px',
                boxShadow: '0 2px 6px rgba(139, 94, 60, 0.12)',
                opacity: item.available ? 1 : 0.6,
                animation: newItemId === item.id ? 'fadeInUp 0.6s ease' : undefined,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 94, 60, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(139, 94, 60, 0.12)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#4A3728', fontSize: '15px' }}>{item.name}</div>
                  <div style={{ fontSize: '12px', color: '#8B7355' }}>
                    {item.hasGluten ? '🌾 含麸质' : '✅ 无麸质'}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#D2691E',
                    textShadow: '1px 1px 2px rgba(210, 105, 30, 0.15)'
                  }}
                >
                  ¥{item.price}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                <button
                  onClick={(e) => {
                    createRipple(e);
                    handleEdit(item);
                  }}
                  className="ripple-effect"
                  style={{
                    flex: 1,
                    padding: '4px 8px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#A1887F',
                    color: '#FFF',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  编辑
                </button>
                <button
                  onClick={(e) => {
                    createRipple(e);
                    handleToggleAvailable(item);
                  }}
                  className="ripple-effect"
                  style={{
                    flex: 1,
                    padding: '4px 8px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: item.available ? '#66BB6A' : '#EF5350',
                    color: '#FFF',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  {item.available ? '上架中' : '已下架'}
                </button>
                <button
                  onClick={(e) => {
                    createRipple(e);
                    handleDelete(item.id);
                  }}
                  className="ripple-effect"
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#E57373',
                    color: '#FFF',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MenuPanel;
