import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useListStore } from '../store/listStore';
import { ShoppingItem } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { ingredientSuggestions, getIngredientPrice } from '../data/mockRecipes';

const ListPage = () => {
  const items = useListStore((state) => state.items);
  const addItem = useListStore((state) => state.addItem);
  const removeItem = useListStore((state) => state.removeItem);
  const togglePurchased = useListStore((state) => state.togglePurchased);
  const updateItemQuantity = useListStore((state) => state.updateItemQuantity);
  const updateItemPrice = useListStore((state) => state.updateItemPrice);
  const clearPurchased = useListStore((state) => state.clearPurchased);
  const getTotalPrice = useListStore((state) => state.getTotalPrice);

  const [displayedTotal, setDisplayedTotal] = useState(0);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newQuantity, setNewQuantity] = useState('1');
  const [newUnit, setNewUnit] = useState('个');
  const [newPrice, setNewPrice] = useState('');

  const totalPrice = getTotalPrice();

  useEffect(() => {
    const start = displayedTotal;
    const end = totalPrice;
    const duration = 500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayedTotal(start + (end - start) * ease);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [totalPrice]);

  const handleClearPurchased = async () => {
    const purchasedIds = items.filter((i) => i.purchased).map((i) => i.id);
    setRemovingIds(new Set(purchasedIds));
    setTimeout(() => {
      clearPurchased();
      setRemovingIds(new Set());
    }, 300);
  };

  const handleToggle = (id: string) => {
    togglePurchased(id);
  };

  const handleAddItem = async () => {
    if (!newName.trim()) return;
    const suggestion = ingredientSuggestions.find((s) => s.name === newName.trim());
    await addItem({
      name: newName.trim(),
      emoji: suggestion?.emoji || '🥗',
      quantity: parseFloat(newQuantity) || 1,
      unit: newUnit || '个',
      price: parseFloat(newPrice) || getIngredientPrice(newName.trim()),
      purchased: false,
    });
    setNewName('');
    setNewQuantity('1');
    setNewUnit('个');
    setNewPrice('');
    setShowAddForm(false);
  };

  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);

  const handleNameChange = (value: string) => {
    setNewName(value);
    if (value) {
      const filtered = ingredientSuggestions
        .filter((s) => s.name.includes(value))
        .slice(0, 5)
        .map((s) => s.name);
      setNameSuggestions(filtered);
      const match = ingredientSuggestions.find((s) => s.name === value);
      if (match && !newPrice) {
        setNewPrice(String(getIngredientPrice(value)));
      }
    } else {
      setNameSuggestions([]);
    }
  };

  const selectSuggestion = (name: string) => {
    setNewName(name);
    setNewPrice(String(getIngredientPrice(name)));
    setNameSuggestions([]);
  };

  const purchasedCount = items.filter((i) => i.purchased).length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Sidebar />

      <div style={{ marginLeft: '240px', minHeight: '100vh' }} className="list-page">
        <style>{`
          @media (max-width: 1024px) {
            .list-page { margin-left: 0 !important; padding-top: 60px !important; }
          }
        `}</style>

        <main style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, var(--color-sidebar-start), var(--color-sidebar-end))',
              borderRadius: 'var(--radius-xl)',
              padding: '32px',
              color: 'white',
              marginBottom: '24px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-30px',
                right: '-20px',
                fontSize: '140px',
                opacity: 0.15,
              }}
            >
              🛒
            </div>
            <p style={{ opacity: 0.8, fontSize: '14px', marginBottom: '8px' }}>预估总花费</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '28px', fontWeight: 600 }}>¥</span>
              <span
                key={totalPrice}
                className="number-bounce"
                style={{ fontSize: '48px', fontWeight: 700, lineHeight: 1 }}
              >
                {displayedTotal.toFixed(2)}
              </span>
            </div>
            <p style={{ marginTop: '8px', opacity: 0.7, fontSize: '13px' }}>
              共 {items.length} 项，已采购 {purchasedCount} 项
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <h1 style={{ fontSize: '24px', fontWeight: 700 }}>🛒 采购清单</h1>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="hover-scale"
                style={{
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-xl)',
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '14px',
                }}
              >
                + 添加食材
              </button>
              {purchasedCount > 0 && (
                <button
                  onClick={handleClearPurchased}
                  className="hover-scale"
                  style={{
                    padding: '10px 20px',
                    borderRadius: 'var(--radius-xl)',
                    border: '2px solid var(--color-success)',
                    color: 'var(--color-success)',
                    fontWeight: 600,
                    fontSize: '14px',
                    background: 'transparent',
                  }}
                >
                  ✓ 清空已购 ({purchasedCount})
                </button>
              )}
            </div>
          </div>

          {showAddForm && (
            <div
              style={{
                background: 'var(--color-card)',
                border: '2px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                marginBottom: '20px',
                animation: 'fadeIn 0.3s ease',
              }}
              className="card-fade-in"
            >
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>添加新食材</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '12px' }} className="add-grid">
                <style>{`
                  @media (max-width: 640px) {
                    .add-grid { grid-template-columns: 1fr 1fr !important; }
                  }
                `}</style>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="食材名称"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid rgba(46,134,171,0.3)',
                      fontSize: '14px',
                    }}
                  />
                  {nameSuggestions.length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '4px',
                        background: 'white',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-lg)',
                        zIndex: 10,
                      }}
                    >
                      {nameSuggestions.map((name) => (
                        <button
                          key={name}
                          onClick={() => selectSuggestion(name)}
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '10px 14px',
                            textAlign: 'left',
                            fontSize: '14px',
                            borderRadius: 'var(--radius-sm)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--color-bg)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          {ingredientSuggestions.find((s) => s.name === name)?.emoji} {name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="number"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                  placeholder="数量"
                  min="0"
                  step="0.1"
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(46,134,171,0.3)',
                    fontSize: '14px',
                  }}
                />
                <input
                  type="text"
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  placeholder="单位"
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(46,134,171,0.3)',
                    fontSize: '14px',
                  }}
                />
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="单价(¥)"
                  min="0"
                  step="0.1"
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(46,134,171,0.3)',
                    fontSize: '14px',
                  }}
                />
                <button
                  onClick={handleAddItem}
                  disabled={!newName.trim()}
                  className="hover-scale"
                  style={{
                    padding: '10px 20px',
                    borderRadius: 'var(--radius-md)',
                    background: newName.trim() ? 'var(--color-success)' : '#ccc',
                    color: 'white',
                    fontWeight: 600,
                    cursor: newName.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  添加
                </button>
              </div>
            </div>
          )}

          {items.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '80px 20px',
                background: 'var(--color-card)',
                border: '2px dashed var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                color: 'var(--color-text-light)',
              }}
            >
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🛒</div>
              <p style={{ fontSize: '18px', marginBottom: '8px' }}>采购清单是空的</p>
              <p style={{ fontSize: '14px' }}>从菜谱详情页添加缺少的食材，或手动添加</p>
            </div>
          ) : (
            <div
              style={{
                background: 'var(--color-card)',
                border: '2px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
              }}
            >
              {items.map((item: ShoppingItem, index: number) => (
                <div
                  key={item.id}
                  className={[
                    removingIds.has(item.id) ? 'shrink-out' : '',
                    item.purchased ? 'sweep-animation' : '',
                  ].join(' ')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px 20px',
                    borderBottom: index < items.length - 1 ? '1px solid rgba(46,134,171,0.1)' : 'none',
                    background: item.purchased ? 'var(--color-success-light)' : 'transparent',
                    transition: 'background var(--transition-normal)',
                  }}
                >
                  <label
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      border: `2px solid ${item.purchased ? 'var(--color-success)' : 'var(--color-border)'}`,
                      background: item.purchased ? 'var(--color-success)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '14px',
                      flexShrink: 0,
                    }}
                    onClick={() => handleToggle(item.id)}
                  >
                    {item.purchased && '✓'}
                  </label>

                  <span style={{ fontSize: '28px' }}>{item.emoji}</span>

                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        fontWeight: 500,
                        color: item.purchased ? 'var(--color-text-light)' : 'var(--color-text)',
                        textDecoration: item.purchased ? 'line-through' : 'none',
                      }}
                    >
                      {item.name}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>
                      {item.quantity} {item.unit}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItemQuantity(item.id, parseFloat(e.target.value) || 0)}
                      style={{
                        width: '60px',
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid rgba(46,134,171,0.2)',
                        fontSize: '13px',
                        textAlign: 'center',
                      }}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--color-text-light)', width: '24px' }}>
                      {item.unit}
                    </span>
                    <span
                      style={{
                        fontWeight: 600,
                        color: 'var(--color-primary)',
                        minWidth: '60px',
                        textAlign: 'right',
                      }}
                    >
                      ¥{item.price.toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="hover-scale"
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      color: 'var(--color-danger)',
                      fontSize: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--color-danger-light)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ListPage;
