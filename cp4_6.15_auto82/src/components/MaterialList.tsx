import { useReducer } from 'react';
import { useAppStore } from '@/store';
import type { Material, MaterialType, MaterialFormState } from '@/types';
import { cn } from '@/lib/utils';

type FormField = keyof MaterialFormState['form'];

type ReducerAction =
  | { type: 'OPEN_ADD' }
  | { type: 'OPEN_EDIT'; payload: Material }
  | { type: 'CLOSE' }
  | { type: 'SET_FIELD'; payload: { field: FormField; value: string | number } }
  | { type: 'SUBMIT' };

const emptyForm: MaterialFormState['form'] = {
  name: '',
  type: 'other',
  quantity: 0,
  unit: '',
  purchaseDate: '',
  expiryDate: '',
};

const initialState: MaterialFormState = {
  isOpen: false,
  editingId: null,
  form: { ...emptyForm },
};

function reducer(state: MaterialFormState, action: ReducerAction): MaterialFormState {
  switch (action.type) {
    case 'OPEN_ADD':
      return {
        isOpen: true,
        editingId: null,
        form: { ...emptyForm },
      };
    case 'OPEN_EDIT': {
      const m = action.payload;
      return {
        isOpen: true,
        editingId: m.id,
        form: {
          name: m.name,
          type: m.type,
          quantity: m.quantity,
          unit: m.unit,
          purchaseDate: m.purchaseDate,
          expiryDate: m.expiryDate,
        },
      };
    }
    case 'CLOSE':
      return {
        ...state,
        isOpen: false,
      };
    case 'SET_FIELD':
      return {
        ...state,
        form: {
          ...state.form,
          [action.payload.field]: action.payload.value,
        },
      };
    case 'SUBMIT':
      return {
        ...state,
        isOpen: false,
      };
    default:
      return state;
  }
}

const typeColorMap: Record<MaterialType, string> = {
  textile: 'var(--color-textile)',
  wood: 'var(--color-wood)',
  paint: 'var(--color-paint)',
  other: 'var(--color-other)',
};

const typeLabelMap: Record<MaterialType, string> = {
  textile: '面料',
  wood: '木料',
  paint: '涂料',
  other: '其他',
};

function getProgressColor(percent: number): string {
  if (percent >= 70) return 'var(--color-success)';
  if (percent >= 40) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

function isExpiringSoon(expiryDate: string): boolean {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= 7;
}

export default function MaterialList() {
  const { materials, addMaterial, updateMaterial, deleteMaterial, markNotified } = useAppStore();
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleSubmit = () => {
    const { editingId, form } = state;
    if (editingId) {
      updateMaterial(editingId, form);
    } else {
      addMaterial({ ...form });
    }
    dispatch({ type: 'SUBMIT' });
  };

  const handleDelete = () => {
    if (state.editingId) {
      deleteMaterial(state.editingId);
      dispatch({ type: 'CLOSE' });
    }
  };

  return (
    <div className="page-fade-enter">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            材料管理
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            共 {materials.length} 种材料
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => dispatch({ type: 'OPEN_ADD' })}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          添加材料
        </button>
      </div>

      <div
        className="material-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px',
        }}
      >
        {materials.map((m, index) => {
          const percent = m.initialQuantity > 0 ? Math.min(100, (m.quantity / m.initialQuantity) * 100) : 0;
          const showAlert = isExpiringSoon(m.expiryDate) && !m.notified;

          return (
            <div
              key={m.id}
              className="card-enter"
              style={{
                animationDelay: `${index * 50}ms`,
                background: 'var(--color-surface)',
                borderRadius: '16px',
                padding: '18px',
                boxShadow: 'var(--shadow-md)',
                transition: 'box-shadow 0.2s var(--ease-out), transform 0.2s var(--ease-out)',
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-hover)';
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-md)';
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
              }}
              onClick={() => dispatch({ type: 'OPEN_EDIT', payload: m })}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: typeColorMap[m.type],
                    flexShrink: 0,
                    marginTop: '4px',
                  }}
                />
                {showAlert && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markNotified(m.id);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'rgba(224, 107, 90, 0.12)',
                      color: 'var(--color-danger)',
                      animation: 'pulse 1.8s ease-in-out infinite',
                      cursor: 'pointer',
                      padding: 0,
                      border: 'none',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(224, 107, 90, 0.22)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(224, 107, 90, 0.12)';
                    }}
                    title="即将过期，点击标记已通知"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16h2v2h-2v-2zm0-6h2v4h-2v-4z" />
                    </svg>
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.3 }}>
                  {m.name}
                </div>
                <span
                  className="tag"
                  style={{
                    background: typeColorMap[m.type],
                    color: 'var(--color-text)',
                    alignSelf: 'flex-start',
                  }}
                >
                  {typeLabelMap[m.type]}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>
                    {m.quantity}
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 400, marginLeft: '2px' }}>
                      {m.unit}
                    </span>
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    {percent.toFixed(0)}%
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '8px',
                    background: 'var(--color-border)',
                    borderRadius: 'var(--radius-full)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${percent}%`,
                      background: `linear-gradient(90deg, ${getProgressColor(Math.max(percent, 10))}, ${getProgressColor(percent)})`,
                      borderRadius: 'var(--radius-full)',
                      transition: 'width 0.4s var(--ease-out)',
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @media (max-width: 1200px) {
          .material-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (max-width: 900px) {
          .material-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 560px) {
          .material-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {state.isOpen && (
        <div className="modal-overlay" onClick={() => dispatch({ type: 'CLOSE' })}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ width: '480px', padding: '28px' }}
          >
            <h3 className="mb-5 text-xl font-bold" style={{ color: 'var(--color-text)' }}>
              {state.editingId ? '编辑材料' : '添加材料'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">材料名称</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="请输入材料名称"
                  value={state.form.name}
                  onChange={(e) => dispatch({ type: 'SET_FIELD', payload: { field: 'name', value: e.target.value } })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">类型</label>
                <select
                  className="form-select"
                  value={state.form.type}
                  onChange={(e) => dispatch({ type: 'SET_FIELD', payload: { field: 'type', value: e.target.value as MaterialType } })}
                >
                  <option value="textile">面料</option>
                  <option value="wood">木料</option>
                  <option value="paint">涂料</option>
                  <option value="other">其他</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">数量</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0"
                    min="0"
                    value={state.form.quantity}
                    onChange={(e) => dispatch({ type: 'SET_FIELD', payload: { field: 'quantity', value: Number(e.target.value) } })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">单位</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="如：米、个、kg"
                    value={state.form.unit}
                    onChange={(e) => dispatch({ type: 'SET_FIELD', payload: { field: 'unit', value: e.target.value } })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">采购日期</label>
                  <input
                    type="date"
                    className="form-input"
                    value={state.form.purchaseDate}
                    onChange={(e) => dispatch({ type: 'SET_FIELD', payload: { field: 'purchaseDate', value: e.target.value } })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">过期日期</label>
                  <input
                    type="date"
                    className="form-input"
                    value={state.form.expiryDate}
                    onChange={(e) => dispatch({ type: 'SET_FIELD', payload: { field: 'expiryDate', value: e.target.value } })}
                  />
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '28px',
                gap: '12px',
              }}
            >
              <div>
                {state.editingId && (
                  <button className="btn btn-danger" onClick={handleDelete}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    删除
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-secondary" onClick={() => dispatch({ type: 'CLOSE' })}>
                  取消
                </button>
                <button className="btn btn-primary" onClick={handleSubmit}>
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
