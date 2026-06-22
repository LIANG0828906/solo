import React, { useState, useEffect, useRef } from 'react';
import type { Material, InventoryRecord, DailyStock } from '../types';
import { useMaterials } from '../context/MaterialContext';

interface MaterialDetailProps {
  materialId: string;
  onBack: () => void;
  onDelete: () => void;
}

export default function MaterialDetail({ materialId, onBack, onDelete }: MaterialDetailProps) {
  const { getMaterialById, updateMaterial, deleteMaterial, categories } = useMaterials();
  const [material, setMaterial] = useState<Material | null>(null);
  const [inventoryRecords, setInventoryRecords] = useState<InventoryRecord[]>([]);
  const [dailyStocks, setDailyStocks] = useState<DailyStock[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Material>>({});
  const [buttonScale, setButtonScale] = useState<{ edit: boolean; delete: boolean }>({ edit: false, delete: false });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/materials/${materialId}`);
        const data = await res.json();
        setMaterial(data);
        setEditForm(data);
      } catch (err) {
        console.error('获取材料详情失败:', err);
      }

      try {
        const res = await fetch(`/api/inventory/${materialId}`);
        const data = await res.json();
        setInventoryRecords(data);
      } catch (err) {
        console.error('获取库存记录失败:', err);
      }

      try {
        const res = await fetch(`/api/inventory/${materialId}/trend`);
        const data = await res.json();
        setDailyStocks(data);
      } catch (err) {
        console.error('获取库存趋势失败:', err);
      }
    };
    fetchData();
  }, [materialId]);

  useEffect(() => {
    if (canvasRef.current && dailyStocks.length > 0) {
      drawChart();
    }
  }, [dailyStocks]);

  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = 60 * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = 60;
    const barWidth = 6;
    const barGap = 4;
    const barsCount = dailyStocks.length;

    const maxStock = Math.max(...dailyStocks.map(d => d.stock), 1);
    const minStock = 0;

    const totalBarsWidth = barsCount * barWidth + (barsCount - 1) * barGap;
    const startX = (width - totalBarsWidth) / 2;

    dailyStocks.forEach((day, index) => {
      const x = startX + index * (barWidth + barGap);
      const barHeight = Math.max(2, (day.stock / maxStock) * (height - 8));
      const y = height - barHeight - 4;

      const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
      gradient.addColorStop(0, '#3B82F6');
      gradient.addColorStop(1, '#10B981');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 2);
      ctx.fill();
    });
  };

  const handleEditClick = () => {
    setButtonScale(prev => ({ ...prev, edit: true }));
    setTimeout(() => {
      setButtonScale(prev => ({ ...prev, edit: false }));
      setShowEditModal(true);
    }, 200);
  };

  const handleDeleteClick = () => {
    setButtonScale(prev => ({ ...prev, delete: true }));
    setTimeout(() => {
      setButtonScale(prev => ({ ...prev, delete: false }));
      if (confirm('确定要删除这个材料吗？')) {
        deleteMaterial(materialId);
        onDelete();
      }
    }, 200);
  };

  const handleSave = async () => {
    await updateMaterial(materialId, editForm);
    const res = await fetch(`/api/materials/${materialId}`);
    const data = await res.json();
    setMaterial(data);
    setShowEditModal(false);
  };

  const getCategoryName = (catId: string) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : catId;
  };

  if (!material) {
    return (
      <div style={styles.loading}>
        <div>加载中...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <button style={styles.backButton} onClick={onBack}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m15 18-6-6 6-6"></path>
        </svg>
        返回列表
      </button>

      <div style={styles.header}>
        <h1 style={styles.title}>{material.name}</h1>
        <span style={styles.categoryTag}>{getCategoryName(material.category)}</span>
      </div>

      <div style={styles.imageContainer}>
        <img src={material.image} alt={material.name} style={styles.image} />
      </div>

      <div style={styles.contentGrid}>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <span style={styles.sectionIcon}>📋</span> 属性信息
          </h2>
          <div style={styles.attrList}>
            {[
              { label: '品牌', value: material.brand },
              { label: '规格', value: material.spec },
              { label: '购入日期', value: material.purchaseDate },
              { label: '单价', value: `¥${material.unitPrice}` },
              { label: '当前数量', value: `${material.quantity} ${material.unit}` },
              { label: '存放位置', value: material.location },
            ].map((attr, idx) => (
              <div key={idx} style={styles.attrItem}>
                <span style={styles.attrLabel}>{attr.label}</span>
                <span style={styles.attrValue}>{attr.value}</span>
              </div>
            ))}
          </div>

          <h3 style={styles.subSectionTitle}>标签</h3>
          <div style={styles.tagsContainer}>
            {material.tags.map((tag, idx) => (
              <span key={idx} style={styles.tag}>{tag}</span>
            ))}
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <span style={styles.sectionIcon}>📁</span> 关联项目
          </h2>
          <div style={styles.projectList}>
            {material.projects.map((project, idx) => (
              <div key={idx} style={styles.projectItem}>
                <span style={styles.projectDot}></span>
                <span style={styles.projectName}>{project}</span>
                <svg style={styles.projectArrow} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m9 18 6-6-6-6"></path>
                </svg>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>
          <span style={styles.sectionIcon}>📊</span> 库存趋势 (近30天)
        </h2>
        <div style={styles.chartContainer}>
          <canvas ref={canvasRef} style={styles.chartCanvas} />
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>
          <span style={styles.sectionIcon}>📝</span> 库存变动记录
        </h2>
        <div style={styles.recordList}>
          {inventoryRecords.slice(0, 10).map(record => (
            <div key={record.id} style={styles.recordItem}>
              <span
                style={{
                  ...styles.recordType,
                  backgroundColor: record.type === 'in' ? '#10B98120' : '#EF444420',
                  color: record.type === 'in' ? '#10B981' : '#EF4444',
                }}
              >
                {record.type === 'in' ? '+' : '-'}{record.quantity}
              </span>
              <span style={styles.recordDate}>{record.date}</span>
              {record.note && <span style={styles.recordNote}>{record.note}</span>}
            </div>
          ))}
        </div>
      </div>

      <div style={styles.actions}>
        <button
          style={{
            ...styles.button,
            ...styles.editButton,
            transform: buttonScale.edit ? 'scale(0.95)' : 'scale(1)',
            transition: 'transform 0.2s ease',
          }}
          onClick={handleEditClick}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
          </svg>
          编辑
        </button>
        <button
          style={{
            ...styles.button,
            ...styles.deleteButton,
            transform: buttonScale.delete ? 'scale(0.95)' : 'scale(1)',
            transition: 'transform 0.2s ease',
          }}
          onClick={handleDeleteClick}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18"></path>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
          </svg>
          删除
        </button>
      </div>

      {showEditModal && (
        <EditModal
          material={material}
          editForm={editForm}
          setEditForm={setEditForm}
          categories={categories}
          onClose={() => setShowEditModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

interface EditModalProps {
  material: Material;
  editForm: Partial<Material>;
  setEditForm: (form: Partial<Material>) => void;
  categories: { id: string; name: string; icon: string }[];
  onClose: () => void;
  onSave: () => void;
}

function EditModal({ material, editForm, setEditForm, categories, onClose, onSave }: EditModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 350);
  };

  const handleInputChange = (field: keyof Material, value: any) => {
    setEditForm({ ...editForm, [field]: value });
  };

  return (
    <div
      style={{
        ...styles.modalOverlay,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      onClick={handleClose}
    >
      <div
        style={{
          ...styles.modalContent,
          transform: isVisible ? 'translateY(0)' : 'translateY(-50px)',
          transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>编辑材料</h2>
          <button style={styles.modalClose} onClick={handleClose}>✕</button>
        </div>

        <div style={styles.formGrid}>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>材料名称</label>
            <input
              type="text"
              style={styles.formInput}
              value={editForm.name || ''}
              onChange={e => handleInputChange('name', e.target.value)}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>分类</label>
            <select
              style={styles.formInput}
              value={editForm.category || ''}
              onChange={e => handleInputChange('category', e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>品牌</label>
            <input
              type="text"
              style={styles.formInput}
              value={editForm.brand || ''}
              onChange={e => handleInputChange('brand', e.target.value)}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>规格</label>
            <input
              type="text"
              style={styles.formInput}
              value={editForm.spec || ''}
              onChange={e => handleInputChange('spec', e.target.value)}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>购入日期</label>
            <input
              type="date"
              style={styles.formInput}
              value={editForm.purchaseDate || ''}
              onChange={e => handleInputChange('purchaseDate', e.target.value)}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>单价 (元)</label>
            <input
              type="number"
              style={styles.formInput}
              value={editForm.unitPrice || 0}
              onChange={e => handleInputChange('unitPrice', Number(e.target.value))}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>当前数量</label>
            <input
              type="number"
              style={styles.formInput}
              value={editForm.quantity || 0}
              onChange={e => handleInputChange('quantity', Number(e.target.value))}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>单位</label>
            <input
              type="text"
              style={styles.formInput}
              value={editForm.unit || ''}
              onChange={e => handleInputChange('unit', e.target.value)}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>存放位置</label>
            <input
              type="text"
              style={styles.formInput}
              value={editForm.location || ''}
              onChange={e => handleInputChange('location', e.target.value)}
            />
          </div>
        </div>

        <div style={styles.modalFooter}>
          <button style={{ ...styles.button, ...styles.cancelButton }} onClick={handleClose}>
            取消
          </button>
          <button style={{ ...styles.button, ...styles.editButton }} onClick={onSave}>
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px 32px',
    maxWidth: '900px',
    margin: '0 auto',
    backgroundColor: '#F8FAFC',
    minHeight: '100vh',
    boxSizing: 'border-box',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    fontSize: '16px',
    color: '#64748B',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    color: '#64748B',
    fontSize: '14px',
    cursor: 'pointer',
    marginBottom: '16px',
    transition: 'background-color 0.2s ease',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#1E293B',
    margin: 0,
  },
  categoryTag: {
    backgroundColor: '#F59E0B',
    color: '#FFFFFF',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 500,
  },
  imageContainer: {
    marginBottom: '24px',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    aspectRatio: '4/3',
    objectFit: 'cover',
    borderRadius: '12px',
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1fr',
    gap: '24px',
    marginBottom: '24px',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1E293B',
    margin: '0 0 16px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  sectionIcon: {
    fontSize: '18px',
  },
  subSectionTitle: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#1E293B',
    margin: '16px 0 8px 0',
  },
  attrList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  attrItem: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingBottom: '12px',
    borderBottom: '1px solid #F1F5F9',
  },
  attrLabel: {
    fontSize: '13px',
    color: '#64748B',
  },
  attrValue: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#1E293B',
  },
  tagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  tag: {
    backgroundColor: '#E2E8F0',
    color: '#1E293B',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '12px',
  },
  projectList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  projectItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 12px',
    borderRadius: '8px',
    backgroundColor: '#F8FAFC',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  projectDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#10B981',
    marginRight: '10px',
  },
  projectName: {
    flex: 1,
    fontSize: '14px',
    color: '#1E293B',
  },
  projectArrow: {
    color: '#94A3B8',
  },
  chartContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: '8px',
    padding: '16px',
  },
  chartCanvas: {
    width: '100%',
    height: '60px',
  },
  recordList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  recordItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 12px',
    backgroundColor: '#F8FAFC',
    borderRadius: '8px',
    fontSize: '13px',
  },
  recordType: {
    padding: '3px 10px',
    borderRadius: '6px',
    fontWeight: 600,
    marginRight: '12px',
    minWidth: '45px',
    textAlign: 'center',
  },
  recordDate: {
    color: '#64748B',
    flex: 1,
  },
  recordNote: {
    color: '#94A3B8',
    fontSize: '12px',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
  },
  button: {
    flex: 1,
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '15px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'opacity 0.2s ease',
  },
  editButton: {
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    color: '#FFFFFF',
  },
  cancelButton: {
    backgroundColor: '#E2E8F0',
    color: '#1E293B',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#00000066',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: '80px',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '560px',
    maxHeight: '80vh',
    overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #E2E8F0',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1E293B',
    margin: 0,
  },
  modalClose: {
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '20px',
    color: '#94A3B8',
    cursor: 'pointer',
    padding: '4px 8px',
  },
  formGrid: {
    padding: '20px 24px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  formLabel: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#475569',
  },
  formInput: {
    padding: '10px 12px',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    backgroundColor: '#FFFFFF',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '16px 24px',
    borderTop: '1px solid #E2E8F0',
  },
};
