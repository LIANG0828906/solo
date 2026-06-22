import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { InventoryItem, Recipe, ExpiryStatus } from './types';
import { api } from './api';
import './InventoryManager.css';

interface Props {
  inventory: InventoryItem[];
  setInventory: (inv: InventoryItem[]) => void;
  onStartCook: (recipeId: string) => Promise<void>;
  recipes?: Recipe[];
}

const COMMON_UNITS = ['个', '克', '毫升', '斤', '包', '瓶', '袋', '根', '块'];
const CATEGORIES = ['蔬菜', '肉类', '蛋类', '乳制品', '调料', '水果', '主食', '其他'];

export default function InventoryManager({ inventory, setInventory, onStartCook, recipes = [] }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<InventoryItem>>(defaultForm());
  const [recommended, setRecommended] = useState<
    Array<{ recipe: Recipe; canMake: boolean; missingCount: number; ingredientStatus: any[] }>
  >([]);
  const [loadingRec, setLoadingRec] = useState(false);
  const [filter, setFilter] = useState('');
  const [cookingId, setCookingId] = useState<string | null>(null);

  function defaultForm(): Partial<InventoryItem> {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 86400000);
    return {
      name: '',
      quantity: 0,
      unit: '个',
      category: '蔬菜',
      purchaseDate: today.toISOString().split('T')[0],
      expiryDate: nextWeek.toISOString().split('T')[0],
    };
  }

  useEffect(() => {
    loadRecommendations();
  }, [inventory.length]);

  const loadRecommendations = async () => {
    setLoadingRec(true);
    try {
      const data = await api.getRecommendedRecipes();
      setRecommended(data);
    } finally {
      setLoadingRec(false);
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(defaultForm());
    setShowForm(true);
  };
  const openEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setForm({ ...item });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) return;
    try {
      if (editingId) {
        const updated = await api.updateInventory(editingId, form);
        setInventory(inventory.map(i => (i.id === editingId ? updated : i)));
      } else {
        const created = await api.createInventory(form);
        setInventory([...inventory, created]);
      }
      setShowForm(false);
      loadRecommendations();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此食材？')) return;
    try {
      await api.deleteInventory(id);
      setInventory(inventory.filter(i => i.id !== id));
      loadRecommendations();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleStartCook = async (recipeId: string) => {
    if (!confirm('开始制作此菜品，将自动扣除所需食材。确认继续？')) return;
    setCookingId(recipeId);
    try {
      await onStartCook(recipeId);
      loadRecommendations();
    } finally {
      setCookingId(null);
    }
  };

  const getExpiryInfo = (item: InventoryItem): { days: number; status: ExpiryStatus; color: string; label: string } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(item.expiryDate);
    exp.setHours(0, 0, 0, 0);
    const days = Math.round((exp.getTime() - today.getTime()) / 86400000);
    let status: ExpiryStatus = 'fresh';
    let color = 'var(--color-expiry-fresh)';
    let label = `${days}天`;
    if (days < 0) {
      status = 'expired';
      color = 'var(--color-expiry-expired)';
      label = `已过期${-days}天`;
    } else if (days <= 1) {
      status = 'danger';
      color = 'var(--color-expiry-danger)';
      label = `剩${days}天`;
    } else if (days <= 3) {
      status = 'warning';
      color = 'var(--color-expiry-warning)';
      label = `剩${days}天`;
    } else if (days <= 7) {
      status = 'good';
      color = 'var(--color-expiry-good)';
      label = `剩${days}天`;
    } else {
      status = 'fresh';
      color = 'var(--color-expiry-fresh)';
      label = `剩${days}天`;
    }
    return { days, status, color, label };
  };

  const filteredInventory = filter
    ? inventory.filter(i => i.name.toLowerCase().includes(filter.toLowerCase()) || i.category.includes(filter))
    : inventory;

  return (
    <div className="inventory-manager fade-in">
      <div className="inv-header">
        <div className="inv-title-row">
          <h2>🥬 食材库存</h2>
          <button className="btn-primary" onClick={openAdd}>+ 添加食材</button>
        </div>
        <input
          className="inv-search"
          type="text"
          placeholder="搜索食材名称或分类..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
        <div className="inv-summary">
          <span>共 {inventory.length} 种食材</span>
          <span style={{ color: 'var(--color-expiry-warning)' }}>
            临期: {inventory.filter(i => ['warning', 'danger'].includes(getExpiryInfo(i).status)).length}
          </span>
          <span style={{ color: 'var(--color-expiry-expired)' }}>
            过期: {inventory.filter(i => getExpiryInfo(i).status === 'expired').length}
          </span>
        </div>
      </div>

      {showForm && (
        <div className="inv-form-card fade-in">
          <h3>{editingId ? '编辑食材' : '添加新食材'}</h3>
          <form onSubmit={handleSubmit} className="inv-form">
            <div className="form-grid">
              <div className="form-col">
                <label>名称 *</label>
                <input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="例如：鸡蛋" required />
              </div>
              <div className="form-col"><label>分类</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="form-grid">
              <div className="form-col"><label>数量</label>
                <input type="number" min="0" step="0.1" value={form.quantity ?? 0} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} />
              </div>
              <div className="form-col"><label>单位</label>
                <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                  {COMMON_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div className="form-grid">
              <div className="form-col"><label>购买日期</label>
                <input type="date" value={form.purchaseDate} onChange={e => setForm({ ...form, purchaseDate: e.target.value })} />
              </div>
              <div className="form-col"><label>保质期至</label>
                <input type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>取消</button>
              <button type="submit" className="btn-primary">{editingId ? '更新' : '添加'}</button>
            </div>
          </form>
        </div>
      )}

      {filteredInventory.length === 0 ? (
        <div className="empty-state">
          <div className="empty-illustration">
            <svg viewBox="0 0 200 160" width="160" height="120">
              <ellipse cx="100" cy="145" rx="60" ry="8" fill="#E8DFD0" opacity="0.6" />
              <path d="M60 60 Q60 30 100 30 Q140 30 140 60 L140 130 Q140 140 130 140 L70 140 Q60 140 60 130 Z" fill="#FFF" stroke="#E8DFD0" strokeWidth="2" strokeDasharray="5,3"/>
              <circle cx="90" cy="80" r="3" fill="#CCC" />
              <circle cx="110" cy="80" r="3" fill="#CCC" />
              <path d="M85 100 Q100 92 115 100" stroke="#CCC" strokeWidth="2" fill="none" strokeLinecap="round"/>
              <text x="100" y="158" textAnchor="middle" fill="#AAA" fontSize="12" fontFamily="sans-serif">还没有食材哦~</text>
            </svg>
          </div>
          <p>快添加一些食材开始管理吧！</p>
        </div>
      ) : (
        <div className="inv-grid">
          {filteredInventory.map(item => {
            const exp = getExpiryInfo(item);
            return (
              <div
                key={item.id}
                className={`inv-card ${exp.status === 'expired' ? 'blink-warning' : ''}`}
                style={{ borderLeft: `4px solid ${exp.color}` }}
              >
                <div className="inv-card-top">
                  <div>
                    <div className="inv-name">{item.name}</div>
                    <div className="inv-category">{item.category}</div>
                  </div>
                  <div className="inv-actions">
                    <button className="icon-btn" title="编辑" onClick={() => openEdit(item)}>✏️</button>
                    <button className="icon-btn del" title="删除" onClick={() => handleDelete(item.id)}>🗑️</button>
                  </div>
                </div>
                <div className="inv-card-middle">
                  <span className="inv-qty">{item.quantity}</span>
                  <span className="inv-unit">{item.unit}</span>
                </div>
                <div className="inv-card-bottom">
                  <span className="expiry-badge" style={{ background: exp.color + '20', color: exp.color, border: `1px solid ${exp.color}40` }}>
                    {exp.status === 'expired' ? '⚠️ ' : ''}{exp.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="recommend-section">
        <div className="section-head">
          <h3>🍽️ 根据库存可制作</h3>
          <button className="btn-secondary refresh-btn" onClick={loadRecommendations}>🔄 刷新推荐</button>
        </div>
        {loadingRec ? (
          <div className="skeleton-list">
            {[1,2,3].map(i => <div key={i} className="skeleton rec-skeleton" style={{ height: '80px' }} />)}
          </div>
        ) : recommended.length === 0 ? (
          <div className="empty-tip">暂无可推荐食谱</div>
        ) : (
          <div className="recommend-list">
            {recommended.map(({ recipe, canMake, missingCount, ingredientStatus }) => (
              <div key={recipe.id} className={`recommend-item ${canMake ? 'can-make' : 'missing'}`}>
                <div className="rec-cover">
                  <img src={recipe.coverImage || 'https://via.placeholder.com/80?text=R'} alt="" />
                </div>
                <div className="rec-info">
                  <div className="rec-name">
                    {recipe.name}
                    {canMake && <span className="badge-can">✓ 可制作</span>}
                    {!canMake && <span className="badge-miss">缺{missingCount}种</span>}
                  </div>
                  <div className="rec-meta">⏱ {recipe.totalTime}分钟 · ⭐ {recipe.averageRating.toFixed(1)}</div>
                  <div className="rec-ing-status">
                    {ingredientStatus.slice(0, 4).map(s => (
                      <span key={s.name} className={`ing-status ${s.enough ? 'ok' : 'no'}`}>
                        {s.name} {s.enough ? '✓' : `(${s.available}/${s.required})`}
                      </span>
                    ))}
                    {ingredientStatus.length > 4 && <span>...</span>}
                  </div>
                </div>
                <div className="rec-action">
                  <button
                    className="btn-primary cook-btn"
                    disabled={!canMake || cookingId === recipe.id}
                    onClick={() => handleStartCook(recipe.id)}
                  >
                    {cookingId === recipe.id ? '制作中...' : '开始制作'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
