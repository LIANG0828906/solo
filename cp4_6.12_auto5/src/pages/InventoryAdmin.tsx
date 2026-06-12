import { useState, useEffect } from 'react';
import { Plant } from '../types';

interface PurchaseSuggestion {
  plant_id: string;
  plant_name: string;
  current_stock: number;
  monthly_counts: Record<string, number>;
  last_month_count: number;
  avg_monthly: number;
  suggested_purchase: number;
  suggestion: string;
}

export default function InventoryAdmin() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [suggestions, setSuggestions] = useState<PurchaseSuggestion[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price_monthly: 0,
    stock: 0,
    image: '',
    water_cycle_days: 7,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [plantsRes, suggestionsRes] = await Promise.all([
        fetch('/api/plants'),
        fetch('/api/purchase-suggestions'),
      ]);
      const plantsData = await plantsRes.json();
      const suggestionsData = await suggestionsRes.json();
      setPlants(plantsData);
      setSuggestions(suggestionsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm({ ...form, image: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const openEditModal = (plant: Plant) => {
    setEditingPlant(plant);
    setForm({
      name: plant.name,
      description: plant.description,
      price_monthly: plant.price_monthly,
      stock: plant.stock,
      image: plant.image,
      water_cycle_days: plant.water_cycle_days,
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingPlant(null);
    setForm({
      name: '',
      description: '',
      price_monthly: 30,
      stock: 5,
      image: '',
      water_cycle_days: 7,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingPlant ? `/api/plants/${editingPlant.id}` : '/api/plants';
      const method = editingPlant ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowModal(false);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateStock = async (plantId: string, delta: number) => {
    const plant = plants.find(p => p.id === plantId);
    if (!plant) return;
    try {
      const res = await fetch(`/api/plants/${plantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: Math.max(0, plant.stock + delta) }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="loading">加载中...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📦 库存管理</h1>
        <button className="btn btn-primary" onClick={openCreateModal}>
          + 新增植物
        </button>
      </div>

      {suggestions.length > 0 && (
        <div className="purchase-section">
          <h3 className="subsection-title">
            📊 采购建议
            <span className="badge badge-red" style={{ marginLeft: 12 }}>{suggestions.length}项</span>
          </h3>
          <div className="suggestion-grid">
            {suggestions.map(s => (
              <div key={s.plant_id} className="suggestion-card card">
                <div className="suggestion-header">
                  <h4>{s.plant_name}</h4>
                  <span className="badge badge-red">库存不足</span>
                </div>
                <p className="suggestion-text">{s.suggestion}</p>
                <div className="suggestion-stats">
                  <div className="stat-item">
                    <span className="stat-label">当前库存</span>
                    <span className="stat-value danger">{s.current_stock}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">上月租赁</span>
                    <span className="stat-value">{s.last_month_count}次</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">建议采购</span>
                    <span className="stat-value primary">{s.suggested_purchase}盆</span>
                  </div>
                </div>
                <div className="suggestion-trend">
                  <small>近3月趋势：</small>
                  {Object.entries(s.monthly_counts).map(([month, count]) => (
                    <span key={month} className="trend-chip">
                      {month.slice(5)}月: {count}次
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <h3 className="subsection-title" style={{ marginTop: 32 }}>植物库存列表</h3>
      <div className="inventory-table card">
        <table>
          <thead>
            <tr>
              <th>植物</th>
              <th>月租金</th>
              <th>库存</th>
              <th>浇水周期</th>
              <th>库存操作</th>
              <th>管理</th>
            </tr>
          </thead>
          <tbody>
            {plants.map(plant => (
              <tr key={plant.id}>
                <td>
                  <div className="plant-cell">
                    <div
                      className="plant-thumb"
                      style={{
                        background: plant.image
                          ? `url(${plant.image}) center/cover`
                          : 'linear-gradient(135deg, #81C784, #4CAF50)',
                      }}
                    ></div>
                    <div>
                      <div className="plant-name-sm">
                        {plant.name}
                        {plant.stock < 3 && (
                          <span className="stock-dot red" style={{ marginLeft: 8 }} title="库存不足"></span>
                        )}
                      </div>
                      <small className="text-light">{plant.description.slice(0, 30)}...</small>
                    </div>
                  </div>
                </td>
                <td>¥{plant.price_monthly}</td>
                <td>
                  <span className={`stock-badge ${plant.stock < 3 ? 'low' : ''}`}>
                    {plant.stock} 盆
                  </span>
                </td>
                <td>{plant.water_cycle_days}天</td>
                <td>
                  <div className="stock-controls">
                    <button className="stock-btn" onClick={() => updateStock(plant.id, -1)}>-</button>
                    <span className="stock-num">{plant.stock}</span>
                    <button className="stock-btn" onClick={() => updateStock(plant.id, 1)}>+</button>
                  </div>
                </td>
                <td>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(plant)}>
                    编辑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingPlant ? '编辑植物' : '新增植物'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              {form.image && (
                <div className="image-preview">
                  <img src={form.image} alt="预览" />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">植物图片</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">植物名称 *</label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">描述</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">月租金 (¥) *</label>
                  <input
                    type="number"
                    className="form-input"
                    min={0}
                    value={form.price_monthly}
                    onChange={e => setForm({ ...form, price_monthly: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">库存数量 *</label>
                  <input
                    type="number"
                    className="form-input"
                    min={0}
                    value={form.stock}
                    onChange={e => setForm({ ...form, stock: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">浇水周期 (天)</label>
                <select
                  className="form-select"
                  value={form.water_cycle_days}
                  onChange={e => setForm({ ...form, water_cycle_days: Number(e.target.value) })}
                >
                  <option value={5}>5天 (如龟背竹)</option>
                  <option value={7}>7天 (如绿萝、橡皮树)</option>
                  <option value={10}>10天 (如琴叶榕、多肉)</option>
                  <option value={14}>14天 (如发财树、虎尾兰)</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingPlant ? '保存修改' : '创建植物'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
