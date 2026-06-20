import { useState } from 'react';
import { motion } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import type { CategoryGroup, IngredientCategory } from '@/types';
import { getCategoryName } from '@/utils/recipeParser';

interface GroceryChecklistProps {
  groups: CategoryGroup[];
  onToggleItem: (itemId: string) => void;
  onAddItem: (item: { name: string; quantity: number; unit: string; category: IngredientCategory; checked: boolean; sourceRecipes: string[] }) => void;
  onRemoveItem: (itemId: string) => void;
}

const CATEGORIES: IngredientCategory[] = ['vegetables', 'meat', 'seasoning', 'drygoods', 'other'];

export function GroceryChecklist({ groups, onToggleItem, onAddItem, onRemoveItem }: GroceryChecklistProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [newItemUnit, setNewItemUnit] = useState('g');
  const [newItemCategory, setNewItemCategory] = useState<IngredientCategory>('other');

  const handleAdd = () => {
    if (!newItemName.trim()) return;
    
    onAddItem({
      name: newItemName.trim(),
      quantity: Number(newItemQuantity) || 1,
      unit: newItemUnit,
      category: newItemCategory,
      checked: false,
      sourceRecipes: ['手动添加'],
    });
    
    setNewItemName('');
    setNewItemQuantity('1');
    setNewItemUnit('g');
    setNewItemCategory('other');
    setShowAddForm(false);
  };

  const totalItems = groups.reduce((sum, g) => sum + g.items.length, 0);
  const checkedItems = groups.reduce((sum, g) => sum + g.items.filter(i => i.checked).length, 0);

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 20,
      boxShadow: '0 2px 12px rgba(212, 197, 176, 0.4)',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
      }}>
        <div>
          <h2 style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 600,
            color: '#2C3E50',
          }}>
            购物清单
          </h2>
          <p style={{
            margin: '4px 0 0 0',
            fontSize: 13,
            color: '#7F8C8D',
          }}>
            已完成 {checkedItems} / {totalItems} 项
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            backgroundColor: '#E67E22',
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#D35400';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#E67E22';
          }}
        >
          {showAddForm ? '取消' : '+ 添加单品'}
        </motion.button>
      </div>

      {totalItems > 0 && (
        <div style={{
          height: 6,
          backgroundColor: '#F5F5F5',
          borderRadius: 3,
          marginBottom: 20,
          overflow: 'hidden',
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${totalItems > 0 ? (checkedItems / totalItems) * 100 : 0}%` }}
            transition={{ duration: 0.3 }}
            style={{
              height: '100%',
              backgroundColor: '#E67E22',
              borderRadius: 3,
            }}
          />
        </div>
      )}

      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          style={{
            padding: 16,
            backgroundColor: '#FFF8F0',
            borderRadius: 12,
            marginBottom: 16,
          }}
        >
          <div style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            marginBottom: 8,
            flexWrap: 'wrap',
          }}>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="食材名称"
              style={{
                flex: 1,
                minWidth: 100,
                height: 36,
                padding: '0 12px',
                borderRadius: 8,
                border: '1px solid #E0E0E0',
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#E67E22';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E0E0E0';
              }}
            />
            <input
              type="number"
              value={newItemQuantity}
              onChange={(e) => setNewItemQuantity(e.target.value)}
              placeholder="数量"
              style={{
                width: 60,
                height: 36,
                padding: '0 8px',
                borderRadius: 8,
                border: '1px solid #E0E0E0',
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <input
              type="text"
              value={newItemUnit}
              onChange={(e) => setNewItemUnit(e.target.value)}
              placeholder="单位"
              style={{
                width: 50,
                height: 36,
                padding: '0 8px',
                borderRadius: 8,
                border: '1px solid #E0E0E0',
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <select
              value={newItemCategory}
              onChange={(e) => setNewItemCategory(e.target.value as IngredientCategory)}
              style={{
                height: 36,
                padding: '0 10px',
                borderRadius: 8,
                border: '1px solid #E0E0E0',
                fontSize: 13,
                outline: 'none',
                backgroundColor: '#FFFFFF',
              }}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {getCategoryName(cat)}
                </option>
              ))}
            </select>
            <button
              onClick={handleAdd}
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: '#E67E22',
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              添加
            </button>
          </div>
        </motion.div>
      )}

      {groups.map((group) => (
        <div key={group.category} style={{ marginBottom: 20 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 10,
          }}>
            <div style={{
              width: 4,
              height: 18,
              backgroundColor: '#E67E22',
              borderRadius: 2,
              marginRight: 10,
            }} />
            <h3 style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 600,
              color: '#E67E22',
            }}>
              {group.categoryName}
            </h3>
            <span style={{
              marginLeft: 6,
              fontSize: 12,
              color: '#95A5A6',
            }}>
              {group.items.filter(i => i.checked).length}/{group.items.length}
            </span>
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}>
            {group.items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ backgroundColor: '#FAFAFA' }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 12px',
                  borderRadius: 8,
                  gap: 10,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                }}
                onClick={() => onToggleItem(item.id)}
              >
                <motion.div
                  whileTap={{ scale: 1.2 }}
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
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveItem(item.id);
                  }}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#CCCCCC',
                    fontSize: 18,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.backgroundColor = '#FFEBEE';
                    e.currentTarget.style.color = '#E74C3C';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0';
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#CCCCCC';
                  }}
                >
                  ×
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      ))}

      {groups.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#95A5A6',
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
          <p style={{ fontSize: 14, margin: 0 }}>
            购物清单为空
          </p>
        </motion.div>
      )}
    </div>
  );
}
