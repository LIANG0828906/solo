import { useRef, useEffect, useState, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { getVowelColor, formatDate } from '../utils/helpers';

export default function Timeline() {
  const notes = useAppStore((state) => state.notes);
  const filterFamily = useAppStore((state) => state.filterFamily);
  const timelineRef = useRef<HTMLDivElement>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  const sortedNotes = [...notes]
    .filter((n) => !filterFamily || n.languageFamily === filterFamily)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const scrollToNote = (noteId: number) => {
    const cardElement = document.querySelector(`[data-note-id="${noteId}"]`);
    if (cardElement) {
      cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      cardElement.classList.add('highlight');
      setTimeout(() => cardElement.classList.remove('highlight'), 2000);
    }
  };

  const exportSVG = useCallback(() => {
    if (sortedNotes.length === 0) return;

    const width = Math.max(800, sortedNotes.length * 60 + 100);
    const height = 120;
    const timelineY = 60;

    const dates = sortedNotes.map((n) => new Date(n.createdAt).getTime());
    const minDate = dates[0];
    const maxDate = dates[dates.length - 1];
    const range = maxDate - minDate || 1;

    const getX = (date: number) => 40 + ((date - minDate) / range) * (width - 80);

    let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#2C2C2C;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1A1A1A;stop-opacity:1" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bgGrad)" rx="8"/>
  <line x1="30" y1="${timelineY}" x2="${width - 30}" y2="${timelineY}" stroke="#555" stroke-width="2"/>
`;

    const yearMonths = getYearMonthTicks(minDate, maxDate);
    yearMonths.forEach(({ date, label }) => {
      const x = getX(date.getTime());
      svgContent += `  <line x1="${x}" y1="${timelineY - 8}" x2="${x}" y2="${timelineY + 8}" stroke="#666" stroke-width="1"/>
  <text x="${x}" y="${timelineY + 24}" text-anchor="middle" fill="#888" font-size="10" font-family="sans-serif">${label}</text>
`;
    });

    sortedNotes.forEach((note) => {
      const x = getX(new Date(note.createdAt).getTime());
      const color = getVowelColor(note.ipa);
      svgContent += `  <circle cx="${x}" cy="${timelineY}" r="6" fill="${color}" filter="url(#glow)"/>
  <text x="${x}" y="${timelineY - 14}" text-anchor="middle" fill="#E0E0E0" font-size="10" font-family="sans-serif">${escapeXml(note.word)}</text>
`;
    });

    svgContent += `</svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'voice-timeline.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [sortedNotes]);

  const generateTicks = () => {
    if (sortedNotes.length === 0) return [];

    const dates = sortedNotes.map((n) => new Date(n.createdAt));
    const minDate = dates[0];
    const maxDate = dates[dates.length - 1];

    return getYearMonthTicks(minDate.getTime(), maxDate.getTime());
  };

  const ticks = generateTicks();

  return (
    <div className="timeline-container">
      <div className="timeline-toolbar">
        <button className="export-btn" onClick={exportSVG}>
          <span className="export-icon">⬇</span>
          导出为SVG
        </button>
        <div className="timeline-info">
          共 {sortedNotes.length} 条笔记
        </div>
      </div>

      <div ref={timelineRef} className="timeline-scroll">
        <div ref={svgContainerRef} className="timeline-track">
          <div className="timeline-line" />
          
          <div className="timeline-ticks">
            {ticks.map((tick, i) => (
              <div
                key={i}
                className="tick-mark"
                style={{ left: `${getTickPosition(tick.date.getTime(), sortedNotes)}%` }}
              >
                <div className="tick-line" />
                <div className="tick-label">{tick.label}</div>
              </div>
            ))}
          </div>

          <div className="timeline-dots">
            {sortedNotes.map((note) => {
              const color = getVowelColor(note.ipa);
              return (
                <div
                  key={note.id}
                  className="timeline-dot"
                  style={{
                    left: `${getTickPosition(new Date(note.createdAt).getTime(), sortedNotes)}%`,
                    background: color,
                    boxShadow: `0 0 8px ${color}`,
                  }}
                  onClick={() => scrollToNote(note.id)}
                  title={`${note.word} - ${formatDate(note.createdAt)}`}
                />
              );
            })}
          </div>
        </div>
      </div>

      <style>{timelineStyles}</style>
    </div>
  );
}

function getTickPosition(date: number, notes: any[]): number {
  if (notes.length === 0) return 0;
  
  const dates = notes.map((n) => new Date(n.createdAt).getTime());
  const minDate = dates[0];
  const maxDate = dates[dates.length - 1];
  const range = maxDate - minDate || 1;
  
  return 5 + ((date - minDate) / range) * 90;
}

function getYearMonthTicks(minTs: number, maxTs: number): { date: Date; label: string }[] {
  const ticks: { date: Date; label: string }[] = [];
  const minDate = new Date(minTs);
  const maxDate = new Date(maxTs);
  
  let current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  
  while (current <= maxDate) {
    ticks.push({
      date: new Date(current),
      label: `${current.getFullYear()}.${(current.getMonth() + 1).toString().padStart(2, '0')}`,
    });
    current.setMonth(current.getMonth() + 1);
  }
  
  if (ticks.length > 12) {
    const step = Math.ceil(ticks.length / 12);
    return ticks.filter((_, i) => i % step === 0 || i === ticks.length - 1);
  }
  
  return ticks;
}

function escapeXml(str: string): string {
  return str.replace(/[<>&'"]/g, (c) => {
    const map: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      "'": '&apos;',
      '"': '&quot;',
    };
    return map[c] || c;
  });
}

const timelineStyles = `
  .timeline-container {
    width: 100%;
    background: #1E1E2E;
    border-radius: 12px;
    padding: 12px 16px;
    box-sizing: border-box;
  }

  .timeline-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .export-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: linear-gradient(135deg, #7C4DFF, #00BFFF);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 6px 12px;
    font-size: 12px;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .export-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(124, 77, 255, 0.4);
  }

  .export-icon {
    font-size: 10px;
  }

  .timeline-info {
    color: #888;
    font-size: 12px;
  }

  .timeline-scroll {
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 8px;
  }

  .timeline-scroll::-webkit-scrollbar {
    height: 4px;
  }

  .timeline-scroll::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 2px;
  }

  .timeline-scroll::-webkit-scrollbar-thumb {
    background: #3D3D3D;
    border-radius: 2px;
  }

  .timeline-track {
    position: relative;
    min-width: 100%;
    height: 80px;
    background: linear-gradient(180deg, #2C2C2C 0%, #1A1A1A 100%);
    border-radius: 8px;
    padding: 0 20px;
    box-sizing: border-box;
  }

  .timeline-line {
    position: absolute;
    top: 50%;
    left: 20px;
    right: 20px;
    height: 2px;
    background: #444;
    transform: translateY(-50%);
  }

  .timeline-ticks {
    position: absolute;
    top: 0;
    left: 20px;
    right: 20px;
    height: 100%;
  }

  .tick-mark {
    position: absolute;
    top: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .tick-line {
    width: 1px;
    height: 12px;
    background: #555;
  }

  .tick-label {
    margin-top: 4px;
    font-size: 10px;
    color: #666;
    white-space: nowrap;
    font-family: monospace;
  }

  .timeline-dots {
    position: absolute;
    top: 0;
    left: 20px;
    right: 20px;
    height: 100%;
  }

  .timeline-dot {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 12px;
    height: 12px;
    border-radius: 50%;
    cursor: pointer;
    transition: transform 0.2s;
  }

  .timeline-dot:hover {
    transform: translate(-50%, -50%) scale(1.3);
  }
`;
