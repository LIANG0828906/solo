import { useState } from 'react';

export interface FontData {
  name: string;
  family: string;
  category: 'serif' | 'sans-serif' | 'monospace' | 'display' | 'handwriting';
  weights: number[];
  popularity: number;
}

interface FontCardListProps {
  fonts: FontData[];
  selectedHeading: string;
  selectedBody: string;
  onSelectHeading: (f: FontData) => void;
  onSelectBody: (f: FontData) => void;
  selectionMode: 'heading' | 'body';
}

const styles = `
  @keyframes pulseDot {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.25); opacity: 0.7; }
  }
  .font-card {
    position: relative;
    background: #FFFFFF;
    border: 1px solid #E8E8E8;
    border-radius: 10px;
    padding: 18px 16px 14px;
    cursor: pointer;
    opacity: 0;
    transform: translateY(8px);
    animation: fadeInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
    overflow: hidden;
  }
  @keyframes fadeInUp {
    to { opacity: 1; transform: translateY(0); }
  }
  .font-card:hover {
    border-color: #D0D0D0;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  }
  .font-card.selected {
    border: 2px solid #E27D60;
    transform: scale(1.03);
    box-shadow: 0 6px 20px rgba(226, 125, 96, 0.18);
  }
  .font-card .card-buttons {
    display: flex;
    gap: 6px;
    margin-top: 10px;
    opacity: 0;
    transform: translateY(4px);
    transition: opacity 0.2s ease, transform 0.2s ease;
  }
  .font-card:hover .card-buttons {
    opacity: 1;
    transform: translateY(0);
  }
  .card-btn {
    flex: 1;
    font-size: 11px;
    padding: 5px 8px;
    border-radius: 6px;
    border: 1px solid #E0E0E0;
    background: #FAFAFA;
    color: #555;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .card-btn:hover {
    background: #E27D60;
    border-color: #E27D60;
    color: #FFFFFF;
  }
  .selected-dot {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #E27D60;
    animation: pulseDot 1s ease-in-out infinite;
  }
  .sample-text {
    font-size: 15px;
    color: #2C2C2C;
    line-height: 1.5;
    min-height: 48px;
    word-break: break-word;
    margin-bottom: 12px;
  }
  .font-meta-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .font-name {
    font-size: 12px;
    color: #4A4A4A;
    font-weight: 600;
  }
  .font-category {
    font-size: 10px;
    color: #A0A0A0;
    text-transform: lowercase;
  }
`;

export default function FontCardList({
  fonts,
  selectedHeading,
  selectedBody,
  onSelectHeading,
  onSelectBody,
  selectionMode,
}: FontCardListProps) {
  const [styleMounted] = useState(() => {
    if (typeof document !== 'undefined' && !document.getElementById('font-card-list-styles')) {
      const el = document.createElement('style');
      el.id = 'font-card-list-styles';
      el.textContent = styles;
      document.head.appendChild(el);
    }
    return true;
  });

  const handleCardClick = (font: FontData) => {
    if (selectionMode === 'heading') {
      onSelectHeading(font);
    } else {
      onSelectBody(font);
    }
  };

  const isSelected = (font: FontData) =>
    font.family === selectedHeading || font.family === selectedBody;

  const getSelectionLabel = (font: FontData) => {
    if (font.family === selectedHeading && font.family === selectedBody) return '标题+正文';
    if (font.family === selectedHeading) return '标题';
    if (font.family === selectedBody) return '正文';
    return null;
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, padding: 4 }}>
      {styleMounted && null}
      {fonts.map((font, idx) => {
        const selected = isSelected(font);
        const label = getSelectionLabel(font);
        return (
          <div
            key={font.family}
            className={`font-card${selected ? ' selected' : ''}`}
            style={{ animationDelay: `${idx * 40}ms` }}
            onClick={() => handleCardClick(font)}
          >
            {selected && <div className="selected-dot" title={label ?? ''} />}
            <div className="sample-text" style={{ fontFamily: font.family }}>
              Quick brown fox jumps over the lazy dog
            </div>
            <div className="font-meta-row">
              <span className="font-name">{font.name}</span>
              <span className="font-category">{font.category}</span>
            </div>
            <div
              className="card-buttons"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="card-btn"
                onClick={() => onSelectHeading(font)}
                title="选作标题字体"
              >
                选作标题
              </button>
              <button
                className="card-btn"
                onClick={() => onSelectBody(font)}
                title="选作正文字体"
              >
                选作正文
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
