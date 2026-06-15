import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Exhibit, Booth } from '../types';
import apiService from '../services/apiService';
import DnDCol from '../components/DnDCol';

interface ExhibitFormData {
  name: string;
  description: string;
  imageUrl: string;
  tags: string;
}

interface QRModalData {
  boothId: string;
  boothNumber: number;
  boothName: string;
  qrCode: string;
  visitorUrl: string;
}

const BOOTHS_PER_PAGE = 9;

const AdminApp: React.FC = () => {
  const [exhibits, setExhibits] = useState<Exhibit[]>([]);
  const [booths, setBooths] = useState<Booth[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [highlightedBooth, setHighlightedBooth] = useState<string | null>(null);
  const [showExhibitModal, setShowExhibitModal] = useState(false);
  const [showBoothModal, setShowBoothModal] = useState(false);
  const [editingExhibit, setEditingExhibit] = useState<Exhibit | null>(null);
  const [newBoothName, setNewBoothName] = useState('');
  const [formData, setFormData] = useState<ExhibitFormData>({
    name: '',
    description: '',
    imageUrl: '',
    tags: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [qrModal, setQrModal] = useState<QRModalData | null>(null);

  const totalPages = Math.max(1, Math.ceil(booths.length / BOOTHS_PER_PAGE));
  const displayBooths = booths.slice(currentPage * BOOTHS_PER_PAGE, (currentPage + 1) * BOOTHS_PER_PAGE);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [exhibitsData, boothsData] = await Promise.all([
        apiService.getExhibits(),
        apiService.getBooths(),
      ]);
      setExhibits(exhibitsData);
      setBooths(boothsData);
      if (boothsData.length === 0) {
        await initializeDefaultBooths();
        loadData();
        return;
      }
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const initializeDefaultBooths = async () => {
    const defaultNames = [
      '古典艺术区', '印象派专区', '东方艺术馆',
      '瓷器展厅', '雕塑长廊', '现代艺术区',
      '书画展厅', '特展区A', '特展区B',
    ];
    for (let i = 0; i < defaultNames.length; i++) {
      try {
        await apiService.createBooth({ name: defaultNames[i] });
      } catch (err) {
        console.error('初始化展位失败:', err);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAssign = useCallback(
    async (boothId: string, exhibitIds: string[]) => {
      try {
        const updatedBooth = await apiService.assignExhibitsToBooth(boothId, exhibitIds);
        setBooths((prev) => prev.map((b) => (b.id === boothId ? updatedBooth : b)));
        const [updatedExhibits] = await Promise.all([apiService.getExhibits()]);
        setExhibits(updatedExhibits);
      } catch (err) {
        console.error('分配展品失败:', err);
      }
    },
    []
  );

  const handleHighlightBooth = useCallback((boothId: string) => {
    setHighlightedBooth(boothId);
    const cards = document.querySelectorAll('.booth-card');
    cards.forEach((card) => {
      if (card.getAttribute('data-booth-id') === boothId) {
        card.classList.add('highlight');
        setTimeout(() => card.classList.remove('highlight'), 300);
      }
    });
  }, []);

  const handleRemoveExhibit = useCallback(
    (boothId: string, exhibitId: string) => {
      const booth = booths.find((b) => b.id === boothId);
      if (!booth) return;
      const newIds = booth.exhibitIds.filter((id) => id !== exhibitId);
      handleAssign(boothId, newIds);
    },
    [booths, handleAssign]
  );

  const openAddModal = () => {
    setEditingExhibit(null);
    setFormData({ name: '', description: '', imageUrl: '', tags: '' });
    setFormError(null);
    setShowExhibitModal(true);
  };

  const openEditModal = (exhibit: Exhibit) => {
    setEditingExhibit(exhibit);
    setFormData({
      name: exhibit.name,
      description: exhibit.description,
      imageUrl: exhibit.imageUrl,
      tags: exhibit.tags.join(', '),
    });
    setFormError(null);
    setShowExhibitModal(true);
  };

  const validateImageUrl = (url: string): boolean => {
    return /\.(jpg|jpeg|png|gif)$/i.test(url.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('请输入展品名称');
      return;
    }
    if (!formData.description.trim()) {
      setFormError('请输入展品简介');
      return;
    }
    if (!formData.imageUrl.trim()) {
      setFormError('请输入图片URL');
      return;
    }
    if (!validateImageUrl(formData.imageUrl)) {
      setFormError('图片URL格式必须为.jpg/.png/.gif');
      return;
    }

    const tagsArr = formData.tags
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      if (editingExhibit) {
        await apiService.updateExhibit(editingExhibit.id, {
          name: formData.name.trim(),
          description: formData.description.trim(),
          imageUrl: formData.imageUrl.trim(),
          tags: tagsArr,
        });
      } else {
        await apiService.createExhibit({
          name: formData.name.trim(),
          description: formData.description.trim(),
          imageUrl: formData.imageUrl.trim(),
          tags: tagsArr,
        });
      }
      setShowExhibitModal(false);
      loadData();
    } catch (err: any) {
      const msg = err?.response?.data?.error || '操作失败，请重试';
      setFormError(msg);
    }
  };

  const handleDeleteExhibit = async (id: string) => {
    if (!window.confirm('确定删除此展品吗？')) return;
    try {
      await apiService.deleteExhibit(id);
      loadData();
    } catch (err) {
      console.error('删除失败:', err);
      alert('删除失败');
    }
  };

  const handleCreateBooth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoothName.trim()) {
      alert('请输入展位名称');
      return;
    }
    try {
      await apiService.createBooth({ name: newBoothName.trim() });
      setNewBoothName('');
      setShowBoothModal(false);
      loadData();
    } catch (err: any) {
      const msg = err?.response?.data?.error || '创建失败，请重试';
      alert(msg);
    }
  };

  const handleQrClick = async (booth: Booth) => {
    try {
      const result = await apiService.getBoothQRCode(booth.id);
      setQrModal({
        boothId: booth.id,
        boothNumber: result.boothNumber,
        boothName: result.boothName,
        qrCode: result.qrCode,
        visitorUrl: result.visitorUrl,
      });
    } catch (err) {
      console.error('二维码生成失败:', err);
      alert('二维码生成失败');
    }
  };

  const downloadQRCode = () => {
    if (!qrModal) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = 220;
      canvas.height = 220;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 220, 220);
      ctx.drawImage(img, 10, 10, 200, 200);

      ctx.fillStyle = '#6366f1';
      ctx.fillRect(90, 90, 40, 40);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(qrModal.boothNumber), 110, 110);

      const link = document.createElement('a');
      link.download = `展位${qrModal.boothNumber}-${qrModal.boothName}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = qrModal.qrCode;
  };

  const renderExhibitCard = (exhibit: Exhibit, _index: number, isDragging: boolean) => (
    <div
      className={`exhibit-card ${isDragging ? 'dragging' : ''}`}
      data-exhibit-id={exhibit.id}
    >
      <img src={exhibit.imageUrl} alt={exhibit.name} className="exhibit-thumb" loading="lazy" />
      <div className="exhibit-info">
        <div className="exhibit-name">{exhibit.name}</div>
        <div className="exhibit-desc">{exhibit.description}</div>
        {exhibit.tags.length > 0 && (
          <div className="exhibit-tags">
            {exhibit.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="exhibit-tag">
                {tag}
              </span>
            ))}
            {exhibit.tags.length > 3 && (
              <span className="exhibit-tag">+{exhibit.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const goToPrevPage = () => {
    setCurrentPage((p) => Math.max(0, p - 1));
  };

  const goToNextPage = () => {
    setCurrentPage((p) => Math.min(totalPages - 1, p + 1));
  };

  if (loading) {
    return (
      <div className="admin-layout" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '16px', color: '#a5b4fc' }}>加载中...</div>
      </div>
    );
  }

  return (
    <>
      <div style={{ position: 'fixed', top: '20px', left: '340px', zIndex: 999, display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button className="admin-btn admin-btn-primary" onClick={openAddModal}>
          <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span> 新增展品
        </button>
        <button className="admin-btn admin-btn-secondary" onClick={() => setShowBoothModal(true)}>
          <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span> 新增展位
        </button>
      </div>

      {totalPages > 1 && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '24px',
            zIndex: 999,
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            background: 'rgba(22, 33, 62, 0.9)',
            padding: '8px 16px',
            borderRadius: '8px',
            backdropFilter: 'blur(10px)',
          }}
        >
          <button
            className="admin-btn admin-btn-secondary admin-btn-sm"
            onClick={goToPrevPage}
            disabled={currentPage === 0}
            style={{ opacity: currentPage === 0 ? 0.5 : 1 }}
          >
            ← 上一页
          </button>
          <span style={{ color: '#e5e7eb', fontSize: '13px' }}>
            {currentPage + 1} / {totalPages}
          </span>
          <button
            className="admin-btn admin-btn-secondary admin-btn-sm"
            onClick={goToNextPage}
            disabled={currentPage === totalPages - 1}
            style={{ opacity: currentPage === totalPages - 1 ? 0.5 : 1 }}
          >
            下一页 →
          </button>
        </div>
      )}

      <DnDCol
        exhibits={exhibits}
        booths={displayBooths}
        onAssign={handleAssign}
        onHighlightBooth={handleHighlightBooth}
        onRemoveExhibit={handleRemoveExhibit}
        renderExhibitCard={renderExhibitCard}
        onEditExhibit={openEditModal}
        onDeleteExhibit={handleDeleteExhibit}
      />

      {displayBooths.map((booth) => (
        <QrButtonInjection
          key={`qr-trigger-${booth.id}`}
          booth={booth}
          highlighted={highlightedBooth === booth.id}
          onClick={() => handleQrClick(booth)}
        />
      ))}

      {showExhibitModal && (
        <div className="modal-overlay" onClick={() => setShowExhibitModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editingExhibit ? '编辑展品' : '新增展品'}</div>
              <button className="modal-close" onClick={() => setShowExhibitModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">展品名称 *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入展品名称"
                />
              </div>
              <div className="form-group">
                <label className="form-label">展品简介 *</label>
                <textarea
                  className="form-textarea"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="请输入展品简介"
                />
              </div>
              <div className="form-group">
                <label className="form-label">图片URL * (.jpg/.png/.gif)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="form-group">
                <label className="form-label">标签 (逗号分隔)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="绘画, 印象派, 油画"
                />
              </div>
              {formError && <div className="form-error">{formError}</div>}
              <div className="form-actions">
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setShowExhibitModal(false)}
                >
                  取消
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  {editingExhibit ? '保存修改' : '添加展品'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBoothModal && (
        <div className="modal-overlay" onClick={() => setShowBoothModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">新增展位</div>
              <button className="modal-close" onClick={() => setShowBoothModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateBooth}>
              <div className="form-group">
                <label className="form-label">展位名称 *</label>
                <input
                  type="text"
                  className="form-input"
                  value={newBoothName}
                  onChange={(e) => setNewBoothName(e.target.value)}
                  placeholder="请输入展位名称"
                  autoFocus
                />
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setShowBoothModal(false)}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={!newBoothName.trim()}
                >
                  创建展位
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {qrModal && (
        <div className="modal-overlay" onClick={() => setQrModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">展位二维码</div>
              <button className="modal-close" onClick={() => setQrModal(null)}>
                ✕
              </button>
            </div>
            <div className="qr-display">
              <div className="qr-wrapper">
                <img src={qrModal.qrCode} alt={`展位${qrModal.boothNumber}二维码`} />
                <div className="qr-badge">{qrModal.boothNumber}</div>
              </div>
              <div className="qr-info">
                <div className="qr-info-name">展位 {qrModal.boothNumber} · {qrModal.boothName}</div>
                <div style={{ fontSize: '12px', wordBreak: 'break-all', color: '#9ca3af' }}>{qrModal.visitorUrl}</div>
              </div>
              <button className="admin-btn admin-btn-primary" onClick={downloadQRCode}>
                📥 下载为PNG图片
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

interface QrButtonInjectionProps {
  booth: Booth;
  highlighted: boolean;
  onClick: () => void;
}

const QrButtonInjection: React.FC<QrButtonInjectionProps> = ({ booth, onClick }) => {
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const injectedRef = useRef(false);

  useEffect(() => {
    if (injectedRef.current) return;
    let attempts = 0;
    const inject = () => {
      attempts++;
      if (attempts > 50) return;
      const headerEl = Array.from(document.querySelectorAll('.booth-header')).find((el) => {
        const numEl = el.querySelector('.booth-number');
        return numEl?.textContent === String(booth.number);
      });
      if (!headerEl) {
        requestAnimationFrame(inject);
        return;
      }
      const card = headerEl.closest('.booth-card') as HTMLElement | null;
      if (!card) {
        requestAnimationFrame(inject);
        return;
      }
      card.setAttribute('data-booth-id', booth.id);

      if (card.querySelector(`[data-qr-btn="${booth.id}"]`)) {
        injectedRef.current = true;
        return;
      }

      const existingBtn = btnRef.current;
      if (existingBtn && existingBtn.parentNode) {
        existingBtn.parentNode.removeChild(existingBtn);
      }

      const btn = document.createElement('button');
      btn.className = 'booth-qr-btn';
      btn.setAttribute('data-qr-btn', booth.id);
      btn.innerHTML = '▦';
      btn.title = '生成二维码';
      btn.addEventListener('click', onClick);
      card.appendChild(btn);
      btnRef.current = btn;
      injectedRef.current = true;
    };
    inject();
    return () => {
      if (btnRef.current?.parentNode) {
        btnRef.current.parentNode.removeChild(btnRef.current);
      }
      injectedRef.current = false;
    };
  }, [booth.id, booth.number, onClick]);

  return null;
};

export default AdminApp;
