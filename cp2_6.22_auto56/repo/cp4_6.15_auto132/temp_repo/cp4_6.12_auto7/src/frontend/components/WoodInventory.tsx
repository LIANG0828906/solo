import { useState, useEffect } from 'react';
import {
  getWood,
  getLowStockWood,
  addWood,
  gradeColors,
  type Wood,
  type WoodGrade
} from '../api/wood';

const grades: WoodGrade[] = ['特级', '一级', '二级', '三级'];

const WoodInventory = () => {
  const [woodList, setWoodList] = useState<Wood[]>([]);
  const [lowStockWood, setLowStockWood] = useState<Wood[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    origin: '',
    grade: '一级' as WoodGrade,
    stock_count: 0,
    standard_size: '2440x1220x25mm',
    unit_price: 0,
    stock_date: new Date().toISOString().split('T')[0]
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [allWood, lowStock] = await Promise.all([
        getWood(),
        getLowStockWood()
      ]);
      setWoodList(allWood);
      setLowStockWood(lowStock);
    } catch (err) {
      setError('加载木料库存失败，请稍后重试');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleAddWood = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await addWood(formData);
      setSuccessMessage('木料入库成功');
      setShowAddModal(false);
      setFormData({
        name: '',
        origin: '',
        grade: '一级',
        stock_count: 0,
        standard_size: '2440x1220x25mm',
        unit_price: 0,
        stock_date: new Date().toISOString().split('T')[0]
      });
      await loadData();
    } catch (err) {
      setError('添加入库失败，请稍后重试');
      console.error(err);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#757575' }}>加载中...</div>;
  }

  return (
    <div>
      {error && <div className="error">{error}</div>}
      {successMessage && <div className="success">{successMessage}</div>}

      {lowStockWood.length > 0 && (
        <div
          style={{
            backgroundColor: '#FFEBEE',
            border: '1px solid #D32F2F',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <span style={{ fontSize: '24px', color: '#D32F2F' }} className="blink-icon">⚠️</span>
          <div>
            <p style={{ color: '#D32F2F', fontWeight: '600', margin: 0 }}>
              低库存警告：有 {lowStockWood.length} 种木料库存不足（低于5块）
            </p>
            <p style={{ color: '#B71C1C', fontSize: '13px', margin: '4px 0 0 0' }}>
              {lowStockWood.map(w => `${w.name}(${w.stock_count}块)`).join('、')}
            </p>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ color: '#616161', margin: 0 }}>
          共 {woodList.length} 种木料
          {lowStockWood.length > 0 && (
            <span style={{ color: '#D32F2F', marginLeft: '12px' }}>
              低库存 {lowStockWood.length} 种
            </span>
          )}
        </p>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          + 木料入库
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
        {woodList.map((wood) => {
          const isLowStock = wood.stock_count < 5;
          return (
            <div
              key={wood.id}
              className="card"
              style={{
                padding: '20px',
                border: isLowStock ? '2px solid #D32F2F' : '1px solid transparent',
                position: 'relative'
              }}
            >
              {isLowStock && (
                <span
                  className="blink-icon"
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    fontSize: '22px'
                  }}
                >
                  ⚠️
                </span>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#212121', margin: 0 }}>
                  {wood.name}
                </h3>
                <span
                  className="badge"
                  style={{
                    backgroundColor: gradeColors[wood.grade] + '20',
                    color: gradeColors[wood.grade],
                    border: `1px solid ${gradeColors[wood.grade]}40`
                  }}
                >
                  {wood.grade}
                </span>
              </div>

              <div style={{ fontSize: '13px', color: '#616161', marginBottom: '14px' }}>
                <div style={{ marginBottom: '4px' }}>📍 产地：{wood.origin}</div>
                <div>📐 规格：{wood.standard_size}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <p style={{ fontSize: '12px', color: '#757575', margin: 0, marginBottom: '2px' }}>
                    库存数量
                  </p>
                  <p
                    style={{
                      fontSize: '22px',
                      fontWeight: '700',
                      margin: 0,
                      color: isLowStock ? '#D32F2F' : '#4E342E'
                    }}
                  >
                    {wood.stock_count}
                    <span style={{ fontSize: '13px', fontWeight: '400', marginLeft: '4px' }}>块</span>
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '12px', color: '#757575', margin: 0, marginBottom: '2px' }}>
                    单价
                  </p>
                  <p style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: '#4E342E' }}>
                    ¥{wood.unit_price}
                  </p>
                </div>
              </div>

              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #F0EBE5' }}>
                <p style={{ fontSize: '12px', color: '#9E9E9E', margin: 0 }}>
                  入库日期：{wood.stock_date}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">木料入库</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddWood}>
              <div className="form-group">
                <label className="form-label">木料名称 *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="如：黑胡桃木"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">产地 *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.origin}
                  onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                  placeholder="如：美国"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">等级 *</label>
                <select
                  className="form-select"
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value as WoodGrade })}
                >
                  {grades.map(grade => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">标准尺寸 *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.standard_size}
                  onChange={(e) => setFormData({ ...formData, standard_size: e.target.value })}
                  placeholder="如：2440x1220x25mm"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">入库数量（块）*</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={formData.stock_count || ''}
                    onChange={(e) => setFormData({ ...formData, stock_count: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">单价（元）*</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-input"
                    value={formData.unit_price || ''}
                    onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">入库日期</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.stock_date}
                  onChange={(e) => setFormData({ ...formData, stock_date: e.target.value })}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  确认入库
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WoodInventory;
