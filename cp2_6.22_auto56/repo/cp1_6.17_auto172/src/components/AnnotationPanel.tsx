import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { PlanetData, PLANET_COLORS, ZODIAC_SYMBOLS } from '../types';
import { useAppStore } from '../store';

interface AnnotationPanelProps {
  planet: PlanetData;
  onClose: () => void;
  onSave: (planetName: string, content: string) => void;
}

const AnnotationPanel: React.FC<AnnotationPanelProps> = ({ planet, onClose, onSave }) => {
  const existingAnnotation = useAppStore((state) => state.annotations[planet.name]);
  const [content, setContent] = useState(existingAnnotation || '');
  const maxChars = 500;
  const isOverLimit = content.length > maxChars;

  useEffect(() => {
    setContent(existingAnnotation || '');
  }, [planet.name, existingAnnotation]);

  const handleSave = () => {
    if (!isOverLimit) {
      onSave(planet.name, content);
      onClose();
    }
  };

  const planetColor = PLANET_COLORS[planet.name] || '#ffffff';

  return (
    <div className="annotation-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 className="annotation-planet-name" style={{ color: planetColor }}>
          {planet.name}
        </h3>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px' }}
        >
          <X size={18} />
        </button>
      </div>

      <div className="annotation-planet-info">
        <div className="annotation-planet-details">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '24px' }}>{ZODIAC_SYMBOLS[planet.sign]}</span>
            <span style={{ fontWeight: 500 }}>{planet.sign}</span>
            <span style={{ color: 'var(--color-text-muted)' }}>{planet.degree.toFixed(1)}°</span>
          </div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
            第 {planet.house} 宫
          </div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginTop: '4px' }}>
            黄经: {planet.longitude.toFixed(2)}°
          </div>
        </div>
      </div>

      <div>
        <label className="input-label">个人注解</label>
        <textarea
          className={`annotation-textarea ${isOverLimit ? 'over-limit' : ''}`}
          placeholder="写下你对这颗行星的理解和感受..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={maxChars + 100}
        />
        <div className={`char-count ${isOverLimit ? 'over-limit' : ''}`}>
          {content.length} / {maxChars}
        </div>
      </div>

      <div className="annotation-actions">
        <button className="btn-secondary" onClick={onClose}>
          取消
        </button>
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={isOverLimit}
          style={{ opacity: isOverLimit ? 0.5 : 1, cursor: isOverLimit ? 'not-allowed' : 'pointer' }}
        >
          <Save size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
          保存
        </button>
      </div>
    </div>
  );
};

export default AnnotationPanel;
