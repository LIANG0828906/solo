import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card, DeckCard } from '../types';
import { useAppContext } from '../App';
import { deckApi } from '../api';

interface DragItem {
  card: Card;
  fromSide: 'left' | 'right';
}

const DeckBuilder: React.FC = () => {
  const { cards, decks, setCurrentDeck, currentDeck, refreshDecks } = useAppContext();
  const [deckName, setDeckName] = useState('我的卡组');
  const [deckCards, setDeckCards] = useState<DeckCard[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState('all');
  const [costFilter, setCostFilter] = useState('all');
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragItem, setDragItem] = useState<DragItem | null>(null);
  const [ghostPos, setGhostPos] = useState({ x: 0, y: 0 });
  const [bouncingCards, setBouncingCards] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  const rafRef = useRef<number | null>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (currentDeck) {
      setDeckName(currentDeck.name);
      setDeckCards(currentDeck.cards);
      setEditingDeckId(currentDeck.id);
    } else {
      resetDeck();
    }
  }, [currentDeck]);

  const resetDeck = () => {
    setDeckName('我的卡组');
    setDeckCards([]);
    setEditingDeckId(null);
    setCurrentDeck(null);
  };

  const filteredCards = useMemo(() => {
    return cards.filter((c) => {
      const matchSearch = !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchRarity = rarityFilter === 'all' || c.rarity === rarityFilter;
      let matchCost = costFilter === 'all';
      if (!matchCost) {
        if (costFilter === '7+') matchCost = c.cost >= 7;
        else matchCost = c.cost === parseInt(costFilter);
      }
      return matchSearch && matchRarity && matchCost;
    });
  }, [cards, searchQuery, rarityFilter, costFilter]);

  const totalCards = deckCards.reduce((sum, dc) => sum + dc.count, 0);
  const totalCost = deckCards.reduce((sum, dc) => {
    const card = cards.find((c) => c.id === dc.cardId);
    return sum + (card ? card.cost * dc.count : 0);
  }, 0);
  const avgCost = totalCards > 0 ? (totalCost / totalCards).toFixed(1) : '0';

  const isValid = totalCards >= 30;

  const costDistribution = useMemo(() => {
    const dist = Array(8).fill(0);
    deckCards.forEach((dc) => {
      const card = cards.find((c) => c.id === dc.cardId);
      if (card) {
        const idx = Math.min(card.cost, 7);
        dist[idx] += dc.count;
      }
    });
    return dist;
  }, [deckCards, cards]);

  const maxBar = Math.max(...costDistribution, 1);

  const triggerBounce = (cardId: string) => {
    setBouncingCards((prev) => new Set(prev).add(cardId));
    setTimeout(() => {
      setBouncingCards((prev) => {
        const next = new Set(prev);
        next.delete(cardId);
        return next;
      });
    }, 400);
  };

  const addCard = (card: Card) => {
    const existing = deckCards.find((dc) => dc.cardId === card.id);
    if (existing) {
      if (existing.count >= 2) {
        showMessage('error', `【${card.name}】最多2张`);
        return;
      }
      setDeckCards(
        deckCards.map((dc) =>
          dc.cardId === card.id ? { ...dc, count: dc.count + 1 } : dc
        )
      );
    } else {
      setDeckCards([...deckCards, { cardId: card.id, count: 1 }]);
    }
    triggerBounce(card.id);
  };

  const removeCard = (cardId: string) => {
    const existing = deckCards.find((dc) => dc.cardId === cardId);
    if (!existing) return;
    if (existing.count <= 1) {
      setDeckCards(deckCards.filter((dc) => dc.cardId !== cardId));
    } else {
      setDeckCards(
        deckCards.map((dc) =>
          dc.cardId === cardId ? { ...dc, count: dc.count - 1 } : dc
        )
      );
    }
  };

  const clearCard = (cardId: string) => {
    setDeckCards(deckCards.filter((dc) => dc.cardId !== cardId));
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 2500);
  };

  const handleSave = async () => {
    if (deckCards.length === 0) {
      showMessage('error', '卡组不能为空');
      return;
    }
    if (!isValid) {
      showMessage('error', '卡组至少需要30张');
      return;
    }
    if (!deckName.trim()) {
      showMessage('error', '请输入卡组名称');
      return;
    }
    if (!editingDeckId && decks.length >= 5) {
      showMessage('error', '卡组数量已达上限（最多5套）');
      return;
    }
    try {
      const sortedCards = [...deckCards].sort((a, b) => {
        const ca = cards.find((c) => c.id === a.cardId);
        const cb = cards.find((c) => c.id === b.cardId);
        return (ca?.cost || 0) - (cb?.cost || 0);
      });
      if (editingDeckId) {
        await deckApi.update(editingDeckId, { name: deckName.trim(), cards: sortedCards });
        showMessage('success', '卡组更新成功');
      } else {
        await deckApi.create({ name: deckName.trim(), cards: sortedCards });
        showMessage('success', '卡组创建成功');
      }
      await refreshDecks();
      resetDeck();
    } catch (err: any) {
      showMessage('error', err.response?.data?.error || '保存失败');
    }
  };

  const handleDeleteDeck = async (deckId: string) => {
    if (!confirm('确定删除该卡组吗？')) return;
    try {
      await deckApi.delete(deckId);
      await refreshDecks();
      if (editingDeckId === deckId) resetDeck();
      showMessage('success', '删除成功');
    } catch (err) {
      showMessage('error', '删除失败');
    }
  };

  const handleRenameDeck = async (deckId: string, oldName: string) => {
    const newName = prompt('修改卡组名称:', oldName);
    if (!newName || newName.trim() === oldName) return;
    try {
      await deckApi.update(deckId, { name: newName.trim() });
      await refreshDecks();
      if (editingDeckId === deckId) setDeckName(newName.trim());
      showMessage('success', '重命名成功');
    } catch (err) {
      showMessage('error', '重命名失败');
    }
  };

  const handleDragStart = (e: React.DragEvent, card: Card, fromSide: 'left' | 'right') => {
    setDragItem({ card, fromSide });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', card.id);
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  useEffect(() => {
    if (!dragItem) return;
    const handleMove = (e: MouseEvent) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setGhostPos({ x: e.clientX, y: e.clientY });
      });
    };
    const handleEnd = () => {
      setDragItem(null);
      setIsDragOver(false);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [dragItem]);

  const sortedDeckCards = useMemo(() => {
    return [...deckCards].sort((a, b) => {
      const ca = cards.find((c) => c.id === a.cardId);
      const cb = cards.find((c) => c.id === b.cardId);
      return (ca?.cost || 0) - (cb?.cost || 0);
    });
  }, [deckCards, cards]);

  return (
    <div>
      <div className="page-title">
        <span>📚</span>
        <span>卡组构建</span>
        <button className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }} onClick={resetDeck}>
          🔄 新建卡组
        </button>
      </div>

      {message && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            padding: '12px 20px',
            borderRadius: 8,
            background: message.type === 'success' ? 'rgba(16,185,129,0.95)' : 'rgba(239,68,68,0.95)',
            color: 'white',
            fontWeight: 500,
            zIndex: 9999,
            animation: 'fadeInUp 0.3s ease',
          }}
        >
          {message.text}
        </div>
      )}

      {decks.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div className="section-title">
            已保存卡组（{decks.length}/5）
          </div>
          <div className="decks-list">
            {decks.map((d) => (
              <div key={d.id} className="deck-preview">
                <div className="deck-preview-header">
                  <div className="deck-preview-name">{d.name}</div>
                  <div className="deck-preview-count">
                    {d.cards.reduce((s, x) => s + x.count, 0)}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {d.cards.length} 种卡牌
                </div>
                <div className="deck-preview-footer">
                  <div className="deck-preview-date">
                    {new Date(d.updatedAt).toLocaleDateString()}
                  </div>
                  <div className="deck-preview-actions">
                    <button
                      className="icon-btn"
                      title="编辑"
                      onClick={() => setCurrentDeck(d)}
                    >
                      ✏️
                    </button>
                    <button
                      className="icon-btn"
                      title="重命名"
                      onClick={() => handleRenameDeck(d.id, d.name)}
                    >
                      🏷️
                    </button>
                    <button
                      className="icon-btn danger"
                      title="删除"
                      onClick={() => handleDeleteDeck(d.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="deck-builder">
        <div className="deck-filter-panel">
          <div className="filter-group">
            <input
              type="text"
              className="filter-search"
              placeholder="🔍 搜索卡牌..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <div className="filter-label">稀有度</div>
            <div className="filter-row">
              {[
                { v: 'all', n: '全部' },
                { v: 'common', n: '普' },
                { v: 'rare', n: '稀' },
                { v: 'epic', n: '史' },
                { v: 'legendary', n: '传' },
              ].map((r) => (
                <span
                  key={r.v}
                  className={`filter-chip ${rarityFilter === r.v ? 'active' : ''}`}
                  onClick={() => setRarityFilter(r.v)}
                >
                  {r.n}
                </span>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <div className="filter-label">费用</div>
            <div className="filter-row">
              {[
                { v: 'all', n: '全' },
                ...[0, 1, 2, 3, 4, 5, 6].map((n) => ({ v: String(n), n: String(n) })),
                { v: '7+', n: '7+' },
              ].map((c) => (
                <span
                  key={c.v}
                  className={`filter-chip ${costFilter === c.v ? 'active' : ''}`}
                  onClick={() => setCostFilter(c.v)}
                >
                  {c.n}
                </span>
              ))}
            </div>
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            卡牌列表（{filteredCards.length}）· 拖拽或点击添加
          </div>

          <div className="filter-card-list">
            {filteredCards.map((card) => {
              const inDeck = deckCards.find((dc) => dc.cardId === card.id);
              return (
                <div
                  key={card.id}
                  className={`filter-card-item rarity-${card.rarity}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, card, 'left')}
                  onClick={() => addCard(card)}
                >
                  <img
                    src={card.image}
                    alt={card.name}
                    className="fc-thumb"
                    loading="lazy"
                    onError={(e) => { ((e.currentTarget as HTMLImageElement).style.display = 'none'); }}
                  />
                  <div className="fc-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span className="card-cost" style={{ width: 18, height: 18, fontSize: 10 }}>
                        {card.cost}
                      </span>
                      <span className="fc-name" style={{ flex: 1 }}>{card.name}</span>
                    </div>
                    {inDeck && (
                      <span style={{
                        fontSize: 10,
                        padding: '1px 6px',
                        borderRadius: 4,
                        background: 'var(--accent)',
                        alignSelf: 'flex-start',
                        fontWeight: 'bold',
                      }}>×{inDeck.count}</span>
                    )}
                    <div className="fc-stats">
                      <span style={{ color: '#f87171' }}>⚔{card.attack}</span>
                      <span style={{ color: '#4ade80' }}>❤{card.health}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="deck-build-area">
          <div className="deck-header">
            <input
              className="deck-name-input"
              placeholder="输入卡组名称..."
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
            />
            <div className="deck-stats">
              <div className="deck-stat-item">
                <div className="deck-stat-value">{totalCards}</div>
                <div className="deck-stat-label">总张数（≥30）</div>
              </div>
              <div className="deck-stat-item">
                <div className="deck-stat-value">{avgCost}</div>
                <div className="deck-stat-label">平均费用</div>
              </div>
              <div className="deck-stat-item">
                <div className="deck-stat-value">{deckCards.length}</div>
                <div className="deck-stat-label">种类</div>
              </div>
            </div>
            <button
              className={`btn ${isValid ? 'btn-primary' : 'btn-secondary'}`}
              onClick={handleSave}
              disabled={!isValid}
            >
              {editingDeckId ? '💾 更新卡组' : '✨ 保存卡组'}
            </button>
          </div>

          <div className={`validation-status ${isValid ? 'valid' : 'invalid'}`}>
            <span>{isValid ? '✅' : '⚠️'}</span>
            <span>
              {isValid
                ? '卡组已满足构建条件'
                : `还差 ${30 - totalCards} 张卡牌`}
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 12, opacity: 0.8 }}>
              每张牌最多2张
            </span>
          </div>

          <div className="cost-curve-chart">
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
              费用曲线
            </div>
            <div className="bars-container">
              {costDistribution.map((v, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div className="bar-item" style={{
                    height: `${(v / maxBar) * 100}%`,
                    width: '70%',
                  }}>
                    {v > 0 && <span className="bar-value">{v}</span>}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', marginTop: 4 }}>
              {['0', '1', '2', '3', '4', '5', '6', '7+'].map((l, i) => (
                <div key={i} className="bar-label" style={{ flex: 1 }}>{l}</div>
              ))}
            </div>
          </div>

          <div
            className={`deck-drop-zone ${isDragOver ? 'drag-over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              if (dragItem && dragItem.fromSide === 'left') {
                addCard(dragItem.card);
              }
            }}
          >
            {deckCards.length === 0 ? (
              <div className="deck-empty-hint">
                <div style={{ fontSize: 64 }}>🃏</div>
                <div style={{ fontSize: 18 }}>从左侧拖拽或点击卡牌添加到此处</div>
                <div style={{ fontSize: 13, opacity: 0.7 }}>
                  至少30张卡牌，每张最多2张
                </div>
              </div>
            ) : (
              <div className="deck-cards-list">
                {sortedDeckCards.map((dc) => {
                  const card = cards.find((c) => c.id === dc.cardId);
                  if (!card) return null;
                  const isBouncing = bouncingCards.has(card.id);
                  return (
                    <div
                      key={dc.cardId}
                      className={`deck-card-row rarity-${card.rarity} ${isBouncing ? 'bounce' : ''}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, card, 'right')}
                      onDragEnd={() => {
                        if (dragItem?.fromSide === 'right') {
                          clearCard(dc.cardId);
                        }
                      }}
                    >
                      <div className="dc-cost">{card.cost}</div>
                      <div className="dc-name">{card.name}</div>
                      <div className="dc-stats">
                        <span style={{ color: '#f87171' }}>⚔{card.attack}</span>
                        <span style={{ color: '#4ade80' }}>❤{card.health}</span>
                      </div>
                      <div className="dc-count-controls">
                        <button
                          className="dc-count-btn"
                          onClick={(e) => { e.stopPropagation(); removeCard(dc.cardId); }}
                          disabled={dc.count <= 1}
                        >
                          −
                        </button>
                        <span className="dc-count">×{dc.count}</span>
                        <button
                          className="dc-count-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (dc.count >= 2) {
                              showMessage('error', `【${card.name}】最多2张`);
                              return;
                            }
                            addCard(card);
                          }}
                          disabled={dc.count >= 2}
                        >
                          +
                        </button>
                      </div>
                      <div className="dc-remove" onClick={(e) => { e.stopPropagation(); clearCard(dc.cardId); }}>
                        ✕
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {dragItem && (
        <div
          ref={ghostRef}
          className="drag-ghost"
          style={{
            left: ghostPos.x + 12,
            top: ghostPos.y + 12,
          }}
        >
          <div
            className={`filter-card-item rarity-${dragItem.card.rarity}`}
            style={{ width: 80, height: 107 }}
          >
            <img
              src={dragItem.card.image}
              alt=""
              className="fc-thumb"
              style={{ height: '45%' }}
              onError={(e) => { ((e.currentTarget as HTMLImageElement).style.display = 'none'); }}
            />
            <div className="fc-info">
              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <span className="card-cost" style={{ width: 16, height: 16, fontSize: 9 }}>
                  {dragItem.card.cost}
                </span>
                <span className="fc-name">{dragItem.card.name}</span>
              </div>
              <div className="fc-stats">
                <span style={{ color: '#f87171', fontSize: 10 }}>⚔{dragItem.card.attack}</span>
                <span style={{ color: '#4ade80', fontSize: 10 }}>❤{dragItem.card.health}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeckBuilder;
