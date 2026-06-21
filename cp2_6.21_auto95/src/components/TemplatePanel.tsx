import React from 'react';
import { useCard } from '../App';
import { templates } from '../data/templates';

export function TemplatePanel() {
  const { state, loadTemplate } = useCard();

  return (
    <div className="template-panel">
      <div className="panel-header">
        <span className="panel-icon">📋</span>
        <h2>模板库</h2>
      </div>
      <div className="template-list">
        {templates.map(tpl => (
          <div
            key={tpl.id}
            className={`template-card ${state.currentTemplateId === tpl.id ? 'active' : ''}`}
            onClick={() => loadTemplate(tpl.id)}
          >
            <div
              className="template-thumb"
              style={{ backgroundColor: tpl.bgColor }}
            >
              <span className="template-emoji">{tpl.emoji}</span>
            </div>
            <div className="template-info">
              <span className="template-name">{tpl.name}</span>
            </div>
          </div>
        ))}
      </div>
      <style>{`
        .template-panel {
          width: 220px;
          min-width: 220px;
          background: var(--color-surface);
          border-right: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
        }
        .panel-header {
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid var(--color-border);
          flex-shrink: 0;
        }
        .panel-icon { font-size: 20px; }
        .panel-header h2 {
          font-size: 16px;
          font-weight: 700;
          color: var(--color-primary);
        }
        .template-list {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .template-card {
          border-radius: var(--radius-lg);
          overflow: hidden;
          cursor: pointer;
          border: 2px solid transparent;
          transition: all var(--transition-normal);
          box-shadow: var(--shadow-sm);
        }
        .template-card:hover {
          transform: scale(1.03);
          box-shadow: var(--shadow-hover);
          border-color: var(--color-primary-light);
        }
        .template-card.active {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-shadow);
        }
        .template-thumb {
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .template-emoji {
          font-size: 48px;
          filter: drop-shadow(0 2px 8px rgba(0,0,0,0.15));
        }
        .template-info {
          padding: 8px 12px;
          background: var(--color-bg);
        }
        .template-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text);
        }
        @media (max-width: 1366px) {
          .template-panel {
            width: 100%;
            min-width: unset;
            height: auto;
            max-height: 140px;
            border-right: none;
            border-bottom: 1px solid var(--color-border);
          }
          .template-list {
            flex-direction: row;
            overflow-x: auto;
            overflow-y: hidden;
            padding: 8px 12px;
          }
          .template-card {
            min-width: 120px;
            flex-shrink: 0;
          }
          .template-thumb { height: 70px; }
          .template-emoji { font-size: 32px; }
        }
        @media (max-width: 768px) {
          .template-panel { display: none; }
        }
      `}</style>
    </div>
  );
}
