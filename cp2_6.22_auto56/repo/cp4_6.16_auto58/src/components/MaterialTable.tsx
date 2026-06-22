import { useState, useMemo } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import type { Material, SortOrder } from '@/types';
import { Plus, X, Edit2, Trash2, AlertTriangle, Search, ArrowUpDown, ChevronUp, ChevronDown, PackagePlus } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/format';

export function MaterialTable() {
  const { materials, addMaterial, updateMaterial, deleteMaterial } = useProjectStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    quantity: 0,
    unit: '个',
    unitPrice: 0,
    warningThreshold: 0
  });
  const [error, setError] = useState('');

  const filteredMaterials = useMemo(() => {
    let list = materials;
    if (searchTerm.trim()) {
      const kw = searchTerm.trim().toLowerCase();
      list = list.filter((m) => m.name.toLowerCase().includes(kw));
    }
    if (sortOrder) {
      list = [...list].sort((a, b) => {
        return sortOrder === 'asc' ? a.quantity - b.quantity : b.quantity - a.quantity;
      });
    }
    return list;
  }, [materials, searchTerm, sortOrder]);

  const toggleSort = () => {
    if (sortOrder === null) setSortOrder('asc');
    else if (sortOrder === 'asc') setSortOrder('desc');
    else setSortOrder(null);
  };

  const openNewForm = () => {
    setEditingMaterial(null);
    setFormData({ name: '', quantity: 0, unit: '个', unitPrice: 0, warningThreshold: 0 });
    setError('');
    setShowForm(true);
  };

  const openEditForm = (m: Material) => {
    setEditingMaterial(m);
    setFormData({
      name: m.name,
      quantity: m.quantity,
      unit: m.unit,
      unitPrice: m.unitPrice,
      warningThreshold: m.warningThreshold
    });
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('请填写材料名称');
      return;
    }
    try {
      if (editingMaterial) {
        await updateMaterial(editingMaterial.id, formData);
      } else {
        await addMaterial(formData);
      }
      setShowForm(false);
    } catch (err) {
      setError('保存失败，请重试');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`确定删除材料"${name}"？`)) {
      await deleteMaterial(id);
    }
  };

  const isWarning = (m: Material) => m.quantity < m.warningThreshold;

  return (
    <div className="material-table-container">
      <div className="table-header">
        <h2 className="section-title">材料库存管理</h2>
        <button className="btn-primary" onClick={openNewForm}>
          <Plus size={18} /> 添加材料
        </button>
      </div>

      <div className="table-toolbar">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="按材料名称搜索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ fontSize: '13px', color: '#8B5A2B' }}>
          共 {filteredMaterials.length} 种材料
        </div>
      </div>

      <div className="table-wrapper">
        <table className="material-table">
          <thead>
            <tr>
              <th>材料名称</th>
              <th className="sortable" onClick={toggleSort}>
                <span>
                  现有数量
                  {sortOrder === null && <ArrowUpDown size={14} />}
                  {sortOrder === 'asc' && <ChevronUp size={14} />}
                  {sortOrder === 'desc' && <ChevronDown size={14} />}
                </span>
              </th>
              <th>单位</th>
              <th>单价</th>
              <th>预警线</th>
              <th>库存总值</th>
              <th>录入时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredMaterials.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-row">
                  {materials.length === 0
                    ? '暂无材料记录，点击"添加材料"开始录入'
                    : '未找到匹配的材料'}
                </td>
              </tr>
            ) : (
              filteredMaterials.map((m, idx) => (
                <tr
                  key={m.id}
                  className={isWarning(m) ? 'warning-row' : ''}
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <td className="material-name">
                    {isWarning(m) && (
                      <span className="warning-icon" title="库存不足，建议补货">
                        <AlertTriangle size={14} />
                      </span>
                    )}
                    {m.name}
                  </td>
                  <td className="quantity-cell">
                    <strong>{m.quantity}</strong>
                    {isWarning(m) && <span className="replenish-tag"><PackagePlus size={12} /> 补货</span>}
                  </td>
                  <td>{m.unit}</td>
                  <td>{formatCurrency(m.unitPrice)}</td>
                  <td>{m.warningThreshold}</td>
                  <td>{formatCurrency(m.quantity * m.unitPrice)}</td>
                  <td>{formatDate(m.createdAt)}</td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-btn" onClick={() => openEditForm(m)}>
                        <Edit2 size={15} />
                      </button>
                      <button className="icon-btn-danger" onClick={() => handleDelete(m.id, m.name)}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingMaterial ? '编辑材料' : '添加新材料'}</h3>
              <button className="icon-btn" onClick={() => setShowForm(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              {error && <div className="error-message">{error}</div>}
              <div className="form-group">
                <label>材料名称 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  placeholder="例如：橡木、红铜丝、棉线..."
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>现有数量</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.quantity}
                    onChange={(e) => setFormData((p) => ({ ...p, quantity: Number(e.target.value) }))}
                  />
                </div>
                <div className="form-group">
                  <label>计量单位</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData((p) => ({ ...p, unit: e.target.value }))}
                    placeholder="个/米/克/ml..."
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>单价 (元)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData((p) => ({ ...p, unitPrice: Number(e.target.value) }))}
                  />
                </div>
                <div className="form-group">
                  <label>最低库存预警线</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.warningThreshold}
                    onChange={(e) => setFormData((p) => ({ ...p, warningThreshold: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                  取消
                </button>
                <button type="submit" className="btn-primary">
                  {editingMaterial ? '保存修改' : '添加材料'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
