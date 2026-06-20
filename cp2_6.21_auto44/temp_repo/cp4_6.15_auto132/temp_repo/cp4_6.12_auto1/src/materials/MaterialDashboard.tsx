import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { create } from 'zustand';

interface Material {
  id: string;
  name: string;
  stock: number;
  threshold: number;
  consumption_rate: number;
}

interface ConsumptionLog {
  id: string;
  order_id: string;
  material_name: string;
  amount: number;
  created_at: string;
}

interface MaterialStore {
  materials: Material[];
  logs: ConsumptionLog[];
  loading: boolean;
  fetchMaterials: () => Promise<void>;
  fetchLogs: () => Promise<void>;
  addMaterial: (data: { name: string; stock: number; threshold: number; consumption_rate?: number }) => Promise<void>;
  updateMaterial: (id: string, data: { stock?: number; threshold?: number; name?: string; consumption_rate?: number }) => Promise<void>;
}

const useMaterialStore = create<MaterialStore>((set, get) => ({
  materials: [],
  logs: [],
  loading: false,
  fetchMaterials: async () => {
    set({ loading: true });
    try {
      const res = await axios.get('/api/materials');
      set({ materials: res.data, loading: false });
    } catch {
      set({ loading: false });
    }
  },
  fetchLogs: async () => {
    try {
      const res = await axios.get('/api/consumption-logs');
      set({ logs: res.data });
    } catch {}
  },
  addMaterial: async (data) => {
    const res = await axios.post('/api/materials', data);
    set({ materials: [...get().materials, res.data] });
  },
  updateMaterial: async (id, data) => {
    const res = await axios.patch(`/api/materials/${id}`, data);
    set({ materials: get().materials.map(m => m.id === id ? res.data : m) });
  },
}));

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setDebouncedValue(value);
      timerRef.current = null;
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [value, delay]);

  return debouncedValue;
}

function AddMaterialForm({ onAdded }: { onAdded: () => void }) {
  const [name, setName] = useState('');
  const [stock, setStock] = useState('');
  const [threshold, setThreshold] = useState('');
  const [consumptionRate, setConsumptionRate] = useState('1.2');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await useMaterialStore.getState().addMaterial({
        name,
        stock: parseFloat(stock),
        threshold: parseFloat(threshold),
        consumption_rate: parseFloat(consumptionRate) || 1.2,
      });
      setName('');
      setStock('');
      setThreshold('');
      setConsumptionRate('1.2');
      onAdded();
    } catch (err: any) {
      setError(err.response?.data?.error || '添加失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="material-form-card">
      <h3>添加原料</h3>
      {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 10 }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">原料名称</label>
          <input
            className="form-input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="如：头层牛皮"
            required
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">库存 (sq ft)</label>
            <input
              className="form-input"
              type="number"
              step="0.1"
              min="0"
              value={stock}
              onChange={e => setStock(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">预警阈值</label>
            <input
              className="form-input"
              type="number"
              step="0.1"
              min="0"
              value={threshold}
              onChange={e => setThreshold(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">消耗系数</label>
            <input
              className="form-input"
              type="number"
              step="0.01"
              min="1"
              value={consumptionRate}
              onChange={e => setConsumptionRate(e.target.value)}
              required
            />
          </div>
        </div>
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? '添加中...' : '添加原料'}
        </button>
      </form>
    </div>
  );
}

function RestockForm({ materials, onRestocked }: { materials: Material[]; onRestocked: () => void }) {
  const [materialId, setMaterialId] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialId) return;
    setSubmitting(true);
    try {
      const material = materials.find(m => m.id === materialId);
      if (material) {
        await useMaterialStore.getState().updateMaterial(materialId, {
          stock: material.stock + parseFloat(amount),
        });
        setAmount('');
        onRestocked();
      }
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="material-form-card">
      <h3>原料补货</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">选择原料</label>
          <select
            className="form-select"
            value={materialId}
            onChange={e => setMaterialId(e.target.value)}
            required
          >
            <option value="">-- 请选择 --</option>
            {materials.map(m => (
              <option key={m.id} value={m.id}>
                {m.name} (当前: {m.stock} sq ft)
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">补货数量 (sq ft)</label>
          <input
            className="form-input"
            type="number"
            step="0.1"
            min="0.1"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="输入补货数量"
            required
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={submitting || !materialId}>
          {submitting ? '补货中...' : '确认补货'}
        </button>
      </form>
    </div>
  );
}

function MaterialDashboard() {
  const { materials, logs, loading, fetchMaterials, fetchLogs } = useMaterialStore();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    fetchMaterials();
    fetchLogs();
  }, [fetchMaterials, fetchLogs]);

  const filteredMaterials = useCallback(() => {
    if (!debouncedSearch.trim()) return materials;
    const keyword = debouncedSearch.toLowerCase();
    return materials.filter(m => m.name.toLowerCase().includes(keyword));
  }, [materials, debouncedSearch])();

  const isLow = (m: Material) => m.stock < m.threshold;

  if (loading && materials.length === 0) {
    return (
      <div className="loading-wrapper">
        <div className="loading-spinner" />
        <p>加载原料数据...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">原料管理</h1>
      </div>

      <div className="material-forms">
        <AddMaterialForm onAdded={() => { fetchMaterials(); fetchLogs(); }} />
        <RestockForm materials={materials} onRestocked={() => { fetchMaterials(); fetchLogs(); }} />
      </div>

      <div className="material-table-wrapper">
        <div className="material-search">
          <input
            className="form-input"
            type="text"
            placeholder="搜索原料..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <table className="material-table">
          <thead>
            <tr>
              <th>原料名称</th>
              <th>当前库存 (sq ft)</th>
              <th>预警阈值</th>
              <th>消耗系数</th>
              <th>库存状态</th>
            </tr>
          </thead>
          <tbody>
            {filteredMaterials.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-state">暂无匹配原料</td>
              </tr>
            ) : (
              filteredMaterials.map(m => {
                const low = isLow(m);
                const ratio = m.threshold > 0 ? Math.min(m.stock / (m.threshold * 2), 1) : 1;
                return (
                  <tr key={m.id} className={low ? 'material-row-low' : ''}>
                    <td style={{ fontWeight: 600 }}>{m.name}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ color: low ? '#ffffff' : 'var(--text)', fontWeight: low ? 700 : 400 }}>
                          {m.stock.toFixed(1)}
                        </span>
                        <div className="stock-bar">
                          <div
                            className={`stock-bar-fill ${low ? 'stock-bar-low' : 'stock-bar-ok'}`}
                            style={{ width: `${ratio * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td style={{ color: low ? '#ffffff' : 'var(--text)' }}>{m.threshold.toFixed(1)}</td>
                    <td style={{ color: low ? '#ffffff' : 'var(--text)', fontFamily: 'monospace' }}>
                      ×{m.consumption_rate?.toFixed(2) ?? '1.20'}
                    </td>
                    <td>
                      {low ? (
                        <span style={{ color: '#ffffff', fontWeight: 700, fontSize: 13 }}>
                          ⚠ 库存不足
                        </span>
                      ) : (
                        <span style={{ color: 'var(--success)', fontSize: 13 }}>
                          ✓ 正常
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="consumption-log-section">
        <h3>消耗记录</h3>
        {logs.length === 0 ? (
          <div className="empty-state" style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: 'var(--shadow)' }}>
            暂无消耗记录
          </div>
        ) : (
          <table className="log-table">
            <thead>
              <tr>
                <th>时间</th>
                <th>订单ID</th>
                <th>原料</th>
                <th>消耗量 (sq ft)</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td>{new Date(log.created_at).toLocaleString('zh-CN')}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{log.order_id.slice(0, 8)}...</td>
                  <td>{log.material_name}</td>
                  <td style={{ fontWeight: 600 }}>{log.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default MaterialDashboard;
