import { useEffect, useRef } from 'react';
import { useCreatureStore } from '../store/useCreatureStore';
import type { FusionResult } from '../types';
import { GeneratorService } from '../services/GeneratorService';

function formatTime(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function HistoryThumb({ result }: { result: FusionResult }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) {
      GeneratorService.drawFusionCreature(ref.current, result.morphology, result.colorPalette, 50);
    }
  }, [result]);
  return <canvas ref={ref} style={{ display: 'block' }} />;
}

export function HistoryPanel() {
  const { history, deleteFromHistory, clearHistory, selectHistory } = useCreatureStore();

  return (
    <div className="history-panel">
      <h2
        className="section-title"
        style={{
          fontSize: '16px',
          margin: '0 0 14px 0',
          letterSpacing: '1px',
        }}
      >
        融合记录
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '12px',
            color: '#aaa',
            fontWeight: 'normal',
          }}
        >
          {history.length}/50
        </span>
      </h2>

      {history.length > 0 && (
        <div className="history-actions">
          <button
            className="action-btn danger"
            onClick={() => {
              if (confirm('确定清空所有融合记录吗？')) clearHistory();
            }}
          >
            清空全部
          </button>
        </div>
      )}

      {history.length === 0 ? (
        <div className="empty-state" style={{ padding: '24px 8px' }}>
          <div className="empty-state-icon" style={{ fontSize: '30px' }}>
            ⚗
          </div>
          暂无融合记录
          <br />
          拖拽基因到融合槽开始实验
        </div>
      ) : (
        history.map((item) => (
          <div
            key={item.id}
            className="history-item"
            onClick={() => selectHistory(item)}
            title="点击查看详情"
          >
            <div className="history-thumb">
              <HistoryThumb result={item} />
            </div>
            <div className="history-info">
              <p className="history-name">{item.name}</p>
              <p className="history-time">
                {item.parentCreatures[0]} × {item.parentCreatures[1]}
                <br />
                {formatTime(item.timestamp)}
              </p>
            </div>
            <button
              className="delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                deleteFromHistory(item.id);
              }}
              aria-label="删除"
            >
              ×
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export function HistoryDetailModal() {
  const { selectedHistory, selectHistory } = useCreatureStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { RadarChart } = require('./RadarChart');

  useEffect(() => {
    if (selectedHistory && canvasRef.current) {
      GeneratorService.drawFusionCreature(
        canvasRef.current,
        selectedHistory.morphology,
        selectedHistory.colorPalette,
        300
      );
    }
  }, [selectedHistory]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') selectHistory(null);
    };
    if (selectedHistory) {
      window.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [selectedHistory, selectHistory]);

  if (!selectedHistory) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) selectHistory(null);
      }}
    >
      <div
        className="modal-content history-detail-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '560px' }}
      >
        <div className="modal-header">
          <div>
            <span
              style={{
                display: 'inline-block',
                padding: '3px 10px',
                borderRadius: '12px',
                background: 'rgba(255, 215, 0, 0.15)',
                color: '#FFD700',
                fontSize: '12px',
                marginBottom: '6px',
              }}
            >
              融合生物 #{selectedHistory.timestamp.toString().slice(-4)}
            </span>
            <h2 className="modal-title">{selectedHistory.name}</h2>
            <p style={{ fontSize: '13px', color: '#aaa', marginTop: '4px' }}>
              融合自 <span style={{ color: '#c471ed' }}>{selectedHistory.parentCreatures[0]}</span> 与{' '}
              <span style={{ color: '#c471ed' }}>{selectedHistory.parentCreatures[1]}</span>
            </p>
          </div>
          <button className="close-btn" onClick={() => selectHistory(null)}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              background:
                'radial-gradient(circle at center, rgba(106, 90, 205, 0.15), transparent 70%)',
              borderRadius: '16px',
              padding: '10px',
            }}
          >
            <canvas ref={canvasRef} style={{ borderRadius: '12px' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <RadarChart abilities={selectedHistory.abilities} size={230} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <p className="result-description">{selectedHistory.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
