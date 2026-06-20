import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useTripStore } from '../store';
import type { Category, Item } from '../types';

const CATEGORIES: Category[] = ['服装', '洗护', '电子', '证件', '医疗', '其他'];
const CATEGORY_ICONS: Record<Category, string> = {
  '服装': '👕', '洗护': '🧴', '电子': '📱', '证件': '📄', '医疗': '💊', '其他': '📦',
};

const DEST_ICONS: Record<string, string> = {
  default: '📍',
  巴黎: '🗼', 东京: '⛩️', 纽约: '🗽', 伦敦: '🎡', 悉尼: '🦘',
  罗马: '🏛️', 曼谷: '🛕', 首尔: '🎎', 迪拜: '🕌', 马尔代夫: '🏝️',
  拉萨: '🏔️', 成都: '🐼', 北京: '🏯', 上海: '🌆', 广州: '🌺',
  三亚: '🌴', 丽江: '⛰️', 杭州: '🌿', 西安: '🏛️', 厦门: '🌊',
};

function estimateVolume(totalWeight: number, itemCount: number): string {
  const volumeEst = totalWeight * 3.5 + itemCount * 0.8;
  if (volumeEst <= 25) return '20L';
  if (volumeEst <= 50) return '40L';
  return '60L';
}

function getBagSuggestion(volume: string, activityTypes: string[]): string {
  const hasHiking = activityTypes.includes('徒步登山');
  if (volume === '20L') return '建议使用20L随身背包';
  if (volume === '40L') return '建议使用40L' + (hasHiking ? '登山包' : '旅行箱');
  return '建议使用60L大容量背包，部分物品建议托运';
}

interface ListPageProps {
  onBack: () => void;
}

const ListPage: React.FC<ListPageProps> = ({ onBack }) => {
  const { trips, currentTripId, updateItemQuantity, togglePacked, reorderItems, addItem, removeItem, setCurrentTripId } = useTripStore();
  const trip = trips.find(t => t.id === currentTripId);
  const [collapsedCats, setCollapsedCats] = useState<Set<Category>>(new Set());
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [exportText, setExportText] = useState('');
  const [typedText, setTypedText] = useState('');
  const [exportBtnState, setExportBtnState] = useState<'arrow' | 'bounce' | 'check'>('arrow');
  const [weightFlashId, setWeightFlashId] = useState<string | null>(null);
  const [addFormCat, setAddFormCat] = useState<Category | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemWeight, setNewItemWeight] = useState('');
  const typingRef = useRef<number | null>(null);
  const contentRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const toggleCategory = (cat: Category) => {
    setCollapsedCats(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  const itemsByCategory = useMemo(() => {
    if (!trip) return {};
    const map: Record<Category, Item[]> = {} as any;
    CATEGORIES.forEach(cat => { map[cat] = []; });
    trip.items.forEach(item => {
      map[item.category].push(item);
    });
    return map;
  }, [trip]);

  const totalWeight = useMemo(() => {
    if (!trip) return 0;
    return trip.items.reduce((sum, i) => sum + i.weight * i.quantity, 0);
  }, [trip]);

  const totalItems = useMemo(() => {
    if (!trip) return 0;
    return trip.items.reduce((sum, i) => sum + i.quantity, 0);
  }, [trip]);

  const packedCount = useMemo(() => {
    if (!trip) return 0;
    return trip.items.filter(i => i.packed).reduce((sum, i) => sum + i.quantity, 0);
  }, [trip]);

  const progressPercent = useMemo(() => {
    if (totalItems === 0) return 0;
    return Math.round((packedCount / totalItems) * 100);
  }, [packedCount, totalItems]);

  const volume = useMemo(() => estimateVolume(totalWeight, trip?.items.length ?? 0), [totalWeight, trip]);

  const weightWarning = useMemo(() => {
    if (totalWeight > 23) return { level: '托运超标', exceed: totalWeight - 23, limit: 23 };
    if (totalWeight > 7) return { level: '手提超标', exceed: totalWeight - 7, limit: 7 };
    return null;
  }, [totalWeight]);

  const handleQuantityChange = useCallback((itemId: string, newQty: number) => {
    if (!trip) return;
    updateItemQuantity(trip.id, itemId, newQty);
    setWeightFlashId(itemId);
    setTimeout(() => setWeightFlashId(null), 400);
  }, [trip, updateItemQuantity]);

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (toIndex: number) => {
    if (dragIndex !== null && dragIndex !== toIndex && trip) {
      reorderItems(trip.id, dragIndex, toIndex);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleExport = () => {
    if (!trip) return;
    setExportBtnState('bounce');
    setTimeout(() => setExportBtnState('check'), 500);

    const lines: string[] = [];
    lines.push(`═══════════════════════════════════`);
    lines.push(`  NomadPack 行李清单报告`);
    lines.push(`═══════════════════════════════════`);
    lines.push(``);
    lines.push(`  目的地: ${trip.destination}`);
    lines.push(`  天  数: ${trip.days}天`);
    lines.push(`  类  型: ${trip.activityTypes.join(' · ')}`);
    lines.push(``);
    lines.push(`───────────────────────────────────`);

    CATEGORIES.forEach(cat => {
      const catItems = itemsByCategory[cat];
      if (catItems.length === 0) return;
      lines.push(``);
      lines.push(`【${CATEGORY_ICONS[cat]} ${cat}】`);
      catItems.forEach(item => {
        const packedMark = item.packed ? '✅' : '⬜';
        lines.push(`  ${packedMark} ${item.name} ×${item.quantity}  (${(item.weight * item.quantity).toFixed(2)}kg)`);
      });
    });

    lines.push(``);
    lines.push(`───────────────────────────────────`);
    lines.push(`  总重量: ${totalWeight.toFixed(2)} kg`);
    lines.push(`  预估体积: ${volume}`);
    lines.push(`  打包进度: ${packedCount}/${totalItems} 件`);
    lines.push(``);
    lines.push(`  💡 ${getBagSuggestion(volume, trip.activityTypes)}`);
    if (weightWarning) {
      lines.push(`  ⚠️  ${weightWarning.level}！超出${weightWarning.exceed.toFixed(1)}kg（限${weightWarning.limit}kg）`);
    }
    lines.push(`═══════════════════════════════════`);

    const text = lines.join('\n');
    setExportText(text);
    setTypedText('');
    setShowExport(true);
  };

  useEffect(() => {
    if (!showExport || !exportText) return;
    let i = 0;
    const type = () => {
      if (i < exportText.length) {
        setTypedText(exportText.slice(0, i + 3));
        i += 3;
        typingRef.current = window.setTimeout(type, 8);
      }
    };
    type();
    return () => { if (typingRef.current) clearTimeout(typingRef.current); };
  }, [showExport, exportText]);

  const handleAddItem = (cat: Category) => {
    if (!trip || !newItemName.trim()) return;
    const w = parseFloat(newItemWeight) || 0.1;
    addItem(trip.id, newItemName.trim(), cat, w);
    setNewItemName('');
    setNewItemWeight('');
    setAddFormCat(null);
  };

  if (!trip) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p style={{ color: '#7A7A7A' }}>行程未找到</p>
      </div>
    );
  }

  const icon = DEST_ICONS[trip.destination] || DEST_ICONS.default;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {weightWarning && (
        <div className="fade-in" style={{
          background: '#FDECEC',
          borderBottom: '1px solid #F5C6CB',
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}>
          <span className="shake-title" style={{ color: '#E74C3C', fontWeight: 700, fontSize: 15 }}>
            ⚠️ {weightWarning.level}
          </span>
          <span style={{ color: '#C0392B', fontSize: 14 }}>
            超出 {weightWarning.exceed.toFixed(1)}kg（限额 {weightWarning.limit}kg）
          </span>
        </div>
      )}

      <div style={{
        background: '#fff',
        borderBottom: '1px solid #E8E4DE',
        padding: '12px 24px',
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: '#7A7A7A' }}>打包进度</span>
            <span style={{ fontSize: 12, color: '#4A90D9', fontWeight: 600 }}>{progressPercent}%</span>
          </div>
          <div style={{
            height: 8,
            background: '#F0EDE8',
            borderRadius: 4,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${progressPercent}%`,
              borderRadius: 4,
              background: progressPercent <= 33 ? '#E74C3C' : progressPercent <= 66 ? '#F39C12' : '#27AE60',
              transition: '0.3s ease-out',
            }} />
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 8, fontSize: 13, color: '#7A7A7A' }}>
            <span>预估总重 <strong style={{ color: '#2D2D2D' }}>{totalWeight.toFixed(1)} kg</strong></span>
            <span>体积参考 <strong style={{ color: '#D4A76A' }}>{volume}</strong></span>
            <span>已打包 <strong style={{ color: '#4A90D9' }}>{packedCount}/{totalItems}</strong> 件</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <aside style={{
          width: 240,
          background: '#fff',
          borderRight: '1px solid #E8E4DE',
          overflowY: 'auto',
          padding: '16px 12px',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '0 4px' }}>
            <button
              onClick={onBack}
              style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: 18,
                color: '#4A90D9',
                padding: 4,
                transition: '0.2s ease-out',
              }}
            >
              ←
            </button>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#4A90D9' }}>全部行程</span>
          </div>

          {trips.map(t => {
            const tIcon = DEST_ICONS[t.destination] || DEST_ICONS.default;
            const isActive = t.id === currentTripId;
            return (
              <div
                key={t.id}
                onClick={() => setCurrentTripId(t.id)}
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: isActive ? '2px solid #4A90D9' : '1px solid #E8E4DE',
                  background: isActive ? '#EBF3FC' : '#FAFAFA',
                  marginBottom: 8,
                  cursor: 'pointer',
                  transition: '0.2s ease-out',
                  transform: isActive ? 'scale(1.01)' : 'scale(1)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 22 }}>{tIcon}</span>
                  <span style={{
                    fontSize: 11,
                    padding: '1px 6px',
                    background: '#D4A76A',
                    color: '#fff',
                    borderRadius: 4,
                    fontWeight: 600,
                  }}>
                    {t.days}天
                  </span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6 }}>{t.destination}</div>
                <div style={{ fontSize: 12, color: '#7A7A7A' }}>{t.activityTypes.join(' · ')}</div>
              </div>
            );
          })}
        </aside>

        <main style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 36 }}>{icon}</span>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 700 }}>{trip.destination}</h2>
                  <span style={{ fontSize: 13, color: '#7A7A7A' }}>{trip.days}天 · {trip.activityType}</span>
                </div>
              </div>
              <button
                onClick={handleExport}
                style={{
                  padding: '10px 20px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#4A90D9',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: '0.2s ease-out',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#6BA6E3'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#4A90D9'}
              >
                {exportBtnState === 'check' ? (
                  <span>✓ 已导出</span>
                ) : (
                  <span className={exportBtnState === 'bounce' ? 'btn-bounce-arrow' : ''}>↓ 导出清单</span>
                )}
              </button>
            </div>

            {CATEGORIES.map(cat => {
              const catItems = itemsByCategory[cat];
              const isCollapsed = collapsedCats.has(cat);
              const catWeight = catItems.reduce((s, i) => s + i.weight * i.quantity, 0);

              return (
                <div key={cat} style={{ marginBottom: 12 }}>
                  <div
                    onClick={() => toggleCategory(cat)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: '#fff',
                      borderRadius: 12,
                      border: '1px solid #E8E4DE',
                      cursor: 'pointer',
                      userSelect: 'none',
                      transition: '0.2s ease-out',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 18 }}>{CATEGORY_ICONS[cat]}</span>
                      <span style={{ fontSize: 15, fontWeight: 600 }}>{cat}</span>
                      <span style={{
                        fontSize: 12,
                        color: '#7A7A7A',
                        background: '#F5F3EF',
                        padding: '2px 8px',
                        borderRadius: 6,
                      }}>
                        {catItems.length}件
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 13, color: '#D4A76A', fontWeight: 600 }}>
                        {catWeight.toFixed(1)} kg
                      </span>
                      <span style={{
                        transition: '0.2s ease-out',
                        transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0)',
                        fontSize: 12,
                        color: '#7A7A7A',
                      }}>
                        ▼
                      </span>
                    </div>
                  </div>

                  <div
                    ref={el => { contentRefs.current[cat] = el; }}
                    className={`category-content ${isCollapsed ? 'collapsed' : ''}`}
                    style={{
                      maxHeight: isCollapsed ? 0 : catItems.length * 60 + 100,
                    }}
                  >
                    <div style={{ padding: '8px 0' }}>
                      {catItems.length === 0 && !isCollapsed && (
                        <div style={{ padding: '16px', textAlign: 'center', color: '#BFBFBF', fontSize: 13 }}>
                          暂无物品
                        </div>
                      )}
                      {catItems.map((item, idx) => {
                        const globalIdx = trip.items.findIndex(i => i.id === item.id);
                        const itemTotalWeight = item.weight * item.quantity;
                        const isFlashing = weightFlashId === item.id;
                        const isDragging = dragIndex === globalIdx;
                        const isDragOver = dragOverIndex === globalIdx;

                        return (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={() => handleDragStart(globalIdx)}
                            onDragOver={e => handleDragOver(e, globalIdx)}
                            onDrop={() => handleDrop(globalIdx)}
                            onDragEnd={handleDragEnd}
                            className={`${isDragging ? 'dragging-item' : ''} ${isDragOver ? 'drag-over-item' : ''}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              padding: '10px 16px',
                              margin: '4px 0',
                              background: item.packed ? '#F8F6F2' : '#fff',
                              borderRadius: 10,
                              border: '1px solid #E8E4DE',
                              transition: '0.2s ease-out',
                              cursor: 'grab',
                              opacity: item.packed ? 0.7 : 1,
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={item.packed}
                              onChange={() => togglePacked(trip.id, item.id)}
                              style={{ cursor: 'pointer', accentColor: '#4A90D9', width: 16, height: 16 }}
                            />

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                fontSize: 14,
                                fontWeight: 500,
                                textDecoration: item.packed ? 'line-through' : 'none',
                                color: item.packed ? '#BFBFBF' : '#2D2D2D',
                              }}>
                                {item.name}
                              </div>
                              <div style={{ fontSize: 11, color: '#BFBFBF' }}>
                                {item.weight}kg/件
                              </div>
                            </div>

                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}>
                              <button
                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 8,
                                  border: '1px solid #E8E4DE',
                                  background: '#FAFAFA',
                                  cursor: 'pointer',
                                  fontSize: 16,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: '0.2s ease-out',
                                  color: '#7A7A7A',
                                }}
                                onMouseDown={e => (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.85)'}
                                onMouseUp={e => (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'}
                                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'}
                              >
                                −
                              </button>
                              <span style={{
                                width: 32,
                                textAlign: 'center',
                                fontSize: 15,
                                fontWeight: 600,
                              }}>
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 8,
                                  border: '1px solid #E8E4DE',
                                  background: '#FAFAFA',
                                  cursor: 'pointer',
                                  fontSize: 16,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: '0.2s ease-out',
                                  color: '#7A7A7A',
                                }}
                                onMouseDown={e => (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.85)'}
                                onMouseUp={e => (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'}
                                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'}
                              >
                                +
                              </button>
                            </div>

                            <span
                              className={isFlashing ? 'weight-flash' : ''}
                              style={{
                                minWidth: 60,
                                textAlign: 'right',
                                fontSize: 14,
                                fontWeight: 600,
                                color: item.packed ? '#BFBFBF' : '#D4A76A',
                              }}
                            >
                              {itemTotalWeight.toFixed(2)} kg
                            </span>

                            <button
                              onClick={() => removeItem(trip.id, item.id)}
                              style={{
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                color: '#BFBFBF',
                                fontSize: 14,
                                padding: 4,
                                transition: '0.2s ease-out',
                              }}
                              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#E74C3C'}
                              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#BFBFBF'}
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}

                      {addFormCat === cat ? (
                        <div style={{
                          display: 'flex',
                          gap: 8,
                          padding: '10px 16px',
                          margin: '4px 0',
                          background: '#FDFCFA',
                          borderRadius: 10,
                          border: '1px dashed #D4A76A',
                        }}>
                          <input
                            type="text"
                            value={newItemName}
                            onChange={e => setNewItemName(e.target.value)}
                            placeholder="物品名称"
                            style={{
                              flex: 1,
                              padding: '6px 10px',
                              borderRadius: 6,
                              border: '1px solid #E8E4DE',
                              fontSize: 13,
                              outline: 'none',
                            }}
                            autoFocus
                            onKeyDown={e => { if (e.key === 'Enter') handleAddItem(cat); }}
                          />
                          <input
                            type="number"
                            value={newItemWeight}
                            onChange={e => setNewItemWeight(e.target.value)}
                            placeholder="kg"
                            step="0.01"
                            style={{
                              width: 64,
                              padding: '6px 8px',
                              borderRadius: 6,
                              border: '1px solid #E8E4DE',
                              fontSize: 13,
                              outline: 'none',
                              textAlign: 'center',
                            }}
                            onKeyDown={e => { if (e.key === 'Enter') handleAddItem(cat); }}
                          />
                          <button
                            onClick={() => handleAddItem(cat)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 6,
                              border: 'none',
                              background: '#4A90D9',
                              color: '#fff',
                              cursor: 'pointer',
                              fontSize: 13,
                              transition: '0.2s ease-out',
                            }}
                          >
                            添加
                          </button>
                          <button
                            onClick={() => { setAddFormCat(null); setNewItemName(''); setNewItemWeight(''); }}
                            style={{
                              padding: '6px 8px',
                              borderRadius: 6,
                              border: '1px solid #E8E4DE',
                              background: '#fff',
                              cursor: 'pointer',
                              fontSize: 13,
                              color: '#7A7A7A',
                              transition: '0.2s ease-out',
                            }}
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAddFormCat(cat)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '8px 16px',
                            margin: '4px 0',
                            border: '1px dashed #E8E4DE',
                            borderRadius: 10,
                            background: 'transparent',
                            color: '#BFBFBF',
                            cursor: 'pointer',
                            fontSize: 13,
                            width: '100%',
                            transition: '0.2s ease-out',
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = '#4A90D9';
                            (e.currentTarget as HTMLButtonElement).style.color = '#4A90D9';
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = '#E8E4DE';
                            (e.currentTarget as HTMLButtonElement).style.color = '#BFBFBF';
                          }}
                        >
                          + 添加物品
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {showExport && (
        <div className="modal-overlay" onClick={() => { setShowExport(false); setExportBtnState('arrow'); }}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'rgba(255,255,255,0.92)',
              borderRadius: 20,
              padding: 32,
              maxWidth: 520,
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#4A90D9' }}>
              📋 清单报告
            </h3>
            <pre style={{
              fontFamily: "'SF Mono', 'Consolas', 'Monaco', monospace",
              fontSize: 13,
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
              color: '#2D2D2D',
              background: '#FDFCFA',
              padding: 20,
              borderRadius: 12,
              border: '1px solid #E8E4DE',
            }}>
              {typedText}
              <span style={{ animation: 'typewriter 0.5s infinite alternate' }}>▌</span>
            </pre>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(exportText);
                }}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  border: '1px solid #E8E4DE',
                  background: '#fff',
                  cursor: 'pointer',
                  fontSize: 13,
                  transition: '0.2s ease-out',
                }}
              >
                📋 复制文本
              </button>
              <button
                onClick={() => { setShowExport(false); setExportBtnState('arrow'); }}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#4A90D9',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 13,
                  transition: '0.2s ease-out',
                }}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListPage;
