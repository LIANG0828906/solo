import React, { useState } from 'react';
import { useRouteStore } from '../store/useRouteStore';
import { GearItem } from '../types';
import { Plus, X, Trash2 } from 'lucide-react';

const categoryLabels: Record<GearItem['category'], string> = {
  essentials: '必备物品',
  clothing: '服装装备',
  food: '食物补给',
  emergency: '应急用品',
  custom: '自定义装备',
};

const categoryOptions: { value: GearItem['category']; label: string }[] = [
  { value: 'essentials', label: '必备物品' },
  { value: 'clothing', label: '服装装备' },
  { value: 'food', label: '食物补给' },
  { value: 'emergency', label: '应急用品' },
  { value: 'custom', label: '自定义' },
];

const GearChecklist: React.FC = () => {
  const gearItems = useRouteStore((state) => state.gearItems);
  const toggleGearItem = useRouteStore((state) => state.toggleGearItem);
  const addGearItem = useRouteStore((state) => state.addGearItem);
  const removeGearItem = useRouteStore((state) => state.removeGearItem);

  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [selectedCategory, setSelectedCategory] = useState<GearItem['category']>('custom');

  const groupedItems = gearItems.reduce<Record<string, GearItem[]>>((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  const handleAdd = () => {
    if (!newItemName.trim()) return;
    addGearItem(newItemName.trim(), selectedCategory, parseInt(newItemQuantity) || 1);
    setNewItemName('');
    setNewItemQuantity('1');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {Object.entries(groupedItems).map(([category, items]) => (
        <div key={category} style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#6D4C41',
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {categoryLabels[category as GearItem['category']]} ({items.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '6px 4px',
                  borderRadius: 6,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(46, 125, 50, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div
                  onClick={() => toggleGearItem(item.id)}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    border: `2px solid ${item.checked ? '#2E7D32' : '#ccc'}`,
                    backgroundColor: item.checked ? '#2E7D32' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    flexShrink: 0,
                    cursor: 'pointer',
                  }}
                >
                  {item.checked && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <span
                  style={{
                    fontSize: 14,
                    color: item.checked ? '#aaa' : '#333',
                    textDecoration: item.checked ? 'line-through' : 'none',
                    transition: 'all 0.2s',
                    flex: 1,
                  }}
                >
                  {item.name}
                  {item.quantity && item.quantity > 1 && (
                    <span style={{ color: '#999', fontSize: 12, marginLeft: 6 }}>
                      ×{item.quantity}
                    </span>
                  )}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeGearItem(item.id);
                  }}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    border: 'none',
                    background: 'transparent',
                    color: '#ccc',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    opacity: 0,
                  }}
                  className="gear-delete-btn"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.backgroundColor = '#ffebee';
                    e.currentTarget.style.color = '#f44336';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0';
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#ccc';
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div
        style={{
          marginTop: 16,
          padding: 12,
          backgroundColor: '#f5f2ed',
          borderRadius: 8,
          border: '1px dashed #c8b8a0',
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#6D4C41',
            marginBottom: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Plus size={16} />
          添加自定义装备
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入装备名称..."
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d0c4b0',
              borderRadius: 6,
              fontSize: 14,
              outline: 'none',
              transition: 'all 0.2s',
              boxSizing: 'border-box',
              backgroundColor: 'white',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#2E7D32';
              e.target.style.boxShadow = '0 0 0 2px rgba(46, 125, 50, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d0c4b0';
              e.target.style.boxShadow = 'none';
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as GearItem['category'])}
              style={{
                flex: 1,
                padding: '6px 10px',
                border: '1px solid #d0c4b0',
                borderRadius: 6,
                fontSize: 13,
                outline: 'none',
                backgroundColor: 'white',
                cursor: 'pointer',
                color: '#5D4037',
              }}
            >
              {categoryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={newItemQuantity}
              onChange={(e) => setNewItemQuantity(e.target.value)}
              min="1"
              placeholder="数量"
              style={{
                width: 60,
                padding: '6px 10px',
                border: '1px solid #d0c4b0',
                borderRadius: 6,
                fontSize: 13,
                outline: 'none',
                textAlign: 'center',
                backgroundColor: 'white',
              }}
            />
            <button
              onClick={handleAdd}
              disabled={!newItemName.trim()}
              style={{
                padding: '6px 16px',
                backgroundColor: '#FF9800',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: newItemName.trim() ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                opacity: newItemName.trim() ? 1 : 0.5,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
              onMouseEnter={(e) => {
                if (newItemName.trim()) {
                  e.currentTarget.style.backgroundColor = '#F57C00';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FF9800';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Plus size={16} />
              添加
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GearChecklist;
