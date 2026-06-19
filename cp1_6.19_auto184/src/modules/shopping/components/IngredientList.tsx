import { motion } from 'framer-motion';
import type { CategoryGroup } from '@/types';

interface IngredientListProps {
  groups: CategoryGroup[];
  onToggleItem: (itemId: string) => void;
  onRemoveItem?: (itemId: string) => void;
}

export function IngredientList({ groups, onToggleItem, onRemoveItem }: IngredientListProps) {
  if (groups.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#95A5A6',
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
        <p style={{ fontSize: 16, margin: 0 }}>
          请先选择本周计划烹饪的菜谱
        </p>
      </motion.div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {groups.map((group, groupIndex) => (
        <motion.div
          key={group.category}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: groupIndex * 0.1 }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 12,
          }}>
            <div style={{
              width: 4,
              height: 20,
              backgroundColor: '#E67E22',
              borderRadius: 2,
              marginRight: 10,
            }} />
            <h3 style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 600,
              color: '#E67E22',
            }}>
              {group.categoryName}
            </h3>
            <span style={{
              marginLeft: 8,
              fontSize: 12,
              color: '#95A5A6',
            }}>
              {group.items.length} 项
            </span>
          </div>
          
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(212, 197, 176, 0.3)',
          }}>
            {group.items.map((item, itemIndex) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                transition={{ delay: groupIndex * 0.1 + itemIndex * 0.05, duration: 0.4 }}
                style={{
                  width: '100%',
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 16px',
                  borderBottom: itemIndex < group.items.length - 1 ? '1px solid #F5F5F5' : 'none',
                  boxSizing: 'border-box',
                  gap: 12,
                }}
              >
                <motion.div
                  whileTap={{ scale: 1.2 }}
                  onClick={() => onToggleItem(item.id)}
                  animate={{ scale: item.checked ? [1, 1.2, 1] : 1 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    border: `2px solid ${item.checked ? '#E67E22' : '#CCCCCC'}`,
                    backgroundColor: item.checked ? '#E67E22' : '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                  }}
                >
                  {item.checked && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2 6L5 9L10 3"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </motion.div>
                
                <span style={{
                  flex: 1,
                  fontSize: 14,
                  color: item.checked ? '#B0B0B0' : '#2C3E50',
                  textDecoration: item.checked ? 'line-through' : 'none',
                  transition: 'all 0.2s ease',
                }}>
                  {item.name}
                </span>
                
                <span style={{
                  fontSize: 13,
                  color: item.checked ? '#B0B0B0' : '#7F8C8D',
                  fontWeight: 500,
                  textDecoration: item.checked ? 'line-through' : 'none',
                  transition: 'all 0.2s ease',
                }}>
                  {item.quantity} {item.unit}
                </span>
                
                {onRemoveItem && (
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: '#CCCCCC',
                      fontSize: 18,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#FFEBEE';
                      e.currentTarget.style.color = '#E74C3C';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#CCCCCC';
                    }}
                  >
                    ×
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
