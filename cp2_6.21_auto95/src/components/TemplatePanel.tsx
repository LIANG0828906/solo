import React, { useMemo } from 'react';
import { useCard } from '../App';
import { templates } from '../data/templates';
import type { CardTemplate, Layer } from '../types/card';

function TemplateMiniPreview({ tpl }: { tpl: CardTemplate }) {
  const textLayers = tpl.layers.filter(l => l.type === 'text') as (Layer & { text: NonNullable<Layer['text']> })[];
  const decoLayers = tpl.layers.filter(l => l.type === 'decoration').slice(0, 2);

  return (
    <svg viewBox="0 0 60 80" className="mini-preview-svg" preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width="60" height="80" fill={tpl.bgColor} rx="2" />
      {decoLayers.map((layer, i) => (
        <circle
          key={i}
          cx={10 + (layer.x + layer.width / 2) / 10}
          cy={10 + (layer.y + layer.height / 2) / 10}
          r={4 + i}
          fill={tpl.id === 'new-year-firework' ? '#FFD700' : '#FFB6C1'}
          opacity={0.4}
        />
      ))}
      {textLayers.map((layer, i) => {
        const tx = layer.x / 10;
        const ty = layer.y / 10;
        const tw = layer.width / 10;
        const th = Math.max(3, layer.height / 15);
        return (
          <g key={i}>
            <rect
              x={tx}
              y={ty}
              width={tw}
              height={th}
              rx={1}
              fill={layer.text.color}
              opacity={0.15}
            />
            <rect
              x={tx + tw * 0.15}
              y={ty + th / 2 - th * 0.2}
              width={tw * 0.7}
              height={th * 0.4}
              rx={0.5}
              fill={layer.text.color}
              opacity={0.7}
            />
          </g>
        );
      })}
      <text
        x="30"
        y="72"
        textAnchor="middle"
        fontSize="14"
        style={{ pointerEvents: 'none' }}
      >
        {tpl.emoji}
      </text>
    </svg>
  );
}

export function TemplatePanel() {
  const { state, loadTemplate } = useCard();

  const handleClick = (tplId: string) => {
    loadTemplate(tplId);
  };

  return (
    <div className="template-panel">
      <div className="panel-header">
        <span className="panel-icon">📋</span>
        <h2>模板库</h2>
        <span className="panel-badge">{templates.length}</span>
      </div>
      <div className="template-list">
        {templates.map((tpl, idx) => {
          const isActive = state.currentTemplateId === tpl.id;
          return (
            <div
              key={tpl.id}
              className={`template-card ${isActive ? 'active' : ''}`}
              onClick={() => handleClick(tpl.id)}
              style={{ animationDelay: `${idx * 0.08}s` }}
            >
              <div className="template-thumb">
                <div className="mini-preview-wrapper">
                  <TemplateMiniPreview tpl={tpl} />
                </div>
                <div className={`template-checkmark ${isActive ? 'show' : ''}`}>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className="template-shine" />
              </div>
              <div className="template-info">
                <div className="template-title-row">
                  <span className="template-emoji-small">{tpl.emoji}</span>
                  <span className="template-name">{tpl.name}</span>
                </div>
                <span className="template-sub">点击应用</span>
              </div>
            </div>
          );
        })}
      </div>
      <style>{`
        .template-panel {
          width: 230px;
          min-width: 230px;
          background: linear-gradient(180deg, var(--color-surface) 0%, var(--color-bg) 100%);
          border-right: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
        }
        .panel-header {
          padding: 18px 16px 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid var(--color-border);
          flex-shrink: 0;
          position: relative;
          background: var(--color-surface);
        }
        .panel-icon { font-size: 20px; }
        .panel-header h2 {
          font-size: 16px;
          font-weight: 700;
          color: var(--color-primary);
          flex: 1;
        }
        .panel-badge {
          min-width: 22px;
          height: 22px;
          border-radius: 11px;
          background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
          color: #FFF;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 6px;
          box-shadow: 0 2px 6px var(--color-shadow);
        }
        .template-list {
          flex: 1;
          overflow-y: auto;
          padding: 14px 12px 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          scrollbar-width: thin;
          scrollbar-color: var(--color-primary) var(--color-bg);
        }
        .template-list::-webkit-scrollbar {
          width: 6px;
        }
        .template-list::-webkit-scrollbar-track {
          background: var(--color-bg);
          border-radius: 3px;
          margin: 4px 0;
        }
        .template-list::-webkit-scrollbar-thumb {
          background: rgba(255, 107, 107, 0.5);
          border-radius: 3px;
          transition: background 0.2s ease;
        }
        .template-list::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 107, 107, 0.8);
        }
        .template-card {
          border-radius: var(--radius-lg);
          overflow: hidden;
          cursor: pointer;
          border: 2px solid transparent;
          background: var(--color-surface);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          opacity: 0;
          transform: translateX(-12px);
          animation: slideInCard 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          position: relative;
        }
        @keyframes slideInCard {
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .template-card:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 10px 24px rgba(255, 107, 107, 0.18), 0 4px 12px rgba(0,0,0,0.06);
          border-color: var(--color-primary-light);
        }
        .template-card:hover .template-shine {
          transform: translateX(150%) skewX(-10deg);
          transition: transform 0.6s ease;
        }
        .template-card.active {
          border-color: var(--color-primary);
          background: linear-gradient(135deg, #FFF5F5 0%, var(--color-surface) 100%);
          transform: translateY(-2px) scale(1.03);
          box-shadow:
            0 0 0 4px rgba(255, 107, 107, 0.12),
            0 12px 28px rgba(255, 107, 107, 0.22),
            0 4px 10px rgba(0,0,0,0.06);
        }
        .template-card.active::after {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: calc(var(--radius-lg) + 2px);
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
          z-index: -1;
          opacity: 0.35;
          filter: blur(4px);
        }
        .template-thumb {
          height: 135px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          padding: 10px;
        }
        .mini-preview-wrapper {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .mini-preview-svg {
          width: 100%;
          height: 100%;
          border-radius: var(--radius-md);
          box-shadow:
            0 4px 14px rgba(0,0,0,0.1),
            inset 0 0 0 1px rgba(0,0,0,0.03);
        }
        .template-checkmark {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 8px rgba(255, 107, 107, 0.45);
          transform: scale(0) rotate(-180deg);
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          z-index: 5;
        }
        .template-checkmark.show {
          transform: scale(1) rotate(0deg);
        }
        .template-shine {
          position: absolute;
          top: 0;
          left: -60%;
          width: 50%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.5),
            transparent
          );
          transform: translateX(-100%) skewX(-10deg);
          pointer-events: none;
          z-index: 3;
        }
        .template-info {
          padding: 10px 12px 12px;
          background: var(--color-bg);
          border-top: 1px solid rgba(0,0,0,0.03);
          transition: background 0.3s ease;
        }
        .template-card.active .template-info {
          background: linear-gradient(180deg, #FFF8F8 0%, var(--color-bg) 100%);
        }
        .template-title-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .template-emoji-small {
          font-size: 14px;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));
        }
        .template-name {
          font-size: 13px;
          font-weight: 700;
          color: var(--color-text);
          letter-spacing: 0.2px;
        }
        .template-sub {
          display: block;
          margin-top: 3px;
          font-size: 10px;
          color: var(--color-text-light);
          opacity: 0.7;
          transition: opacity 0.3s ease, color 0.3s ease;
        }
        .template-card.active .template-sub,
        .template-card:hover .template-sub {
          opacity: 1;
          color: var(--color-primary);
        }
        @media (max-width: 1366px) {
          .template-panel {
            width: 100%;
            min-width: unset;
            height: auto;
            max-height: 160px;
            border-right: none;
            border-bottom: 1px solid var(--color-border);
          }
          .template-list {
            flex-direction: row;
            overflow-x: auto;
            overflow-y: hidden;
            padding: 10px 12px 14px;
          }
          .template-list::-webkit-scrollbar {
            width: auto;
            height: 4px;
          }
          .template-card {
            min-width: 140px;
            flex-shrink: 0;
            animation: fadeInCard 0.4s ease forwards;
            transform: translateY(8px);
          }
          @keyframes fadeInCard {
            to { opacity: 1; transform: translateY(0); }
          }
          .template-thumb { height: 80px; padding: 6px; }
        }
        @media (max-width: 768px) {
          .template-panel { display: none; }
        }
      `}</style>
    </div>
  );
}
