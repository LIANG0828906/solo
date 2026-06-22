import React, { useState, useMemo, useEffect } from 'react';
import {
  Ingredient,
  FreshnessStatus,
  getFreshnessStatus,
  getDaysLeft,
  getFreshnessPercentage,
  addIngredient,
  updateIngredient,
  deleteIngredient,
  deleteAllExpiredIngredients,
} from './data';

interface Props {
  ingredients: Ingredient[];
  onChanged: () => void;
}

interface FormState {
  name: string;
  quantity: string;
  unit: string;
  expiryDate: string;
}

const emptyForm: FormState = {
  name: '',
  quantity: '',
  unit: '克',
  expiryDate: '',
};

const styles = `
  .im-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 24px;
    align-items: center;
  }

  .im-search-wrap {
    position: relative;
    flex: 1;
    min-width: 220px;
    max-width: 400px;
  }

  .im-search {
    width: 100%;
    padding: 12px 16px 12px 44px;
    font-size: 15px;
    border: 2px solid rgba(139, 69, 19, 0.12);
    border-radius: 14px;
    background: #fff;
    color: #3E2723;
    outline: none;
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .im-search:focus {
    border-color: #F97316;
    box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.12);
  }

  .im-search-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 18px;
    opacity: 0.5;
    pointer-events: none;
  }

  .btn {
    padding: 12px 20px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: inherit;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
  }

  .btn-primary {
    background: linear-gradient(135deg, #F97316 0%, #EA580C 100%);
    color: #fff;
    box-shadow: 0 4px 14px rgba(249, 115, 22, 0.3);
  }

  .btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(249, 115, 22, 0.38);
  }

  .btn-primary:active {
    transform: translateY(0) scale(0.98);
  }

  .btn-danger {
    background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
    color: #fff;
    box-shadow: 0 4px 14px rgba(239, 68, 68, 0.25);
  }

  .btn-danger:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(239, 68, 68, 0.35);
  }

  .btn-danger:active {
    transform: translateY(0) scale(0.98);
  }

  .btn-ghost {
    background: rgba(139, 69, 19, 0.08);
    color: #6D4C41;
  }

  .btn-ghost:hover {
    background: rgba(139, 69, 19, 0.15);
    transform: translateY(-1px);
  }

  .btn-ghost:active {
    transform: translateY(0) scale(0.98);
  }

  .im-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }

  @media (max-width: 640px) {
    .im-grid {
      grid-template-columns: 1fr;
      gap: 12px;
    }
  }

  .ing-card {
    background: #fff;
    border-radius: 16px;
    padding: 16px 18px;
    border: 1px solid rgba(139, 69, 19, 0.08);
    box-shadow: 0 2px 10px rgba(139, 69, 19, 0.06);
    position: relative;
    transition: all 0.25s ease;
    overflow: hidden;
  }

  .ing-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 22px rgba(139, 69, 19, 0.12);
  }

  .ing-card.expired {
    background: #F5F5F5;
    filter: grayscale(0.8);
    opacity: 0.85;
  }

  .expired-badge {
    position: absolute;
    top: 12px;
    right: 12px;
    background: #9CA3AF;
    color: #fff;
    padding: 3px 10px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .ing-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 12px;
    padding-right: 80px;
  }

  .ing-name {
    font-size: 17px;
    font-weight: 700;
    color: #3E2723;
    margin-bottom: 6px;
    line-height: 1.3;
  }

  .ing-quantity {
    font-size: 14px;
    color: #8D6E63;
    font-weight: 500;
  }

  .ing-actions {
    display: flex;
    gap: 6px;
    position: absolute;
    top: 12px;
    right: 12px;
  }

  .ing-card.expired .ing-actions {
    right: 90px;
  }

  .icon-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: none;
    background: rgba(139, 69, 19, 0.06);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    transition: all 0.2s ease;
  }

  .icon-btn:hover {
    background: rgba(139, 69, 19, 0.14);
    transform: scale(1.08);
  }

  .icon-btn.delete:hover {
    background: rgba(239, 68, 68, 0.15);
  }

  .freshness-section {
    margin-top: 4px;
  }

  .freshness-label {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    margin-bottom: 6px;
    align-items: center;
  }

  .freshness-label .status {
    font-weight: 600;
  }

  .freshness-bar {
    width: 100%;
    height: 6px;
    background: rgba(139, 69, 19, 0.08);
    border-radius: 999px;
    overflow: hidden;
  }

  .freshness-fill {
    height: 100%;
    border-radius: 999px;
    transition: width 0.7s cubic-bezier(0.22, 1, 0.36, 1),
                background 0.4s ease;
  }

  .freshness-fill.fresh {
    background: linear-gradient(90deg, #86EFAC, #22C55E);
  }

  .freshness-fill.warning {
    background: linear-gradient(90deg, #FDBA74, #F97316);
  }

  .freshness-fill.danger {
    background: linear-gradient(90deg, #FCA5A5, #EF4444);
  }

  .freshness-fill.expired {
    background: #9CA3AF;
    width: 100% !important;
  }

  .status-text.fresh { color: #15803D; }
  .status-text.warning { color: #C2410C; }
  .status-text.danger { color: #B91C1C; }
  .status-text.expired { color: #6B7280; }

  .empty-ingredients {
    text-align: center;
    padding: 80px 20px;
    color: #A1887F;
  }

  .empty-ingredients .emoji {
    font-size: 64px;
    margin-bottom: 16px;
    display: block;
  }

  .empty-ingredients .title {
    font-size: 18px;
    font-weight: 600;
    color: #6D4C41;
    margin-bottom: 6px;
  }

  .empty-ingredients .desc {
    font-size: 14px;
  }

  .form-panel-overlay {
    position: fixed;
    inset: 0;
    background: rgba(62, 39, 35, 0.35);
    backdrop-filter: blur(2px);
    z-index: 100;
    animation: fadeIn 0.25s ease;
  }

  .form-panel {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    max-width: 440px;
    background: #FFF8F0;
    z-index: 101;
    box-shadow: -12px 0 40px rgba(62, 39, 35, 0.15);
    padding: 28px 24px;
    overflow-y: auto;
    animation: slideInRight 0.35s cubic-bezier(0.22, 1, 0.36, 1);
    display: flex;
    flex-direction: column;
  }

  @media (max-width: 500px) {
    .form-panel {
      max-width: 100%;
      border-radius: 20px 20px 0 0;
      top: 10%;
    }
  }

  @keyframes slideInRight {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }

  .form-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 28px;
  }

  .form-header h2 {
    font-size: 22px;
    font-weight: 800;
    color: #3E2723;
  }

  .close-btn {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    border: none;
    background: rgba(139, 69, 19, 0.08);
    cursor: pointer;
    font-size: 18px;
    transition: all 0.2s ease;
  }

  .close-btn:hover {
    background: rgba(139, 69, 19, 0.18);
    transform: rotate(90deg);
  }

  .form-group {
    margin-bottom: 18px;
  }

  .form-label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: #6D4C41;
    margin-bottom: 8px;
  }

  .form-input,
  .form-select {
    width: 100%;
    padding: 12px 14px;
    font-size: 15px;
    border: 2px solid rgba(139, 69, 19, 0.12);
    border-radius: 12px;
    background: #fff;
    color: #3E2723;
    outline: none;
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .form-input:focus,
  .form-select:focus {
    border-color: #F97316;
    box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.12);
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .form-actions {
    margin-top: auto;
    display: flex;
    gap: 10px;
    padding-top: 24px;
  }

  .form-actions .btn {
    flex: 1;
    justify-content: center;
  }

  .quick-units {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
  }

  .unit-chip {
    padding: 4px 10px;
    border-radius: 8px;
    background: rgba(139, 69, 19, 0.06);
    color: #6D4C41;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    border: 1.5px solid transparent;
    transition: all 0.15s ease;
  }

  .unit-chip:hover {
    background: rgba(249, 115, 22, 0.1);
  }

  .unit-chip.active {
    background: rgba(249, 115, 22, 0.15);
    border-color: #F97316;
    color: #C2410C;
    font-weight: 600;
  }

  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(62, 39, 35, 0.45);
    backdrop-filter: blur(4px);
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: fadeIn 0.2s ease;
  }

  .modal {
    background: #fff;
    border-radius: 20px;
    padding: 28px;
    max-width: 420px;
    width: 100%;
    box-shadow: 0 20px 60px rgba(62, 39, 35, 0.25);
    animation: modalPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes modalPop {
    from { transform: scale(0.9); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  .modal-icon {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    background: rgba(239, 68, 68, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    margin: 0 auto 16px;
  }

  .modal-title {
    font-size: 20px;
    font-weight: 800;
    color: #3E2723;
    text-align: center;
    margin-bottom: 8px;
  }

  .modal-desc {
    font-size: 14px;
    color: #6D4C41;
    text-align: center;
    line-height: 1.6;
    margin-bottom: 24px;
  }

  .modal-actions {
    display: flex;
    gap: 10px;
  }

  .modal-actions .btn {
    flex: 1;
    justify-content: center;
  }

  .error-text {
    color: #B91C1C;
    font-size: 12px;
    margin-top: 4px;
    font-weight: 500;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const commonUnits = ['克', '千克', '个', '根', '棵', '毫升', '升', '包', '盒', '把'];

const IngredientManager: React.FC<Props> = ({ ingredients, onChanged }) => {
  const [searchText, setSearchText] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sortedIngredients = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const filtered = q
      ? ingredients.filter((ing) => ing.name.toLowerCase().includes(q))
      : ingredients;
    return [...filtered].sort((a, b) => {
      const order = ['expired', 'danger', 'warning', 'fresh'] as FreshnessStatus[];
      const sa = order.indexOf(getFreshnessStatus(a));
      const sb = order.indexOf(getFreshnessStatus(b));
      if (sa !== sb) return sa - sb;
      return getDaysLeft(a) - getDaysLeft(b);
    });
  }, [ingredients, searchText]);

  const expiredCount = ingredients.filter(
    (i) => getFreshnessStatus(i) === 'expired'
  ).length;

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setFormOpen(true);
  };

  const openEditForm = (ing: Ingredient) => {
    setEditingId(ing.id);
    setForm({
      name: ing.name,
      quantity: String(ing.quantity),
      unit: ing.unit,
      expiryDate: ing.expiryDate,
    });
    setFormError(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    const qty = parseFloat(form.quantity);
    if (!name) {
      setFormError('请输入食材名称');
      return;
    }
    if (!form.quantity || isNaN(qty) || qty <= 0) {
      setFormError('请输入有效的数量');
      return;
    }
    if (!form.expiryDate) {
      setFormError('请选择过期日期');
      return;
    }

    try {
      if (editingId) {
        await updateIngredient({
          id: editingId,
          name,
          quantity: qty,
          unit: form.unit || '克',
          expiryDate: form.expiryDate,
        });
      } else {
        await addIngredient({
          name,
          quantity: qty,
          unit: form.unit || '克',
          expiryDate: form.expiryDate,
        });
      }
      onChanged();
      closeForm();
    } catch (err) {
      setFormError('保存失败，请重试');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这个食材吗？')) return;
    await deleteIngredient(id);
    onChanged();
  };

  const handleClearExpired = async () => {
    setConfirmModal(false);
    await deleteAllExpiredIngredients();
    onChanged();
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } catch {
      return iso;
    }
  };

  const statusText = (s: FreshnessStatus, days: number) => {
    switch (s) {
      case 'expired':
        return `已过期 ${-days} 天`;
      case 'danger':
        return `还剩 ${days} 天`;
      case 'warning':
        return `还剩 ${days} 天`;
      default:
        return `还剩 ${days} 天`;
    }
  };

  return (
    <>
      <style>{styles}</style>

      <div className="im-toolbar">
        <div className="im-search-wrap">
          <span className="im-search-icon">🔍</span>
          <input
            type="text"
            className="im-search"
            placeholder="搜索食材..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={openAddForm}>
          ➕ 添加食材
        </button>
        {expiredCount > 0 && (
          <button
            className="btn btn-danger"
            onClick={() => setConfirmModal(true)}
          >
            🗑 清除过期 ({expiredCount})
          </button>
        )}
      </div>

      {sortedIngredients.length === 0 ? (
        <div className="empty-ingredients">
          <span className="emoji">🥬</span>
          <div className="title">
            {ingredients.length === 0 ? '还没有任何食材' : '没有匹配的食材'}
          </div>
          <div className="desc">
            {ingredients.length === 0
              ? '点击"添加食材"开始管理您的库存吧'
              : '试试换个关键词搜索'}
          </div>
        </div>
      ) : (
        <div className="im-grid">
          {sortedIngredients.map((ing, idx) => {
            const status = getFreshnessStatus(ing);
            const days = getDaysLeft(ing);
            const percent = getFreshnessPercentage(ing);
            const delay = (idx % 30) * 0.02;

            return (
              <div
                key={ing.id}
                className={`ing-card ${status === 'expired' ? 'expired' : ''}`}
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateY(0)' : 'translateY(14px)',
                  transition: `opacity 0.4s ease ${delay}s,
                              transform 0.4s cubic-bezier(0.22,1,0.36,1) ${delay}s,
                              box-shadow 0.25s ease, filter 0.3s ease,
                              background 0.3s ease`,
                }}
              >
                {status === 'expired' && (
                  <div className="expired-badge">⚠ 已过期</div>
                )}

                <div className="ing-header">
                  <div>
                    <div className="ing-name">{ing.name}</div>
                    <div className="ing-quantity">
                      {ing.quantity} {ing.unit} · {formatDate(ing.expiryDate)}
                    </div>
                  </div>
                </div>

                <div className="ing-actions">
                  <button
                    className="icon-btn"
                    title="编辑"
                    onClick={() => openEditForm(ing)}
                  >
                    ✏️
                  </button>
                  <button
                    className="icon-btn delete"
                    title="删除"
                    onClick={() => handleDelete(ing.id)}
                  >
                    🗑
                  </button>
                </div>

                <div className="freshness-section">
                  <div className="freshness-label">
                    <span>新鲜度</span>
                    <span className={`status status-text ${status}`}>
                      {statusText(status, days)}
                    </span>
                  </div>
                  <div className="freshness-bar">
                    <div
                      className={`freshness-fill ${status}`}
                      style={{
                        width: mounted
                          ? `${status === 'expired' ? 100 : percent}%`
                          : '0%',
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {formOpen && (
        <>
          <div className="form-panel-overlay" onClick={closeForm} />
          <div className="form-panel" role="dialog" aria-modal="true">
            <div className="form-header">
              <h2>{editingId ? '编辑食材' : '添加食材'}</h2>
              <button className="close-btn" onClick={closeForm}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">食材名称</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="如：番茄、鸡蛋..."
                  value={form.name}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value });
                    if (formError) setFormError(null);
                  }}
                  autoFocus
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">数量</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0"
                    step="0.1"
                    min="0"
                    value={form.quantity}
                    onChange={(e) => {
                      setForm({ ...form, quantity: e.target.value });
                      if (formError) setFormError(null);
                    }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">单位</label>
                  <select
                    className="form-select"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  >
                    {commonUnits.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">常用单位</label>
                <div className="quick-units">
                  {commonUnits.map((u) => (
                    <span
                      key={u}
                      className={`unit-chip ${form.unit === u ? 'active' : ''}`}
                      onClick={() => setForm({ ...form, unit: u })}
                    >
                      {u}
                    </span>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">过期日期</label>
                <input
                  type="date"
                  className="form-input"
                  value={form.expiryDate}
                  onChange={(e) => {
                    setForm({ ...form, expiryDate: e.target.value });
                    if (formError) setFormError(null);
                  }}
                />
              </div>

              {formError && <div className="error-text">{formError}</div>}

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={closeForm}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? '保存修改' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {confirmModal && (
        <div className="modal-overlay" onClick={() => setConfirmModal(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-icon">⚠️</div>
            <div className="modal-title">确认清除过期食材？</div>
            <div className="modal-desc">
              将删除所有 {expiredCount} 个已过期的食材，
              <br />
              此操作无法撤销。
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-ghost"
                onClick={() => setConfirmModal(false)}
              >
                取消
              </button>
              <button className="btn btn-danger" onClick={handleClearExpired}>
                确认清除
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default IngredientManager;
