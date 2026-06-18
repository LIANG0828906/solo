import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GrowthStage } from '@types/index';
import { PLANT_SPECIES } from '@data/plants';
import { FiX, FiPlus, FiSun, FiCalendar } from 'react-icons/fi';

interface CreatePlantPanelProps {
  visible: boolean;
  gridIndex: number | null;
  onConfirm: (data: { speciesId: string; customName: string; plantDate: string; notes: string; stage: GrowthStage; gridIndex: number }) => void;
  onCancel: () => void;
}

const CreatePlantPanel: React.FC<CreatePlantPanelProps> = ({ visible, gridIndex, onConfirm, onCancel }) => {
  const [speciesId, setSpeciesId] = useState<string>('');
  const [customName, setCustomName] = useState('');
  const [plantDate, setPlantDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    if (!speciesId) return;
    if (gridIndex === null) return;
    onConfirm({
      speciesId,
      customName: customName.trim(),
      plantDate: new Date(plantDate).toISOString(),
      notes: notes.trim(),
      stage: 0,
      gridIndex,
    });
    setSpeciesId('');
    setCustomName('');
    setPlantDate(new Date().toISOString().slice(0, 10));
    setNotes('');
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          <div className="overlay" onClick={onCancel} />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'fixed',
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 50,
              backgroundColor: 'var(--color-card)',
              borderRadius: 'var(--radius-panel)',
              boxShadow: 'var(--shadow-panel)',
              maxHeight: '85vh',
              overflowY: 'auto',
              willChange: 'transform',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--color-card-border)',
                position: 'sticky',
                top: 0,
                backgroundColor: 'var(--color-card)',
                zIndex: 1,
              }}
            >
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>🌱 种植新植物</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                  花园位置 #{gridIndex !== null ? gridIndex + 1 : '-'}
                </div>
              </div>
              <button
                onClick={onCancel}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 999,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(0,0,0,0.06)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent')}
              >
                <FiX size={20} />
              </button>
            </div>

            <div style={{ padding: 20 }}>
              <div style={{ marginBottom: 20 }}>
                <label className="form-label">选择品种 *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(108px, 1fr))', gap: 10 }}>
                  {PLANT_SPECIES.map((sp) => {
                    const selected = speciesId === sp.id;
                    return (
                      <button
                        key={sp.id}
                        type="button"
                        onClick={() => setSpeciesId(sp.id)}
                        style={{
                          padding: '12px 10px',
                          borderRadius: 12,
                          border: selected ? `2px solid ${sp.color}` : '2px solid var(--color-card-border)',
                          backgroundColor: selected ? sp.color + '12' : '#FBF8F0',
                          transition: 'all 0.2s ease',
                          transform: selected ? 'translateY(-2px)' : 'translateY(0)',
                          boxShadow: selected ? `0 6px 14px ${sp.color}25` : 'none',
                        }}
                      >
                        <div style={{ fontSize: 28, marginBottom: 4 }}>{sp.icon}</div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: selected ? 700 : 600,
                            color: selected ? sp.color : 'var(--color-text)',
                          }}
                        >
                          {sp.name}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            marginTop: 2,
                            color: 'var(--color-text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 3,
                          }}
                        >
                          <FiSun size={10} />
                          {sp.lightNeed}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div>
                  <label className="form-label">自定义名称（可选）</label>
                  <input
                    className="form-input"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="如：我的小番茄"
                    maxLength={20}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FiCalendar size={12} />
                    种植日期
                  </label>
                  <input
                    className="form-input"
                    type="date"
                    value={plantDate}
                    onChange={(e) => setPlantDate(e.target.value)}
                    max={new Date().toISOString().slice(0, 10)}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label className="form-label">备注</label>
                <textarea
                  className="form-input"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="种植位置、土壤条件等..."
                  rows={2}
                  maxLength={200}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onCancel}>
                  取消
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={handleConfirm}
                  disabled={!speciesId}
                >
                  <FiPlus size={16} />
                  开始种植
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CreatePlantPanel;
