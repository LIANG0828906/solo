import { useCardStore, Card } from './store';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

interface ExportToolsProps {
  canvasRef: React.RefObject<HTMLDivElement>;
  onAddCard: () => void;
}

const voiceWaveformBars = Array.from({ length: 20 }, (_, i) => {
  return 8 + (Math.sin(i * 0.5) + 1) * 6;
});

const generateStaticCardHTML = (card: Card): string => {
  const baseStyle = `position:absolute;left:${card.position.x}px;top:${card.position.y}px;transform:rotate(${card.rotation}deg);`;

  switch (card.type) {
    case 'text':
      return `<div style="${baseStyle}min-width:200px;max-width:300px;padding:16px;background:white;border:2px solid #3B82F6;border-radius:8px;font-family:system-ui,sans-serif;box-sizing:border-box;">
        <div style="font-size:14px;color:#111827;white-space:pre-wrap;word-break:break-word;">${escapeHtml(card.content)}</div>
      </div>`;

    case 'image':
      return `<div style="${baseStyle}width:240px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.3);overflow:hidden;">
        ${card.imageUrl ? `<img src="${card.imageUrl}" style="width:100%;display:block;border-radius:12px;" alt=""/>` : ''}
      </div>`;

    case 'voice':
      return `<div style="${baseStyle}min-width:200px;max-width:280px;padding:16px;background:#7C3AED;border-radius:16px;color:white;font-family:system-ui,sans-serif;box-sizing:border-box;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:36px;height:36px;border-radius:50%;background-color:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <polygon points="6 4 20 12 6 20 6 4"></polygon>
            </svg>
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:12px;opacity:0.8;margin-bottom:4px;">语音片段</div>
            <div style="display:flex;align-items:center;gap:2px;height:16px;">
              ${voiceWaveformBars.map((h) => `<div style="width:2px;height:${h}px;background:rgba(255,255,255,0.6);border-radius:1px;"></div>`).join('')}
            </div>
          </div>
        </div>
      </div>`;

    case 'todo':
      return `<div style="${baseStyle}min-width:200px;max-width:300px;padding:12px 16px;background:white;border-radius:8px;border-left:4px solid #EF4444;font-family:system-ui,sans-serif;box-sizing:border-box;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:20px;height:20px;border-radius:4px;box-sizing:border-box;flex-shrink:0;display:flex;align-items:center;justify-content:center;${card.checked ? 'border:2px solid #10B981;background-color:#10B981;' : 'border:2px solid #D1D5DB;background-color:white;'}">
            ${card.checked ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="white"><polygon points="9 16.17 4.83 12 3.41 13.41 9 19 21 7 19.59 5.59 9 16.17"/></svg>` : ''}
          </div>
          <div style="font-size:14px;color:${card.checked ? '#9CA3AF' : '#111827'};text-decoration:${card.checked ? 'line-through' : 'none'};flex:1;word-break:break-word;">${escapeHtml(card.content)}</div>
        </div>
      </div>`;

    default:
      return '';
  }
};

const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

export default function ExportTools({ canvasRef, onAddCard }: ExportToolsProps) {
  const clearCards = useCardStore((state) => state.clearCards);
  const cards = useCardStore((state) => state.cards);
  const toggleGrid = useCardStore((state) => state.toggleGrid);
  const gridEnabled = useCardStore((state) => state.gridEnabled);

  const exportPNG = async () => {
    if (!canvasRef.current) return;

    try {
      const canvas = await html2canvas(canvasRef.current, {
        scale: 2,
        backgroundColor: '#1F2937',
        useCORS: true,
        logging: false,
      });

      canvas.toBlob((blob) => {
        if (blob) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          saveAs(blob, `MosaicNote_${timestamp}.png`);
        }
      });
    } catch (error) {
      console.error('Export PNG failed:', error);
    }
  };

  const exportHTML = () => {
    const cardsHTML = cards.map(generateStaticCardHTML).join('\n');

    const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MosaicNote Export</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background-color: #111827;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      min-height: 100vh;
      padding: 40px;
    }
    .canvas-container {
      position: relative;
      background-color: #1F2937;
      border-radius: 12px;
      min-width: 1200px;
      min-height: 800px;
      margin: 0 auto;
      overflow: hidden;
    }
    .canvas-inner {
      position: relative;
      min-width: 3000px;
      min-height: 2000px;
      padding: 40px;
      background-image:
        linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
      background-size: 16px 16px;
    }
    .header {
      max-width: 1200px;
      margin: 0 auto 20px;
      color: white;
    }
    .header h1 { font-size: 24px; margin-bottom: 8px; font-weight: 600; }
    .header p { color: #9CA3AF; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>MosaicNote</h1>
    <p>导出时间: ${new Date().toLocaleString('zh-CN')} | 卡片数量: ${cards.length}</p>
  </div>
  <div class="canvas-container">
    <div class="canvas-inner">
${cardsHTML}
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    saveAs(blob, `MosaicNote_${timestamp}.html`);
  };

  const handleClear = () => {
    if (window.confirm('确定要清空所有卡片吗？此操作不可撤销。')) {
      clearCards();
    }
  };

  const buttonStyle = {
    padding: '10px 18px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '8px',
        padding: '6px 10px',
        backgroundColor: '#1F2937',
        borderRadius: '12px',
        height: '48px',
        alignItems: 'center',
        zIndex: 100,
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      <button
        onClick={onAddCard}
        style={{
          ...buttonStyle,
          backgroundColor: '#3B82F6',
          color: 'white',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#60A5FA')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#3B82F6')}
      >
        <span style={{ fontSize: '18px' }}>+</span> 新建卡片
      </button>

      <div style={{ width: '1px', height: '28px', backgroundColor: '#374151', margin: '0 4px' }} />

      <button
        onClick={exportPNG}
        style={{
          ...buttonStyle,
          backgroundColor: '#374151',
          color: 'white',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4B5563')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#374151')}
      >
        📷 导出PNG
      </button>

      <button
        onClick={exportHTML}
        style={{
          ...buttonStyle,
          backgroundColor: '#374151',
          color: 'white',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4B5563')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#374151')}
      >
        🌐 导出HTML
      </button>

      <button
        onClick={toggleGrid}
        style={{
          ...buttonStyle,
          backgroundColor: gridEnabled ? '#059669' : '#374151',
          color: 'white',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = gridEnabled ? '#10B981' : '#4B5563')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = gridEnabled ? '#059669' : '#374151')}
      >
        网格
      </button>

      <button
        onClick={handleClear}
        style={{
          ...buttonStyle,
          background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
          color: 'white',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
      >
        🗑️ 清空白板
      </button>
    </div>
  );
}
