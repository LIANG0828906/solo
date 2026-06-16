import { useEffect, useRef, useState } from 'react';
import { useCreatureStore } from '../store/useCreatureStore';
import type { GeneFragment } from '../types';
import { GeneratorService } from '../services/GeneratorService';
import { RadarChart } from './RadarChart';
import { HistoryPanel, HistoryDetailModal } from './HistoryPanel';

interface SlotProps {
  slot: 'A' | 'B';
  content: GeneFragment | null;
  onDrop: (gene: GeneFragment) => void;
  onRemove: () => void;
}

function FusionSlot({ slot, content, onDrop, onRemove }: SlotProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    try {
      const data = e.dataTransfer.getData('text/plain');
      const gene = JSON.parse(data) as GeneFragment;
      if (gene && gene.id) onDrop(gene);
    } catch {
      // ignore parse errors
    }
  };

  return (
    <div className="slot-wrapper">
      <span className="slot-label">融合槽 {slot}</span>
      <div
        className={`slot-container ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={`slot-inner ${isDragOver ? 'drag-over' : ''}`}>
          {content ? (
            <div className="placed-gene">
              <div
                className="placed-gene-bar"
                style={{ background: content.color, color: content.color }}
              />
              <span className="placed-gene-name" title={content.name}>
                {content.name}
              </span>
              <span style={{ fontSize: '10px', color: '#888' }}>
                来自 {content.creatureName}
              </span>
              <button
                className="remove-gene-btn"
                onClick={onRemove}
                aria-label="移除基因"
              >
                移除
              </button>
            </div>
          ) : (
            <span className="slot-hint">
              拖拽基因片段到此处
              <br />
              （左侧子槽）
            </span>
          )}
        </div>
        <div className={`slot-inner ${isDragOver ? 'drag-over' : ''}`}>
          <span
            className="slot-hint"
            style={{ color: 'rgba(255, 255, 255, 0.2)', fontSize: '11px' }}
          >
            · · · · · ·
            <br />
            辅助子槽
          </span>
        </div>
      </div>
    </div>
  );
}

export function FusionLab() {
  const { slotA, slotB, fusionResult, fusionProgress, setSlot, history } =
    useCreatureStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isGenerating = fusionProgress > 0 && fusionProgress < 100;

  useEffect(() => {
    if (fusionResult && canvasRef.current) {
      GeneratorService.drawFusionCreature(
        canvasRef.current,
        fusionResult.morphology,
        fusionResult.colorPalette,
        400
      );
    }
  }, [fusionResult]);

  return (
    <div className="fusion-panel">
      <div className="fusion-main">
        <h2 className="section-title">基因融合实验室</h2>

        <div className="fusion-slots">
          <FusionSlot
            slot="A"
            content={slotA}
            onDrop={(g) => setSlot('A', g)}
            onRemove={() => setSlot('A', null)}
          />
          <FusionSlot
            slot="B"
            content={slotB}
            onDrop={(g) => setSlot('B', g)}
            onRemove={() => setSlot('B', null)}
          />
        </div>

        {isGenerating && (
          <div className="fusion-progress">
            <div className="progress-label">
              <span>⚗ 基因重组中...</span>
              <span>{Math.round(fusionProgress)}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${fusionProgress}%` }}
              />
            </div>
          </div>
        )}

        {!slotA && !slotB && !fusionResult && history.length === 0 && !isGenerating && (
          <div className="empty-state">
            <div className="empty-state-icon">⚗</div>
            从左侧图鉴中
            <br />
            拖拽两个基因片段到融合槽
            <br />
            系统将自动生成全新的融合生物
          </div>
        )}

        {fusionResult && fusionProgress >= 100 && (
          <div className="fusion-result">
            <div className="result-header">
              <h3 className="result-name">{fusionResult.name}</h3>
              <p className="result-parents">
                融合自 <span>{fusionResult.parentCreatures[0]}</span> ×{' '}
                <span>{fusionResult.parentCreatures[1]}</span>
              </p>
            </div>
            <div className="result-canvas-wrap">
              <canvas ref={canvasRef} />
            </div>
            <div className="result-grid">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  background:
                    'radial-gradient(circle at center, rgba(255, 215, 0, 0.06), transparent 70%)',
                  borderRadius: '12px',
                }}
              >
                <RadarChart abilities={fusionResult.abilities} size={220} />
              </div>
              <div>
                <h4
                  style={{
                    color: '#6A5ACD',
                    fontSize: '15px',
                    margin: '6px 0 10px 0',
                    paddingLeft: '8px',
                    borderLeft: '3px solid #6A5ACD',
                  }}
                >
                  融合基因片段
                </h4>
                {fusionResult.parentGenes.map((g) => (
                  <div
                    key={g.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 10px',
                      background: 'rgba(255,255,255,0.04)',
                      borderRadius: '6px',
                      marginBottom: '6px',
                    }}
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '6px',
                        background: g.color,
                        borderRadius: '3px',
                        boxShadow: `0 0 6px ${g.color}`,
                      }}
                    />
                    <span style={{ fontSize: '12px', color: '#E0E0E0', flex: 1 }}>
                      {g.name}
                    </span>
                    <span style={{ fontSize: '10px', color: '#888' }}>
                      {g.creatureName}
                    </span>
                  </div>
                ))}
                <h4
                  style={{
                    color: '#6A5ACD',
                    fontSize: '15px',
                    margin: '16px 0 10px 0',
                    paddingLeft: '8px',
                    borderLeft: '3px solid #6A5ACD',
                  }}
                >
                  形态基因
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {fusionResult.morphology.map((m) => (
                    <span
                      key={m}
                      style={{
                        padding: '3px 10px',
                        background: 'rgba(255, 215, 0, 0.1)',
                        border: '1px solid rgba(255, 215, 0, 0.25)',
                        borderRadius: '12px',
                        fontSize: '11px',
                        color: '#FFD700',
                      }}
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <p className="result-description" style={{ marginTop: '20px' }}>
              {fusionResult.description}
            </p>
          </div>
        )}
      </div>
      <HistoryPanel />
      <HistoryDetailModal />
    </div>
  );
}
