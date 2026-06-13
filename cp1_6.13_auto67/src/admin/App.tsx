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

const AdminApp: React.FC = () => {
  const [exhibits, setExhibits] = useState<Exhibit[]>([]);
  const [booths, setBooths] = useState<Booth[]>([]);
  const [loading, setLoading] = useState(true);
  const [highlightedBooth, setHighlightedBooth] = useState<string | null>(null);
  const [showExhibitModal, setShowExhibitModal] = useState(false);
  const [editingExhibit, setEditingExhibit] = useState<Exhibit | null>(null);
  const [formData, setFormData] = useState<ExhibitFormData>({
    name: '',
    description: '',
    imageUrl: '',
    tags: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [qrModal, setQrModal] = useState<QRModalData | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [exhibitsData, boothsData] = await Promise.all([
        apiService.getExhibits(),
        apiService.getBooths(),
      ]);
      setExhibits(exhibitsData);
      setBooths(boothsData);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

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
    const link = document.createElement('a');
    link.download = `展位${qrModal.boothNumber}-${qrModal.boothName}.png`;
    link.href = qrModal.qrCode;
    link.click();
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

  if (loading) {
    return (
      <div className="admin-layout" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '16px', color: '#a5b4fc' }}>加载中...</div>
      </div>
    );
  }

  return (
    <>
      <DnDCol
        exhibits={exhibits}
        booths={booths}
        onAssign={handleAssign}
        onHighlightBooth={handleHighlightBooth}
        onRemoveExhibit={handleRemoveExhibit}
        renderExhibitCard={renderExhibitCard}
        onEditExhibit={openEditModal}
        onDeleteExhibit={handleDeleteExhibit}
      />

      <div style={{ position: 'fixed', top: '20px', left: '340px', zIndex: 999 }}>
        <button className="admin-btn admin-btn-primary" onClick={openAddModal}>
          <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span> 新增展品
        </button>
      </div>

      {booths.map((booth) => (
        <React.Fragment key={`qr-trigger-${booth.id}`}>
          <div
            style={{ display: 'none' }}
            ref={(el) => {
              if (!el || el.dataset.injected) return;
              el.dataset.injected = 'true';
              const card = document.querySelector(`[data-booth-id="${booth.id}"]`) as HTMLElement | null;
              if (!card) return;
            }}
          />
          <QrButtonInjection
            key={booth.id}
            booth={booth}
            highlighted={highlightedBooth === booth.id}
            onClick={() => handleQrClick(booth)}
          />
        </React.Fragment>
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
                <img src={qrModal.qrCode} alt={`展位${qrModal.boothNumber}二维码`} ref={qrCanvasRef as any} />
                <div className="qr-badge">{qrModal.boothNumber}</div>
              </div>
              <div className="qr-info">
                <div className="qr-info-name">展位 {qrModal.boothNumber} · {qrModal.boothName}</div>
                <div style={{ fontSize: '12px', wordBreak: 'break-all' }}>{qrModal.visitorUrl}</div>
              </div>
              <button className="admin-btn admin-btn-primary" onClick={downloadQRCode}>
                📥 下载二维码
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
