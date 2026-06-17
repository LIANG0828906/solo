import React, { useState } from 'react';
import FlavorRadar from './FlavorRadar';
import { useAppStore } from '../store/useAppStore';
import { submitBrewRecord } from '../modules/brewing/BrewingController';
import { FlavorRating } from '../modules/brewing/BrewingService';

const FlavorModal: React.FC = () => {
  const {
    flavorModalOpen,
    setFlavorModalOpen,
    currentFlavor,
    setCurrentFlavor,
    resetCurrentFlavor,
    brewForm,
    resetBrewForm,
    setLastSavedRecord,
    setCurrentPage,
  } = useAppStore();
  const [saving, setSaving] = useState(false);

  if (!flavorModalOpen) return null;

  const handleSave = async (publish: boolean) => {
    setSaving(true);
    try {
      const saved = await submitBrewRecord(brewForm, currentFlavor as FlavorRating, publish);
      setLastSavedRecord(saved);
      setFlavorModalOpen(false);
      resetCurrentFlavor();
      resetBrewForm();
      if (publish) {
        setCurrentPage('community');
      }
    } catch (err) {
      console.error('保存失败', err);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => !saving && setFlavorModalOpen(false)}>
      <div
        className="flavor-modal"
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">风味评价</h3>
          <button
            type="button"
            className="modal-close"
            onClick={() => !saving && setFlavorModalOpen(false)}
            disabled={saving}
          >
            ×
          </button>
        </div>

        <div className="modal-subtitle">
          拖拽滑块对每个维度进行评分 (1-10分)
        </div>

        <div className="radar-container">
          <FlavorRadar
            flavor={currentFlavor as FlavorRating}
            onChange={setCurrentFlavor}
            size={420}
            interactive={true}
            showLabels={true}
          />
        </div>

        <div className="flavor-score-grid">
          {Object.entries(currentFlavor).map(([key, val]) => (
            <div key={key} className="flavor-score-item">
              <span className="flavor-score-label">{key}</span>
              <div className="flavor-score-bar">
                <div
                  className="flavor-score-fill"
                  style={{
                    width: `${val * 10}%`,
                    background: getFlavorColor(key),
                  }}
                />
              </div>
              <span className="flavor-score-val">{val}</span>
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => handleSave(false)}
            disabled={saving}
          >
            {saving ? '保存中...' : '仅保存'}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => handleSave(true)}
            disabled={saving}
          >
            {saving ? '发布中...' : '保存并发布'}
          </button>
        </div>
      </div>
    </div>
  );
};

const getFlavorColor = (key: string): string => {
  const map: { [k: string]: string } = {
    酸度: '#E74C3C',
    甜度: '#F39C12',
    苦度: '#6B4423',
    醇厚度: '#34495E',
    干净度: '#3498DB',
    余韵: '#9B59B6',
  };
  return map[key] || '#E67E22';
};

export default FlavorModal;
