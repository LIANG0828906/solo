import React, { useState, useRef } from 'react';
import { useCharacterStore } from '../stores/characterStore';
import { Download, ChevronDown, Check } from 'lucide-react';
import html2canvas from 'html2canvas';

interface TopBarProps {
  onExportSuccess?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onExportSuccess }) => {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const characters = useCharacterStore((s) => s.characters);
  const relations = useCharacterStore((s) => s.relations);
  const selectedCharacterId = useCharacterStore((s) => s.selectedCharacterId);

  const showSuccess = () => {
    setExportSuccess(true);
    onExportSuccess?.();
    setTimeout(() => setExportSuccess(false), 1500);
  };

  const exportCharacterCard = async () => {
    const panel = document.getElementById('character-detail-panel');
    if (!panel) {
      alert('请先选择一个角色');
      return;
    }

    try {
      const canvas = await html2canvas(panel, {
        backgroundColor: '#1A1A2E',
        scale: 2,
        width: 320,
      });

      const link = document.createElement('a');
      const char = characters.find((c) => c.id === selectedCharacterId);
      link.download = `${char?.name || '角色'}_角色卡.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showSuccess();
    } catch (err) {
      console.error('导出失败:', err);
      alert('导出失败，请重试');
    }

    setIsExportOpen(false);
  };

  const exportGraphSVG = () => {
    const canvas = document.querySelector('.force-graph-container canvas');
    if (!canvas) {
      alert('图谱未加载');
      return;
    }

    const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="#0A0A2E"/>
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#4A4A6A"/>
    </marker>
  </defs>
  ${relations
    .map((rel, i) => {
      const source = characters.find((c) => c.id === rel.sourceId);
      const target = characters.find((c) => c.id === rel.targetId);
      if (!source || !target) return '';
      const x1 = 200 + (i % 3) * 150;
      const y1 = 150 + Math.floor(i / 3) * 120;
      const x2 = 450 + (i % 2) * 100;
      const y2 = 200 + Math.floor(i / 2) * 100;
      const dash = rel.style === 'dashed' ? 'stroke-dasharray="8,4"' : '';
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#4A4A6A" stroke-width="2" ${dash} marker-end="url(#arrowhead)"/>`;
    })
    .join('')}
  ${characters
    .map((char, i) => {
      const colors: Record<string, string> = {
        protagonist: '#00B894',
        deuteragonist: '#FDCB6E',
        antagonist: '#FF6B6B',
      };
      const x = 150 + (i % 4) * 180;
      const y = 150 + Math.floor(i / 4) * 150;
      const r = 20 + char.stats / 10;
      return `
        <circle cx="${x}" cy="${y}" r="${r}" fill="${colors[char.faction]}" stroke="#fff" stroke-width="2"/>
        <text x="${x}" y="${y + 4}" text-anchor="middle" fill="#DFE6E9" font-size="12" font-family="sans-serif" font-weight="bold">${char.name}</text>
      `;
    })
    .join('')}
</svg>
    `.trim();

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = '关系图谱.svg';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    showSuccess();
    setIsExportOpen(false);
  };

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="top-bar">
        <div className="top-bar-left">
          <h1 className="app-title">角色速写板</h1>
          <span className="app-subtitle">Character Sketchpad</span>
        </div>
        <div className="top-bar-right" ref={dropdownRef}>
          <button
            className="export-btn"
            onClick={() => setIsExportOpen(!isExportOpen)}
          >
            <Download size={16} />
            导出
            <ChevronDown size={14} className={`chevron ${isExportOpen ? 'open' : ''}`} />
          </button>
          {isExportOpen && (
            <div className="export-dropdown">
              <button className="dropdown-item" onClick={exportCharacterCard}>
                导出角色卡 (PNG)
              </button>
              <button className="dropdown-item" onClick={exportGraphSVG}>
                导出关系图谱 (SVG)
              </button>
            </div>
          )}
        </div>
      </header>
      {exportSuccess && (
        <div className="export-success-toast">
          <Check size={18} />
          导出成功！
        </div>
      )}
    </>
  );
};

export default TopBar;
