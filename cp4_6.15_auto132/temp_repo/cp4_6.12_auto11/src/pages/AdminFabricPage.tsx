import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../store/projectStore';
import { createFabric, updateFabric, deleteFabricApi } from '../api/fabricApi';
import { Fabric } from '../types';

const COLORS = ['红', '蓝', '绿', '黄', '紫', '白', '黑'];
const PATTERNS = ['纯色', '条纹', '碎花', '格纹', '几何'];

const AdminFabricPage: React.FC = () => {
  const navigate = useNavigate();
  const { fabrics, loadFabrics, user } = useProjectStore();
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFabric, setEditingFabric] = useState<Fabric | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '红',
    colorCode: '#C98A8A',
    pattern: '纯色',
    gradient: '',
    pricePerMeter: 50,
    stockMeters: 10,
    width: 1.5,
    description: '',
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    loadFabrics().finally(() => setLoading(false));
  }, [loadFabrics, navigate, user]);

  const handleOpenModal = (fabric?: Fabric) => {
    if (fabric) {
      setEditingFabric(fabric);
      setFormData({
        name: fabric.name,
        color: fabric.color,
        colorCode: fabric.colorCode,
        pattern: fabric.pattern,
        gradient: fabric.gradient,
        pricePerMeter: fabric.pricePerMeter,
        stockMeters: fabric.stockMeters,
        width: fabric.width,
        description: fabric.description,
      });
    } else {
      setEditingFabric(null);
      setFormData({
        name: '',
        color: '红',
        colorCode: '#C98A8A',
        pattern: '纯色',
        gradient: '',
        pricePerMeter: 50,
        stockMeters: 10,
        width: 1.5,
        description: '',
      });
    }
    setShowModal(true);
  };

  const generateGradient = () => {
    const baseColor = formData.colorCode;
    const r = parseInt(baseColor.slice(1, 3), 16);
    const g = parseInt(baseColor.slice(3, 5), 16);
    const b = parseInt(baseColor.slice(5, 7), 16);
    const lighter = `rgb(${Math.min(255, r + 30)}, ${Math.min(255, g + 30)}, ${Math.min(255, b + 30)})`;
    const gradient = `linear-gradient(135deg, ${lighter} 0%, ${baseColor} 100%)`;
    setFormData((prev) => ({ ...prev, gradient }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const gradientToUse = formData.gradient || `linear-gradient(135deg, ${formData.colorCode} 0%, ${formData.colorCode} 100%)`;

      if (editingFabric) {
        await updateFabric(editingFabric.id, {
          ...formData,
          gradient: gradientToUse,
        });
      } else {
        await createFabric({
          ...formData,
          gradient: gradientToUse,
        });
      }
      await loadFabrics();
      setShowModal(false);
    } catch (err) {
      console.error('保存失败:', err);
      alert('保存失败，请重试');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('确定要删除这个布料吗？此操作不可恢复。')) {
      try {
        await deleteFabricApi(id);
        await loadFabrics();
      } catch (err) {
        console.error('删除失败:', err);
        alert('删除失败，请重试');
      }
    }
  };

  if (loading) {
    return <div style={styles.loading}>加载中...</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button onClick={() => navigate('/studio')} style={styles.backBtn}>
          ← 返回设计台
        </button>
        <h1 style={styles.title}>⚙️ 布料库管理</h1>
        <button onClick={() => handleOpenModal()} style={styles.addBtn}>
          + 添加布料
        </button>
      </div>

      <div style={styles.content}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.th}>预览</th>
              <th style={styles.th}>名称</th>
              <th style={styles.th}>颜色</th>
              <th style={styles.th}>花纹</th>
              <th style={styles.th}>单价</th>
              <th style={styles.th}>库存</th>
              <th style={styles.th}>门幅</th>
              <th style={styles.th}>操作</th>
            </tr>
          </thead>
          <tbody>
            {fabrics.map((fabric) => (
              <tr key={fabric.id} style={styles.tableRow}>
                <td style={styles.td}>
                  <div
                    style={{ ...styles.swatch, background: fabric.gradient }}
                  />
                </td>
                <td style={{ ...styles.td, fontWeight: 500 }}>{fabric.name}</td>
                <td style={styles.td}>
                  <span style={{ ...styles.colorBadge, background: fabric.colorCode }} />
                  {fabric.color}
                </td>
                <td style={styles.td}>{fabric.pattern}</td>
                <td style={{ ...styles.td, color: '#B87333' }}>¥{fabric.pricePerMeter}</td>
                <td style={{
                  ...styles.td,
                  color: fabric.stockMeters < 5 ? '#C94A4A' : '#5D4037',
                  fontWeight: fabric.stockMeters < 5 ? 600 : 400,
                }}>
                  {fabric.stockMeters} 米
                  {fabric.stockMeters < 5 && <span style={{ marginLeft: 6 }}>⚠️</span>}
                </td>
                <td style={styles.td}>{fabric.width}m</td>
                <td style={styles.td}>
                  <div style={styles.actions}>
                    <button
                      onClick={() => navigate(`/fabric/${fabric.id}`)}
                      style={styles.viewBtn}
                    >
                      查看
                    </button>
                    <button
                      onClick={() => handleOpenModal(fabric)}
                      style={styles.editBtn}
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(fabric.id)}
                      style={styles.deleteBtn}
                    >
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <>
          <div style={styles.overlay} onClick={() => setShowModal(false)} />
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {editingFabric ? '✏️ 编辑布料' : '➕ 添加新布料'}
              </h2>
              <button onClick={() => setShowModal(false)} style={styles.closeBtn}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={styles.modalBody}>
              <div style={styles.grid}>
                <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
                  <label style={styles.label}>布料名称 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>颜色分类 *</label>
                  <select
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    style={styles.input}
                  >
                    {COLORS.map((c) => (
                      <option key={c} value={c}>{c}色</option>
                    ))}
                  </select>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>花纹类型 *</label>
                  <select
                    value={formData.pattern}
                    onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                    style={styles.input}
                  >
                    {PATTERNS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>颜色代码 *</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="color"
                      value={formData.colorCode}
                      onChange={(e) => setFormData({ ...formData, colorCode: e.target.value })}
                      style={{ width: 48, height: 40, padding: 2, borderRadius: 8 }}
                    />
                    <input
                      type="text"
                      value={formData.colorCode}
                      onChange={(e) => setFormData({ ...formData, colorCode: e.target.value })}
                      style={{ ...styles.input, flex: 1 }}
                      placeholder="#RRGGBB"
                    />
                  </div>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>单价 (元/米) *</label>
                  <input
                    type="number"
                    value={formData.pricePerMeter}
                    onChange={(e) => setFormData({ ...formData, pricePerMeter: Number(e.target.value) })}
                    style={styles.input}
                    min={0}
                    step={0.01}
                    required
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>库存 (米) *</label>
                  <input
                    type="number"
                    value={formData.stockMeters}
                    onChange={(e) => setFormData({ ...formData, stockMeters: Number(e.target.value) })}
                    style={styles.input}
                    min={0}
                    step={0.1}
                    required
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>门幅宽度 (米)</label>
                  <input
                    type="number"
                    value={formData.width}
                    onChange={(e) => setFormData({ ...formData, width: Number(e.target.value) })}
                    style={styles.input}
                    min={0.5}
                    step={0.1}
                  />
                </div>

                <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
                  <label style={styles.label}>渐变样式</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="text"
                      value={formData.gradient}
                      onChange={(e) => setFormData({ ...formData, gradient: e.target.value })}
                      style={{ ...styles.input, flex: 1 }}
                      placeholder="linear-gradient(135deg, #fff 0%, #000 100%)"
                    />
                    <button
                      type="button"
                      onClick={generateGradient}
                      style={styles.genBtn}
                    >
                      自动生成
                    </button>
                  </div>
                  {formData.gradient && (
                    <div
                      style={{
                        height: 40,
                        borderRadius: 8,
                        marginTop: 8,
                        background: formData.gradient,
                        border: '1px solid #D7C4A1',
                      }}
                    />
                  )}
                </div>

                <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
                  <label style={styles.label}>布料描述</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    style={{ ...styles.input, minHeight: 80, resize: 'vertical' }}
                    placeholder="输入布料的详细描述..."
                  />
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button type="button" onClick={() => setShowModal(false)} style={styles.cancelBtn}>
                  取消
                </button>
                <button type="submit" style={styles.submitBtn}>
                  {editingFabric ? '保存修改' : '添加布料'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: '#F5F0E8',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 32px',
    background: '#FFFAF4',
    borderBottom: '1px solid #D7C4A1',
  },
  backBtn: {
    padding: '8px 16px',
    borderRadius: 8,
    border: '1px solid #D7C4A1',
    background: 'transparent',
    color: '#5D4037',
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: '#5D4037',
    margin: 0,
  },
  addBtn: {
    padding: '10px 20px',
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(135deg, #B87333 0%, #A6622A 100%)',
    color: '#FFFAF4',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(184, 115, 51, 0.3)',
    fontFamily: 'inherit',
  },
  loading: {
    textAlign: 'center',
    padding: 60,
    color: '#8D6E63',
  },
  content: {
    flex: 1,
    padding: 24,
    overflowY: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: 0,
    background: '#FFFAF4',
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid #E8DDD0',
  },
  tableHeader: {
    background: '#F5F0E8',
  },
  th: {
    padding: '14px 16px',
    textAlign: 'left',
    fontSize: 12,
    fontWeight: 600,
    color: '#5D4037',
    borderBottom: '1px solid #E8DDD0',
  },
  tableRow: {
    borderBottom: '1px solid #F0E8DD',
  },
  td: {
    padding: '12px 16px',
    fontSize: 13,
    color: '#5D4037',
    borderBottom: '1px solid #F0E8DD',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 6,
    border: '2px solid #FFFAF4',
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
  },
  colorBadge: {
    width: 16,
    height: 16,
    borderRadius: 4,
    display: 'inline-block',
    marginRight: 8,
    border: '1px solid #D7C4A1',
  },
  actions: {
    display: 'flex',
    gap: 6,
  },
  viewBtn: {
    padding: '4px 10px',
    borderRadius: 6,
    border: '1px solid #D7C4A1',
    background: 'transparent',
    color: '#5D4037',
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  editBtn: {
    padding: '4px 10px',
    borderRadius: 6,
    border: '1px solid #B87333',
    background: 'transparent',
    color: '#B87333',
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  deleteBtn: {
    padding: '4px 10px',
    borderRadius: 6,
    border: '1px solid #C94A4A',
    background: 'transparent',
    color: '#C94A4A',
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.4)',
    zIndex: 400,
    animation: 'fadeIn 0.3s ease',
  },
  modal: {
    position: 'fixed',
    left: '50%',
    bottom: 0,
    transform: 'translateX(-50%)',
    width: 600,
    maxWidth: '95vw',
    maxHeight: '85vh',
    background: '#FFFAF4',
    borderRadius: '20px 20px 0 0',
    boxShadow: '0 -8px 40px rgba(0, 0, 0, 0.2)',
    zIndex: 401,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    animation: 'slideUp 0.35s ease',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    borderBottom: '1px solid #E8DDD0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#5D4037',
    margin: 0,
  },
  closeBtn: {
    border: 'none',
    background: 'none',
    fontSize: 20,
    cursor: 'pointer',
    color: '#8D6E63',
    padding: 4,
  },
  modalBody: {
    padding: 24,
    overflowY: 'auto',
    flex: 1,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: '#5D4037',
  },
  input: {
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #D7C4A1',
    background: '#FFFAF4',
    fontSize: 14,
    color: '#5D4037',
    outline: 'none',
    fontFamily: 'inherit',
  },
  genBtn: {
    padding: '10px 16px',
    borderRadius: 8,
    border: 'none',
    background: '#D7C4A1',
    color: '#5D4037',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontFamily: 'inherit',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
    padding: '16px 24px',
    borderTop: '1px solid #E8DDD0',
    marginTop: 16,
  },
  cancelBtn: {
    padding: '10px 24px',
    borderRadius: 10,
    border: '1px solid #D7C4A1',
    background: 'transparent',
    color: '#5D4037',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  submitBtn: {
    padding: '10px 24px',
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(135deg, #B87333 0%, #A6622A 100%)',
    color: '#FFFAF4',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(184, 115, 51, 0.3)',
    fontFamily: 'inherit',
  },
};

export default AdminFabricPage;
