import { useState } from 'react';
import { useRecipeStore } from '@/store/recipeStore';
import type { PantryItem } from '@/types';

const panelStyle: React.CSSProperties = {
  width: 280,
  background: 'var(--bg-sidebar)',
  borderRadius: 'var(--radius-md)',
  padding: 20,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  maxHeight: 'calc(100vh - 120px)',
  overflow: 'auto'
};

const itemStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 'var(--radius-sm)',
  padding: '10px 12px',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  border: '1px solid rgba(212, 163, 115, 0.3)'
};

const qtyBtnStyle: React.CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: '50%',
  background: '#fff',
  border: '1px solid var(--border-color)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  flexShrink: 0
};

const addBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 16px',
  background: 'var(--accent)',
  color: '#fff',
  borderRadius: 'var(--radius-sm)',
  fontSize: 14,
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6
};

export default function PantryPanel() {
  const pantry = useRecipeStore(state => state.pantry);
  const addPantryItem = useRecipeStore(state => state.addPantryItem);
  const updatePantryItem = useRecipeStore(state => state.updatePantryItem);
  const deletePantryItem = useRecipeStore(state => state.deletePantryItem);

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('克');

  const handleAdd = () => {
    if (!name.trim() || !quantity) return;
    addPantryItem({ name: name.trim(), quantity: parseFloat(quantity), unit });
    setName('');
    setQuantity('');
    setShowAdd(false);
  };

  const adjustQty = (item: PantryItem, delta: number) => {
    const newQty = Math.max(0, item.quantity + delta);
    updatePantryItem(item.id, { quantity: newQty });
  };

  return (
    <aside style={panelStyle}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
        🥖 我的食材库存
      </h2>

      {pantry.length === 0 ? (
        <p style={{ fontSize: 14, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
          暂无食材，点击下方添加
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pantry.map(item => (
            <div key={item.id} style={itemStyle} className="fade-in">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {item.quantity} {item.unit}
                </div>
              </div>
              <button
                style={qtyBtnStyle}
                onClick={() => adjustQty(item, -1)}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-sidebar)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
              >
                −
              </button>
              <button
                style={qtyBtnStyle}
                onClick={() => adjustQty(item, 1)}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-sidebar)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
              >
                +
              </button>
              <button
                onClick={() => deletePantryItem(item.id)}
                style={{ color: 'var(--text-muted)', fontSize: 16, cursor: 'pointer', flexShrink: 0 }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {showAdd ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, background: '#fff', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <input
            placeholder="食材名称"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="number"
              placeholder="数量"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              style={{ width: '50%' }}
            />
            <select
              value={unit}
              onChange={e => setUnit(e.target.value)}
              style={{ width: '50%' }}
            >
              <option value="克">克</option>
              <option value="毫升">毫升</option>
              <option value="个">个</option>
              <option value="勺">勺</option>
              <option value="杯">杯</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setShowAdd(false)}
              style={{ flex: 1, padding: '8px 0', borderRadius: 'var(--radius-sm)', background: '#fff', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}
            >
              取消
            </button>
            <button
              onClick={handleAdd}
              style={{ flex: 1, padding: '8px 0', borderRadius: 'var(--radius-sm)', background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600 }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; }}
            >
              添加
            </button>
          </div>
        </div>
      ) : (
        <button
          style={addBtnStyle}
          onClick={() => setShowAdd(true)}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-hover)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <span style={{ fontSize: 16 }}>+</span> 添加食材
        </button>
      )}
    </aside>
  );
}
