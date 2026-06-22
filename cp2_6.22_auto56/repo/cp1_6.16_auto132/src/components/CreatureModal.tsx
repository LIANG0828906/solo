import { useEffect, useRef } from 'react';
import type { Creature, GeneFragment } from '../types';
import { FetchService } from '../services/FetchService';
import { RadarChart } from './RadarChart';

interface CreatureModalProps {
  creature: Creature;
  onClose: () => void;
  onDragStart: (gene: GeneFragment, e: React.DragEvent) => void;
}

export function CreatureModal({ creature, onClose, onDragStart }: CreatureModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      FetchService.drawCreaturePreview(canvasRef.current, creature, 280);
    }
  }, [creature]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span
              style={{
                display: 'inline-block',
                padding: '3px 10px',
                borderRadius: '12px',
                background: 'rgba(106, 90, 205, 0.25)',
                color: '#b9a8ff',
                fontSize: '12px',
                marginBottom: '6px',
                letterSpacing: '1px',
              }}
            >
              {creature.region}神话
            </span>
            <h2 className="modal-title">{creature.name}</h2>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>

        <div className="modal-body">
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                background:
                  'radial-gradient(circle at center, rgba(106, 90, 205, 0.18), transparent 70%)',
                borderRadius: '16px',
                padding: '10px',
                marginBottom: '16px',
              }}
            >
              <canvas ref={canvasRef} style={{ borderRadius: '12px' }} />
            </div>
            <p className="modal-desc">{creature.description}</p>
            <h4 className="detail-section-title">核心基因</h4>
            <div className="gene-list">
              {creature.genes.map((gene) => (
                <div
                  key={gene.id}
                  className="gene-list-item"
                  title={`拖拽 ${gene.name} 到融合槽`}
                >
                  <div
                    className="gene-bar"
                    draggable
                    style={{
                      background: gene.color,
                      color: gene.color,
                      cursor: 'grab',
                    }}
                    onDragStart={(e) => onDragStart(gene, e)}
                  />
                  <span style={{ fontSize: '13px', color: '#D0D0D0' }}>{gene.name}</span>
                  <span className="gene-meta">
                    {gene.type} · {String(gene.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="detail-section-title">能力属性</h4>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 20px' }}>
              <RadarChart abilities={creature.abilities} size={230} />
            </div>
            <AbilityBar label="力量" value={creature.abilities.strength} color="#FF4500" />
            <AbilityBar label="敏捷" value={creature.abilities.agility} color="#00CED1" />
            <AbilityBar label="智慧" value={creature.abilities.wisdom} color="#6A5ACD" />
            <AbilityBar label="神秘" value={creature.abilities.mystery} color="#9932CC" />
            <AbilityBar label="魅力" value={creature.abilities.charm} color="#FF69B4" />
            <AbilityBar label="长寿" value={creature.abilities.longevity} color="#32CD32" />
          </div>
        </div>
      </div>
    </div>
  );
}

function AbilityBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '12px',
          marginBottom: '3px',
          color: '#aaa',
        }}
      >
        <span>{label}</span>
        <span style={{ color: '#E0E0E0', fontWeight: 'bold' }}>{value}</span>
      </div>
      <div
        style={{
          width: '100%',
          height: '6px',
          background: 'rgba(255,255,255,0.06)',
          borderRadius: '3px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${value}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${color}, ${color}99)`,
            borderRadius: '3px',
            boxShadow: `0 0 6px ${color}80`,
          }}
        />
      </div>
    </div>
  );
}
