import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { FormulaCard } from '../components/FormulaCard';
import { Formula, MORDANTS, DYE_COLORS } from '../types';

export const AdminFormulas: React.FC = () => {
  const { formulas, fetchFormulas, addFormula, updateFormula, deleteFormula, loading } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingFormula, setEditingFormula] = useState<Formula | null>(null);
  const [selectedFormula, setSelectedFormula] = useState<Formula | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    mainDye: '',
    mordant: '',
    temperature: 60,
    duration: 2,
    ph: 6,
    colorFrom: '#D32F2F',
    colorTo: '#FFEBEE',
    isAvailable: 1
  });

  useEffect(() => {
    fetchFormulas();
  }, [fetchFormulas]);

  const openAddModal = () => {
    setEditingFormula(null);
    setFormData({
      name: '',
      mainDye: '',
      mordant: '',
      temperature: 60,
      duration: 2,
      ph: 6,
      colorFrom: '#D32F2F',
      colorTo: '#FFEBEE',
      isAvailable: 1
    });
    setShowModal(true);
  };

  const openEditModal = (formula: Formula) => {
    setEditingFormula(formula);
    setFormData({
      name: formula.name,
      mainDye: formula.mainDye,
      mordant: formula.mordant,
      temperature: formula.temperature,
      duration: formula.duration,
      ph: formula.ph,
      colorFrom: formula.colorFrom,
      colorTo: formula.colorTo,
      isAvailable: formula.isAvailable
    });
    setShowModal(true);
  };

  const openDetailModal = (formula: Formula) => {
    setSelectedFormula(formula);
    setShowDetailModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.mainDye || !formData.mordant) {
      alert('请填写完整信息');
      return;
    }

    if (editingFormula) {
      await updateFormula(editingFormula.id, formData);
    } else {
      await addFormula(formData);
    }
    setShowModal(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm('确定要删除这个配方吗？')) {
      await deleteFormula(id);
    }
  };

  const selectColorScheme = (color: typeof DYE_COLORS[0]) => {
    setFormData(prev => ({
      ...prev,
      name: color.name,
      mainDye: color.name.replace(/[^a-zA-Z\u4e00-\u9fa5]/g, ''),
      colorFrom: color.from,
      colorTo: color.to
    }));
  };

  return (
    <div>
      <div className="flex-between">
        <h1 className="page-title" style={{ marginBottom: 0 }}>🧪 配方管理</h1>
        <button className="btn" onClick={openAddModal}>+ 新建配方</button>
      </div>

      {loading && <p>加载中...</p>}

      {formulas.length === 0 && !loading ? (
        <div className="empty-state">
          <div className="empty-state-icon">🧪</div>
          <p className="empty-state-text">暂无配方，点击右上角新建第一个配方</p>
        </div>
      ) : (
        <div className="grid">
          {formulas.map(formula => (
            <FormulaCard
              key={formula.id}
              formula={formula}
              onEdit={openEditModal}
              onDelete={handleDelete}
              onClick={openDetailModal}
            />
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingFormula ? '编辑配方' : '新建配方'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>选择染色方案</label>
                <div className="color-picker-row">
                  {DYE_COLORS.map(color => (
                    <div
                      key={color.name}
                      className={`color-option ${formData.name === color.name ? 'selected' : ''}`}
                      style={{
                        background: `linear-gradient(135deg, ${color.from}, ${color.to})`
                      }}
                      onClick={() => selectColorScheme(color)}
                    >
                      {color.name}
                    </div>
                  ))}
                </div>
              </div>

              <div className="inline-form">
                <div className="form-group">
                  <label>配方名称</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="例如：茜草红"
                  />
                </div>

                <div className="form-group">
                  <label>主染料</label>
                  <input
                    type="text"
                    value={formData.mainDye}
                    onChange={e => setFormData(prev => ({ ...prev, mainDye: e.target.value }))}
                    placeholder="例如：茜草"
                  />
                </div>

                <div className="form-group">
                  <label>媒染剂</label>
                  <select
                    value={formData.mordant}
                    onChange={e => setFormData(prev => ({ ...prev, mordant: e.target.value }))}
                  >
                    <option value="">请选择媒染剂</option>
                    {MORDANTS.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>pH 值要求</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="14"
                    value={formData.ph}
                    onChange={e => setFormData(prev => ({ ...prev, ph: parseFloat(e.target.value) }))}
                  />
                </div>

                <div className="form-group full-width">
                  <label>染色温度（{formData.temperature}°C）</label>
                  <div className="slider-container">
                    <input
                      type="range"
                      min="40"
                      max="90"
                      value={formData.temperature}
                      onChange={e => setFormData(prev => ({ ...prev, temperature: parseInt(e.target.value) }))}
                    />
                    <span className="slider-value">{formData.temperature}°C</span>
                  </div>
                </div>

                <div className="form-group full-width">
                  <label>染色时长（{formData.duration} 小时）</label>
                  <div className="slider-container">
                    <input
                      type="range"
                      min="0.5"
                      max="24"
                      step="0.5"
                      value={formData.duration}
                      onChange={e => setFormData(prev => ({ ...prev, duration: parseFloat(e.target.value) }))}
                    />
                    <span className="slider-value">{formData.duration}h</span>
                  </div>
                </div>

                <div className="form-group full-width">
                  <div className="checkbox-group">
                    <input
                      type="checkbox"
                      id="isAvailable"
                      checked={formData.isAvailable === 1}
                      onChange={e => setFormData(prev => ({ ...prev, isAvailable: e.target.checked ? 1 : 0 }))}
                    />
                    <label htmlFor="isAvailable">配方可用（客户可下单选择）</label>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>
                  取消
                </button>
                <button type="submit" className="btn" style={{ flex: 1 }}>
                  {editingFormula ? '保存修改' : '创建配方'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailModal && selectedFormula && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedFormula.name}</h2>
              <button className="close-btn" onClick={() => setShowDetailModal(false)}>×</button>
            </div>

            <div 
              style={{
                height: '120px',
                borderRadius: '8px',
                background: `linear-gradient(135deg, ${selectedFormula.colorFrom}, ${selectedFormula.colorTo})`,
                marginBottom: '24px'
              }}
            ></div>

            <div className="inline-form">
              <div className="form-group">
                <label>主染料</label>
                <div style={{ padding: '12px', background: '#F5F0EB', borderRadius: '8px' }}>
                  {selectedFormula.mainDye}
                </div>
              </div>

              <div className="form-group">
                <label>媒染剂</label>
                <div style={{ padding: '12px', background: '#F5F0EB', borderRadius: '8px' }}>
                  {selectedFormula.mordant}
                </div>
              </div>

              <div className="form-group">
                <label>染色温度</label>
                <div style={{ padding: '12px', background: '#F5F0EB', borderRadius: '8px' }}>
                  {selectedFormula.temperature}°C
                </div>
              </div>

              <div className="form-group">
                <label>染色时长</label>
                <div style={{ padding: '12px', background: '#F5F0EB', borderRadius: '8px' }}>
                  {selectedFormula.duration} 小时
                </div>
              </div>

              <div className="form-group">
                <label>pH 值</label>
                <div style={{ padding: '12px', background: '#F5F0EB', borderRadius: '8px' }}>
                  {selectedFormula.ph}
                </div>
              </div>

              <div className="form-group">
                <label>状态</label>
                <div style={{ 
                  padding: '12px', 
                  borderRadius: '8px',
                  background: selectedFormula.isAvailable ? '#C8E6C9' : '#FFCDD2',
                  color: selectedFormula.isAvailable ? '#2E7D32' : '#C62828'
                }}>
                  {selectedFormula.isAvailable ? '✓ 可用' : '✕ 不可用'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)} style={{ flex: 1 }}>
                关闭
              </button>
              <button 
                className="btn" 
                onClick={() => {
                  setShowDetailModal(false);
                  openEditModal(selectedFormula);
                }} 
                style={{ flex: 1 }}
              >
                编辑配方
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
