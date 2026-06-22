import React, { useState, useEffect } from 'react';
import { AllSpeciesParams, SpeciesType } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  params: AllSpeciesParams;
  onSave: (params: AllSpeciesParams) => void;
}

const SPECIES_NAMES: Record<SpeciesType, string> = {
  [SpeciesType.PLANT]: '🌿 植物',
  [SpeciesType.HERBIVORE]: '🐟 食草动物',
  [SpeciesType.CARNIVORE]: '🦊 食肉动物',
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  params,
  onSave,
}) => {
  const [localParams, setLocalParams] = useState<AllSpeciesParams>(params);

  useEffect(() => {
    setLocalParams(params);
  }, [params, isOpen]);

  if (!isOpen) return null;

  const updateParam = (
    species: SpeciesType,
    key: keyof AllSpeciesParams[SpeciesType],
    value: number
  ) => {
    setLocalParams(prev => ({
      ...prev,
      [species]: {
        ...prev[species],
        [key]: value,
      },
    }));
  };

  const handleSave = () => {
    onSave(localParams);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#1B2838',
          borderRadius: 16,
          padding: 32,
          maxWidth: 560,
          width: '90%',
          maxHeight: '85vh',
          overflowY: 'auto',
          color: '#E0E1DD',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 600 }}>⚙️ 物种参数设置</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#E0E1DD',
              fontSize: 24,
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: 8,
            }}
          >
            ×
          </button>
        </div>

        {([SpeciesType.PLANT, SpeciesType.HERBIVORE, SpeciesType.CARNIVORE] as SpeciesType[]).map(species => (
          <div
            key={species}
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderRadius: 12,
              padding: 20,
              marginBottom: 16,
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#A8DADC' }}>
              {SPECIES_NAMES[species]}
            </h3>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                <span>初始数量 (10-200)</span>
                <span style={{ color: '#76B900', fontWeight: 600 }}>{localParams[species].initialCount}</span>
              </div>
              <input
                type="range"
                min={10}
                max={200}
                value={localParams[species].initialCount}
                onChange={e => updateParam(species, 'initialCount', parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                <span>移动速度 (1-5 格/代)</span>
                <span style={{ color: '#76B900', fontWeight: 600 }}>{localParams[species].moveSpeed}</span>
              </div>
              <input
                type="range"
                min={0}
                max={5}
                value={localParams[species].moveSpeed}
                onChange={e => updateParam(species, 'moveSpeed', parseInt(e.target.value))}
                disabled={species === SpeciesType.PLANT}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                <span>繁殖阈值 (5-20 能量)</span>
                <span style={{ color: '#76B900', fontWeight: 600 }}>{localParams[species].reproductionThreshold}</span>
              </div>
              <input
                type="range"
                min={5}
                max={20}
                value={localParams[species].reproductionThreshold}
                onChange={e => updateParam(species, 'reproductionThreshold', parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                <span>捕食效率 (0.1-1.0)</span>
                <span style={{ color: '#76B900', fontWeight: 600 }}>{localParams[species].predationEfficiency.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={localParams[species].predationEfficiency * 100}
                onChange={e => updateParam(species, 'predationEfficiency', parseInt(e.target.value) / 100)}
                disabled={species === SpeciesType.PLANT}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px 20px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'transparent',
              color: '#E0E1DD',
              fontSize: 14,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: '12px 20px',
              borderRadius: 10,
              border: 'none',
              background: '#76B900',
              color: '#0D1B2A',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            保存并应用
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
