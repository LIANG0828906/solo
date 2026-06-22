import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { InventoryItem, UNITS } from '../types';

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
};

const titleStyle: React.CSSProperties = {
  fontSize: '36px',
  fontWeight: 700,
  color: '#4A2F1A',
  margin: 0,
};

const backButtonStyle: React.CSSProperties = {
  padding: '10px 20px',
  background: '#FFFFFF',
  color: '#4A2F1A',
  border: '2px solid #D4C4B0',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: "'Quicksand', sans-serif",
  transition: 'all 0.2s ease',
};

const contentStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '380px 1fr',
  gap: '32px',
};

const cardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  borderRadius: '12px',
  padding: '24px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 700,
  color: '#4A2F1A',
  margin: '0 0 24px 0',
};

const formGroupStyle: React.CSSProperties = {
  marginBottom: '20px',
  position: 'relative',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '14px',
  fontWeight: 600,
  color: '#4A2F1A',
  marginBottom: '8px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '8px',
  border: '2px solid #D4C4B0',
  fontSize: '14px',
  outline: 'none',
  fontFamily: "'Quicksand', sans-serif",
  boxSizing: 'border-box',
  background: '#FFFFFF',
};

const autocompleteDropdownStyle: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  background: '#FFFFFF',
  border: '1px solid #E8D5BC',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  zIndex: 100,
  maxHeight: '200px',
  overflowY: 'auto',
  marginTop: '4px',
};

const autocompleteItemStyle: React.CSSProperties = {
  padding: '10px 16px',
  cursor: 'pointer',
  fontSize: '14px',
  color: '#4A2F1A',
  transition: 'background 0.15s ease',
};

const submitButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 24px',
  background: '#D4A574',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: "'Quicksand', sans-serif",
  transition: 'background 0.2s ease',
};

const tableContainerStyle: React.CSSProperties = {
  overflowX: 'auto',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'separate',
  borderSpacing: 0,
  fontSize: '14px',
};

const thStyle: React.CSSProperties = {
  padding: '14px 16px',
  textAlign: 'left',
  background: '#FFFBF5',
  color: '#4A2F1A',
  fontWeight: 700,
  borderBottom: '2px solid #E8D5BC',
};

const thFirstStyle: React.CSSProperties = {
  ...thStyle,
  borderTopLeftRadius: '8px',
};

const thLastStyle: React.CSSProperties = {
  ...thStyle,
  borderTopRightRadius: '8px',
  textAlign: 'center',
};

const tdStyle: React.CSSProperties = {
  padding: '14px 16px',
  borderBottom: '1px solid #F0E4D0',
  color: '#4A2F1A',
};

const tdLastStyle: React.CSSProperties = {
  ...tdStyle,
  textAlign: 'center',
};

const editInputStyle: React.CSSProperties = {
  width: '80px',
  padding: '6px 10px',
  borderRadius: '6px',
  border: '2px solid #D4C4B0',
  fontSize: '14px',
  outline: 'none',
  fontFamily: "'Quicksand', sans-serif",
  textAlign: 'center',
};

const actionButtonStyle: React.CSSProperties = {
  padding: '6px 12px',
  border: 'none',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: "'Quicksand', sans-serif",
  margin: '0 4px',
  transition: 'background 0.2s ease',
};

const editButtonStyle: React.CSSProperties = {
  ...actionButtonStyle,
  background: '#4CAF50',
  color: '#FFFFFF',
};

const saveButtonStyle: React.CSSProperties = {
  ...actionButtonStyle,
  background: '#2196F3',
  color: '#FFFFFF',
};

const deleteButtonStyle: React.CSSProperties = {
  ...actionButtonStyle,
  background: '#F44336',
  color: '#FFFFFF',
};

const cancelButtonStyle: React.CSSProperties = {
  ...actionButtonStyle,
  background: '#9E9E9E',
  color: '#FFFFFF',
};

const emptyStateStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '48px 24px',
  color: '#6B5344',
};

const emptyIconStyle: React.CSSProperties = {
  fontSize: '64px',
  marginBottom: '12px',
};

const emptyTextStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 500,
};

export const InventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem, getAllIngredientNames } = useAppStore();

  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState('');
  const autocompleteRef = useRef<HTMLDivElement>(null);

  const allIngredientNames = getAllIngredientNames();
  const filteredNames = name.trim()
    ? allIngredientNames.filter((n) =>
        n.toLowerCase().includes(name.toLowerCase())
      )
    : [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        autocompleteRef.current &&
        !autocompleteRef.current.contains(e.target as Node)
      ) {
        setShowAutocomplete(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = () => {
    if (!name.trim()) {
      alert('请输入食材名称');
      return;
    }
    if (!quantity || Number(quantity) < 0) {
      alert('请输入有效的数量');
      return;
    }
    if (!unit.trim()) {
      alert('请选择单位');
      return;
    }

    const newItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      name: name.trim(),
      quantity: Number(quantity),
      unit: unit.trim(),
      last_updated: new Date().toISOString().split('T')[0],
    };

    addInventoryItem(newItem);
    setName('');
    setQuantity('');
    setUnit('');
  };

  const handleSelectName = (n: string) => {
    setName(n);
    setShowAutocomplete(false);
  };

  const handleStartEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditQuantity(String(item.quantity));
  };

  const handleSaveEdit = (item: InventoryItem) => {
    const newQty = Number(editQuantity);
    if (isNaN(newQty) || newQty < 0) {
      alert('请输入有效的数量');
      return;
    }

    updateInventoryItem({
      ...item,
      quantity: newQty,
      last_updated: new Date().toISOString().split('T')[0],
    });
    setEditingId(null);
    setEditQuantity('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditQuantity('');
  };

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div style={headerStyle}>
          <h1 style={titleStyle}>📦 食材库存</h1>
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
        </div>

        <div style={contentStyle}>
          <div style={cardStyle}>
            <h2 style={cardTitleStyle}>➕ 添加库存</h2>

            <div style={formGroupStyle} ref={autocompleteRef}>
              <label style={labelStyle}>食材名称 *</label>
              <input
                type="text"
                placeholder="输入或选择食材名称"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setShowAutocomplete(true);
                }}
                onFocus={() => setShowAutocomplete(true)}
                style={inputStyle}
              />
              {showAutocomplete && filteredNames.length > 0 && (
                <div style={autocompleteDropdownStyle}>
                  {filteredNames.map((n, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectName(n)}
                      style={autocompleteItemStyle}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.background = '#FFF8EE';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.background = '#FFFFFF';
                      }}
                    >
                      {n}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>数量 *</label>
              <input
                type="number"
                placeholder="例如：500"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="0"
                step="any"
                style={inputStyle}
              />
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>单位 *</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="">选择单位</option>
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSubmit}
              style={submitButtonStyle}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#C49464';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#D4A574';
              }}
            >
              ✅ 添加到库存
            </button>
          </div>

          <div style={cardStyle}>
            <h2 style={cardTitleStyle}>📋 库存列表（{inventory.length}）</h2>

            {inventory.length === 0 ? (
              <div style={emptyStateStyle}>
                <div style={emptyIconStyle}>🏺</div>
                <div style={emptyTextStyle}>库存空空如也，快去添加吧！</div>
              </div>
            ) : (
              <div style={tableContainerStyle}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thFirstStyle}>名称</th>
                      <th style={thStyle}>数量</th>
                      <th style={thStyle}>单位</th>
                      <th style={thStyle}>最后更新</th>
                      <th style={thLastStyle}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((item) => (
                      <tr key={item.id}>
                        <td style={tdStyle}>{item.name}</td>
                        <td style={tdStyle}>
                          {editingId === item.id ? (
                            <input
                              type="number"
                              value={editQuantity}
                              onChange={(e) => setEditQuantity(e.target.value)}
                              min="0"
                              step="any"
                              style={editInputStyle}
                            />
                          ) : (
                            <strong style={{ color: '#D4A574' }}>{item.quantity}</strong>
                          )}
                        </td>
                        <td style={tdStyle}>{item.unit}</td>
                        <td style={tdStyle}>{item.last_updated}</td>
                        <td style={tdLastStyle}>
                          {editingId === item.id ? (
                            <>
                              <button
                                onClick={() => handleSaveEdit(item)}
                                style={saveButtonStyle}
                                onMouseEnter={(e) => {
                                  (e.currentTarget as HTMLButtonElement).style.background = '#1976D2';
                                }}
                                onMouseLeave={(e) => {
                                  (e.currentTarget as HTMLButtonElement).style.background = '#2196F3';
                                }}
                              >
                                保存
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                style={cancelButtonStyle}
                                onMouseEnter={(e) => {
                                  (e.currentTarget as HTMLButtonElement).style.background = '#757575';
                                }}
                                onMouseLeave={(e) => {
                                  (e.currentTarget as HTMLButtonElement).style.background = '#9E9E9E';
                                }}
                              >
                                取消
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleStartEdit(item)}
                                style={editButtonStyle}
                                onMouseEnter={(e) => {
                                  (e.currentTarget as HTMLButtonElement).style.background = '#45a049';
                                }}
                                onMouseLeave={(e) => {
                                  (e.currentTarget as HTMLButtonElement).style.background = '#4CAF50';
                                }}
                              >
                                编辑
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`确定删除「${item.name}」的库存吗？`)) {
                                    deleteInventoryItem(item.id);
                                  }
                                }}
                                style={deleteButtonStyle}
                                onMouseEnter={(e) => {
                                  (e.currentTarget as HTMLButtonElement).style.background = '#D32F2F';
                                }}
                                onMouseLeave={(e) => {
                                  (e.currentTarget as HTMLButtonElement).style.background = '#F44336';
                                }}
                              >
                                删除
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryPage;
