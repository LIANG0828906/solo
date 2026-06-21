import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { ShoppingListItem } from '../types';

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: '#F5E6CC',
  padding: '24px',
  fontFamily: "'Quicksand', sans-serif",
};

const containerStyle: React.CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '32px',
  flexWrap: 'wrap',
  gap: '16px',
};

const titleContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '36px',
  fontWeight: 700,
  color: '#4A2F1A',
  margin: 0,
};

const countBadgeStyle: React.CSSProperties = {
  padding: '6px 16px',
  background: '#D4A574',
  color: '#FFFFFF',
  borderRadius: '20px',
  fontSize: '14px',
  fontWeight: 700,
};

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  flexWrap: 'wrap',
};

const buttonStyle: React.CSSProperties = {
  padding: '10px 20px',
  borderRadius: '8px',
  border: 'none',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: "'Quicksand', sans-serif",
  transition: 'all 0.2s ease',
};

const backButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: '#FFFFFF',
  color: '#4A2F1A',
  border: '2px solid #D4C4B0',
};

const primaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: '#D4A574',
  color: '#FFFFFF',
};

const dangerButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: '#FFFFFF',
  color: '#F44336',
  border: '2px solid #F44336',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gap: '24px',
  gridTemplateColumns: 'repeat(3, 1fr)',
};

const categoryCardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  borderRadius: '12px',
  padding: '24px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  height: 'fit-content',
};

const categoryHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '20px',
  paddingBottom: '12px',
  borderBottom: '2px solid #E8D5BC',
};

const categoryTitleStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 700,
  color: '#4A2F1A',
  margin: 0,
};

const categoryCountStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#6B5344',
  fontWeight: 500,
  background: '#FFFBF5',
  padding: '4px 12px',
  borderRadius: '12px',
};

const itemsListStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

const getItemStyle = (isRemoving: boolean, isChecked: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 14px',
  background: isChecked ? '#F5F5F5' : '#FFFBF5',
  borderRadius: '8px',
  border: '1px solid #E8D5BC',
  transition: 'opacity 0.3s ease, transform 0.3s ease',
  opacity: isRemoving ? 0 : 1,
  transform: isRemoving ? 'translateX(20px)' : 'none',
});

const checkboxStyle: React.CSSProperties = {
  width: '20px',
  height: '20px',
  cursor: 'pointer',
  accentColor: '#D4A574',
  flexShrink: 0,
};

const itemContentStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  minWidth: 0,
};

const itemNameStyle = (isChecked: boolean): React.CSSProperties => ({
  fontSize: '15px',
  fontWeight: 600,
  color: isChecked ? '#9E9E9E' : '#4A2F1A',
  textDecoration: isChecked ? 'line-through' : 'none',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

const itemQuantityStyle = (isChecked: boolean): React.CSSProperties => ({
  fontSize: '14px',
  fontWeight: 700,
  color: isChecked ? '#9E9E9E' : '#D4A574',
  background: '#FFFFFF',
  padding: '4px 10px',
  borderRadius: '6px',
  flexShrink: 0,
  marginLeft: '8px',
});

const quantityAdjustStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  flexShrink: 0,
};

const qtyButtonStyle: React.CSSProperties = {
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  border: '1px solid #D4C4B0',
  background: '#FFFFFF',
  color: '#4A2F1A',
  fontSize: '14px',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: "'Quicksand', sans-serif",
  transition: 'all 0.15s ease',
};

const deleteItemButtonStyle: React.CSSProperties = {
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  border: 'none',
  background: 'transparent',
  color: '#F44336',
  fontSize: '16px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease',
  flexShrink: 0,
};

const emptyStateStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '80px 24px',
  color: '#6B5344',
  background: '#FFFFFF',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};

const emptyIconStyle: React.CSSProperties = {
  fontSize: '80px',
  marginBottom: '16px',
};

const emptyTitleStyle: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 700,
  color: '#4A2F1A',
  marginBottom: '8px',
};

const emptyDescStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 500,
  marginBottom: '24px',
};

const categoryOrder: ShoppingListItem['category'][] = ['蔬菜', '肉类', '调味料', '其他'];

const categoryEmoji: Record<ShoppingListItem['category'], string> = {
  '蔬菜': '🥬',
  '肉类': '🥩',
  '调味料': '🧂',
  '其他': '📦',
};

export const ShoppingListPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    shoppingList,
    removeShoppingListItem,
    updateShoppingListItem,
    setShoppingList,
    generateShoppingList,
    selectedRecipeIds,
  } = useAppStore();

  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getGridTemplateColumns = () => {
    if (windowWidth >= 1024) return 'repeat(3, 1fr)';
    if (windowWidth >= 768) return 'repeat(2, 1fr)';
    return '1fr';
  };

  const groupedItems = useMemo(() => {
    const groups: Record<ShoppingListItem['category'], ShoppingListItem[]> = {
      '蔬菜': [],
      '肉类': [],
      '调味料': [],
      '其他': [],
    };

    shoppingList.forEach((item) => {
      groups[item.category].push(item);
    });

    return groups;
  }, [shoppingList]);

  const handleDelete = (item: ShoppingListItem) => {
    setRemovingIds((prev) => new Set(prev).add(item.id));
    setTimeout(() => {
      removeShoppingListItem(item.id);
      setRemovingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }, 300);
  };

  const handleQuantityChange = (item: ShoppingListItem, delta: number) => {
    const newQuantity = Math.max(0, item.quantity + delta);
    updateShoppingListItem(item.id, { quantity: newQuantity });
  };

  const handleToggleChecked = (item: ShoppingListItem) => {
    updateShoppingListItem(item.id, { checked: !item.checked });
  };

  const handleRegenerate = () => {
    if (selectedRecipeIds.length === 0) {
      alert('请先在首页选择菜谱');
      navigate('/');
      return;
    }
    generateShoppingList();
  };

  const handleClearAll = () => {
    if (confirm('确定清空购物清单吗？')) {
      setShoppingList([]);
    }
  };

  const totalItems = shoppingList.length;
  const checkedItems = shoppingList.filter((i) => i.checked).length;

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div style={headerStyle}>
          <div style={titleContainerStyle}>
            <h1 style={titleStyle}>🛒 购物清单</h1>
            {totalItems > 0 && (
              <span style={countBadgeStyle}>
                {checkedItems} / {totalItems} 项
              </span>
            )}
          </div>

          <div style={actionsStyle}>
            <button
              onClick={() => navigate('/')}
              style={backButtonStyle}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#F5E6CC';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF';
              }}
            >
              ← 返回首页
            </button>
            {totalItems > 0 && (
              <>
                <button
                  onClick={handleRegenerate}
                  style={primaryButtonStyle}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#C49464';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#D4A574';
                  }}
                >
                  🔄 重新生成
                </button>
                <button
                  onClick={handleClearAll}
                  style={dangerButtonStyle}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#F44336';
                    (e.currentTarget as HTMLButtonElement).style.color = '#FFFFFF';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF';
                    (e.currentTarget as HTMLButtonElement).style.color = '#F44336';
                  }}
                >
                  🗑️ 清空清单
                </button>
              </>
            )}
          </div>
        </div>

        {totalItems === 0 ? (
          <div style={emptyStateStyle}>
            <div style={emptyIconStyle}>🛒</div>
            <div style={emptyTitleStyle}>购物清单是空的</div>
            <div style={emptyDescStyle}>
              去首页选择菜谱，然后点击「生成购物清单」吧！
            </div>
            <button
              onClick={() => navigate('/')}
              style={{
                ...primaryButtonStyle,
                padding: '14px 28px',
                fontSize: '16px',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#C49464';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#D4A574';
              }}
            >
              🏠 去选菜谱
            </button>
          </div>
        ) : (
          <div style={{ ...gridStyle, gridTemplateColumns: getGridTemplateColumns() }}>
            {categoryOrder.map((category) => {
              const items = groupedItems[category];
              if (items.length === 0) return null;

              return (
                <div key={category} style={categoryCardStyle}>
                  <div style={categoryHeaderStyle}>
                    <h3 style={categoryTitleStyle}>
                      {categoryEmoji[category]} {category}
                    </h3>
                    <span style={categoryCountStyle}>
                      {items.filter((i) => i.checked).length} / {items.length}
                    </span>
                  </div>

                  <ul style={itemsListStyle}>
                    {items.map((item) => {
                      const isRemoving = removingIds.has(item.id);
                      return (
                        <li
                          key={item.id}
                          style={getItemStyle(isRemoving, item.checked || false)}
                        >
                          <input
                            type="checkbox"
                            checked={item.checked || false}
                            onChange={() => handleToggleChecked(item)}
                            style={checkboxStyle}
                          />
                          <div style={itemContentStyle}>
                            <span style={itemNameStyle(item.checked || false)}>
                              {item.name}
                            </span>
                            <div style={quantityAdjustStyle}>
                              <button
                                onClick={() => handleQuantityChange(item, -1)}
                                style={qtyButtonStyle}
                                onMouseEnter={(e) => {
                                  (e.currentTarget as HTMLButtonElement).style.background = '#F5E6CC';
                                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#D4A574';
                                }}
                                onMouseLeave={(e) => {
                                  (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF';
                                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#D4C4B0';
                                }}
                              >
                                −
                              </button>
                              <span style={itemQuantityStyle(item.checked || false)}>
                                {item.quantity} {item.unit}
                              </span>
                              <button
                                onClick={() => handleQuantityChange(item, 1)}
                                style={qtyButtonStyle}
                                onMouseEnter={(e) => {
                                  (e.currentTarget as HTMLButtonElement).style.background = '#F5E6CC';
                                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#D4A574';
                                }}
                                onMouseLeave={(e) => {
                                  (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF';
                                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#D4C4B0';
                                }}
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDelete(item)}
                            title="删除此项"
                            style={deleteItemButtonStyle}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background = '#FDE8E8';
                              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                            }}
                          >
                            ✕
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShoppingListPage;
