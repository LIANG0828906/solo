import React from 'react';
import { useRouteStore } from '../store/useRouteStore';
import { GearItem } from '../types';

const categoryLabels: Record<GearItem['category'], string> = {
  essentials: '必备物品',
  clothing: '服装装备',
  food: '食物补给',
  emergency: '应急用品',
};

const GearChecklist: React.FC = () => {
  const gearItems = useRouteStore((state) => state.gearItems);
  const toggleGearItem = useRouteStore((state) => state.toggleGearItem);

  const groupedItems = gearItems.reduce<Record<string, GearItem[]>>((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div style={{ width: '100%' }}>
      {Object.entries(groupedItems).map(([category, items]) => (
        <div key={category} style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#666',
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {categoryLabels[category as GearItem['category']]}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {items.map((item) => (
              <label
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 4px',
                  cursor: 'pointer',
                  borderRadius: 4,
                }}
              >
                <div
                  onClick={() => toggleGearItem(item.id)}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    border: `2px solid ${item.checked ? '#4CAF50' : '#ccc'}`,
                    backgroundColor: item.checked ? '#4CAF50' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    flexShrink: 0,
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
                    color: item.checked ? '#bbb' : '#333',
                    textDecoration: item.checked ? 'line-through' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  {item.name}
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default GearChecklist;
