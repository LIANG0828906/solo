import React, { useState, memo } from 'react';
import { usePerfumeStore } from '../stores/perfumeStore';
import type { Perfume, FormulaItem } from '../types';
import { getMoodOption } from '../types';
import { generateGradient } from '../engine/mixEngine';
import '../styles/PerfumeLibraryGrid.css';

interface MiniBottleProps {
  formula: FormulaItem[];
  dominantColor: string;
}

const MiniBottle: React.FC<MiniBottleProps> = memo(({ formula, dominantColor }) => {
  const gradient = generateGradient(formula);
  return (
    <div className="mini-bottle-stage">
      <div className="mini-bottle-glow" style={{ background: `radial-gradient(circle, ${dominantColor}55 0%, transparent 70%)` }} />
      <div className="mini-bottle">
        <div className="mini-bottle-cap" />
        <div className="mini-bottle-neck" />
        <div className="mini-bottle-body">
          <div className="mini-bottle-liquid" style={{ background: gradient }} />
        </div>
      </div>
    </div>
  );
});
MiniBottle.displayName = 'MiniBottle';

interface PerfumeCardProps {
  perfume: Perfume;
  expandedId: string | null;
  onToggle: (id: string) => void;
  onRemix: (id: string) => void;
  onDelete: (id: string) => void;
}

const PerfumeCard: React.FC<PerfumeCardProps> = memo(({
  perfume,
  expandedId,
  onToggle,
  onRemix,
  onDelete,
}) => {
  const expanded = expandedId === perfume.id;
  const mood = getMoodOption(perfume.mood);

  return (
    <div
      className={`perfume-card ${expanded ? 'is-expanded' : ''}`}
      style={{ height: expanded ? 420 : 280 }}
      onClick={() => onToggle(perfume.id)}
    >
      <MiniBottle
        formula={perfume.formula}
        dominantColor={perfume.dominantColor}
      />
      <div className="perfume-card-name">{perfume.name}</div>
      <div
        className="perfume-card-mood"
        style={{ backgroundColor: mood.color }}
      >
        <span className="mood-dot" />
        {mood.label}
      </div>

      {expanded && (
        <div
          className="perfume-card-details"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="details-title">配方详情</div>
          <div className="details-formula-list">
            {perfume.formula.map((item) => (
              <div key={item.id} className="details-formula-row">
                <div
                  className="details-formula-dot"
                  style={{ backgroundColor: item.color }}
                />
                <div className="details-formula-name">{item.name}</div>
                <div className="details-formula-bar">
                  <div
                    className="details-formula-fill"
                    style={{
                      width: `${item.ratio}%`,
                      backgroundColor: item.liquidColor,
                    }}
                  />
                </div>
                <div className="details-formula-pct">{item.ratio.toFixed(0)}%</div>
              </div>
            ))}
          </div>
          <div className="details-actions">
            <button
              className="details-remix-btn"
              onClick={() => onRemix(perfume.id)}
            >
              重新调配
            </button>
            <button
              className="details-delete-btn"
              onClick={() => onDelete(perfume.id)}
            >
              删除
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
PerfumeCard.displayName = 'PerfumeCard';

const PerfumeLibraryGrid: React.FC = () => {
  const perfumeLibrary = usePerfumeStore((s) => s.perfumeLibrary);
  const loadPerfumeToFormula = usePerfumeStore((s) => s.loadPerfumeToFormula);
  const removePerfume = usePerfumeStore((s) => s.removePerfume);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleRemix = (id: string) => {
    loadPerfumeToFormula(id);
    setExpandedId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    removePerfume(id);
    if (expandedId === id) setExpandedId(null);
  };

  return (
    <div className="perfume-library-section">
      <div className="library-header">
        <h2 className="library-title">我的香水库</h2>
        <div className="library-count">
          共 {perfumeLibrary.length} 瓶作品
        </div>
      </div>

      {perfumeLibrary.length === 0 ? (
        <div className="library-empty">
          <div className="library-empty-icon">🧴</div>
          <div className="library-empty-title">香水库还是空的</div>
          <div className="library-empty-desc">完成调香并保存后，作品将在这里展示</div>
        </div>
      ) : (
        <div className="perfume-library-grid">
          {perfumeLibrary.map((perfume) => (
            <PerfumeCard
              key={perfume.id}
              perfume={perfume}
              expandedId={expandedId}
              onToggle={handleToggle}
              onRemix={handleRemix}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PerfumeLibraryGrid;
