import React, { useCallback } from 'react';
import html2canvas from 'html2canvas';
import { useAppStore } from '../store';
import { useColorScheme } from '../hooks/useColorScheme';
import { playDropSound } from '../utils/audioUtils';

export const ExportButton: React.FC = () => {
  const { colorScheme } = useAppStore();
  const { currentScheme } = useColorScheme(colorScheme);

  const handleExport = useCallback(async () => {
    const paperElement = document.getElementById('paper-canvas');
    if (!paperElement) return;

    playDropSound();

    try {
      const canvas = await html2canvas(paperElement, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
        logging: false,
      });

      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = 1200;
      exportCanvas.height = 800;
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(canvas, 0, 0, 1200, 800);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `花草笺_${currentScheme.name}_${timestamp}.png`;

      const link = document.createElement('a');
      link.download = fileName;
      link.href = exportCanvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Export failed:', e);
    }
  }, [currentScheme]);

  return (
    <button
      onClick={handleExport}
      className="px-6 py-3 rounded text-lg font-bold transition-all duration-200"
      style={{
        fontFamily: '"KaiTi", "STKaiti", "楷体", serif',
        color: '#3e2723',
        background: 'linear-gradient(135deg, #f5deb3, #d2b48c)',
        border: '2px solid #3e2723',
        boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'translateY(1px)';
        e.currentTarget.style.boxShadow = '0 2px 3px rgba(0,0,0,0.2)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.2)';
      }}
    >
      落笺
    </button>
  );
};
